import type {
  ClintApiError,
  ClintPaginatedV1,
  ClintPaginatedV2,
} from "./types.js";

const CLINT_API_BASE = "https://api.clint.digital";

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const REQUEST_TIMEOUT_MS = 30_000;

export class ClintApiRequestError extends Error {
  status: number | undefined;
  apiMessage: string | undefined;

  constructor(message: string, status?: number, apiMessage?: string) {
    super(message);
    this.name = "ClintApiRequestError";
    this.status = status;
    this.apiMessage = apiMessage;
  }
}

function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type Json = unknown;
type Method = "GET" | "POST" | "DELETE";

export class ClintClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /**
   * Core request — handles retries on 429/5xx, parses errors, returns JSON.
   * Endpoint should start with /v1/... or /v2/...
   */
  async request<T>(
    endpoint: string,
    opts: {
      method?: Method;
      query?: Record<string, string | number | boolean | undefined | null>;
      body?: Json;
    } = {},
  ): Promise<T> {
    const { method = "GET", query, body } = opts;

    const url = new URL(`${CLINT_API_BASE}${endpoint}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      "api-token": this.token,
      Accept: "application/json",
    };

    let init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init = { ...init, body: JSON.stringify(body) };
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetchWithTimeout(url.toString(), init);

        // 204 No Content — success with empty body
        if (response.status === 204) {
          return { status: 204 } as T;
        }

        // Some endpoints return empty body on success (e.g. POST tags assign)
        const text = await response.text();
        const parsed: unknown = text
          ? safeJsonParse(text)
          : { status: response.status };

        if (response.ok) {
          return parsed as T;
        }

        // Build error
        const apiErr = parsed as ClintApiError;
        const apiMsg =
          apiErr?.message || apiErr?.error || `HTTP ${response.status}`;
        const err = new ClintApiRequestError(
          `Clint API error (${response.status}): ${apiMsg}`,
          response.status,
          apiMsg,
        );

        // Retry 429 / 5xx (transient)
        if (
          (response.status === 429 || response.status >= 500) &&
          attempt < MAX_RETRIES
        ) {
          const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await sleep(backoff);
          lastError = err;
          continue;
        }

        throw err;
      } catch (e) {
        if (e instanceof ClintApiRequestError) throw e;

        if (e instanceof DOMException && e.name === "AbortError") {
          lastError = new Error(
            `Request timeout (${REQUEST_TIMEOUT_MS / 1000}s) para ${endpoint}`,
          );
          if (attempt < MAX_RETRIES) {
            await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
            continue;
          }
        }

        lastError = e instanceof Error ? e : new Error(String(e));
        if (attempt < MAX_RETRIES) {
          await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt));
          continue;
        }
      }
    }

    throw (
      lastError || new Error(`Request failed after ${MAX_RETRIES + 1} attempts`)
    );
  }

  get<T>(
    endpoint: string,
    query?: Record<string, string | number | boolean | undefined | null>,
  ) {
    return this.request<T>(endpoint, { method: "GET", query });
  }

  post<T>(
    endpoint: string,
    body?: Json,
    query?: Record<string, string | number | boolean | undefined | null>,
  ) {
    return this.request<T>(endpoint, { method: "POST", body, query });
  }

  delete<T>(
    endpoint: string,
    body?: Json,
    query?: Record<string, string | number | boolean | undefined | null>,
  ) {
    return this.request<T>(endpoint, { method: "DELETE", body, query });
  }

  /**
   * Auto-paginate a v1 endpoint up to maxPages. Default 5 pages × 200 items = 1000 items.
   * Stops early if hasNext is false or maxPages reached.
   */
  async paginateV1<T>(
    endpoint: string,
    query: Record<string, string | number | boolean | undefined | null> = {},
    maxPages = 5,
    pageSize = 200,
  ): Promise<T[]> {
    const all: T[] = [];
    let page = 1;
    while (page <= maxPages) {
      const res = await this.get<ClintPaginatedV1<T>>(endpoint, {
        ...query,
        limit: pageSize,
        page,
      });
      if (Array.isArray(res.data)) all.push(...res.data);
      if (!res.hasNext) break;
      page++;
      await sleep(150);
    }
    return all;
  }

  /**
   * Auto-paginate a v2 endpoint up to maxPages.
   */
  async paginateV2<T>(
    endpoint: string,
    query: Record<string, string | number | boolean | undefined | null> = {},
    maxPages = 5,
    pageSize = 200,
  ): Promise<T[]> {
    const all: T[] = [];
    let page = 1;
    while (page <= maxPages) {
      const res = await this.get<ClintPaginatedV2<T>>(endpoint, {
        ...query,
        limit: pageSize,
        page,
      });
      if (Array.isArray(res.data)) all.push(...res.data);
      if (!res.has_next) break;
      page++;
      await sleep(150);
    }
    return all;
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

let clientInstance: ClintClient | null = null;

export function getClintClient(): ClintClient {
  if (!clientInstance) {
    const token = process.env.CLINT_API_TOKEN;
    if (!token) {
      throw new Error(
        "CLINT_API_TOKEN is required. Set it as an environment variable. Generate token at https://app.clint.digital/ → Configurações → API.",
      );
    }
    clientInstance = new ClintClient(token);
  }
  return clientInstance;
}
