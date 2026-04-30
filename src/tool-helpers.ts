import type {
  McpServer,
  ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import { type ClintClient, getClintClient } from "./clint-client.js";

type ToolText = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function isToolText(value: unknown): value is ToolText {
  return (
    typeof value === "object" &&
    value !== null &&
    "content" in value &&
    Array.isArray((value as { content: unknown }).content)
  );
}

type SchemaArgs<T extends z.ZodRawShape> = Parameters<ToolCallback<T>>[0];

export function defineTool<T extends z.ZodRawShape>(
  server: McpServer,
  name: string,
  description: string,
  schema: T,
  handler: (args: SchemaArgs<T>, client: ClintClient) => Promise<unknown>,
): void {
  const cb = async (args: SchemaArgs<T>) => {
    try {
      const result = await handler(args, getClintClient());
      if (isToolText(result)) return result;
      const text =
        typeof result === "string" ? result : JSON.stringify(result, null, 2);
      return { content: [{ type: "text" as const, text }] };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        content: [{ type: "text" as const, text: `Erro: ${msg}` }],
        isError: true,
      };
    }
  };
  server.tool(name, description, schema, cb as unknown as ToolCallback<T>);
}

export function ok(text: string): ToolText {
  return { content: [{ type: "text" as const, text }] };
}

export function err(text: string): ToolText {
  return { content: [{ type: "text" as const, text }], isError: true };
}

/**
 * Filter undefined/null values from a body object so we don't send nulls to Clint.
 */
export function cleanBody<T extends Record<string, unknown>>(
  body: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    if (
      typeof v === "object" &&
      !Array.isArray(v) &&
      Object.keys(v as object).length === 0
    ) {
      continue;
    }
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
