import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { defineTool } from "../tool-helpers.js";
import type {
  ClintGroup,
  ClintLostStatus,
  ClintOrigin,
  ClintPaginatedV1,
  ClintSingleResponse,
  ClintUser,
} from "../types.js";

export function registerMiscTools(server: McpServer) {
  // Users
  defineTool(
    server,
    "list_users",
    "Lista usuarios da conta Clint (operadores).",
    {
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ limit, page }, client) => {
      const res = await client.get<ClintPaginatedV1<ClintUser>>("/v1/users", {
        limit: limit ?? 100,
        page,
      });
      return {
        page: res.page,
        total_pages: res.totalPages,
        total_count: res.totalCount,
        data: res.data,
      };
    },
  );

  defineTool(
    server,
    "get_user",
    "Detalhes de um usuario pelo ID.",
    { id: z.string().describe("UUID do usuario") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintUser>>(
        `/v1/users/${id}`,
      );
      return res.data;
    },
  );

  // Origins
  defineTool(
    server,
    "list_origins",
    "Lista todas as origins (funis/pipelines). Cada origin pertence a um group e tem suas stages.",
    {
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ limit, page }, client) => {
      const res = await client.get<ClintPaginatedV1<ClintOrigin>>(
        "/v1/origins",
        {
          limit: limit ?? 200,
          page,
        },
      );
      return {
        page: res.page,
        total_pages: res.totalPages,
        total_count: res.totalCount,
        data: res.data,
      };
    },
  );

  defineTool(
    server,
    "get_origin",
    "Detalhes de uma origin (funil) — incluindo stages.",
    { id: z.string().describe("UUID da origin") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintOrigin>>(
        `/v1/origins/${id}`,
      );
      return res.data;
    },
  );

  // Groups
  defineTool(
    server,
    "list_groups",
    "Lista grupos (containers de origins, ex: 'Pos graduacao | Portugues').",
    {
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ limit, page }, client) => {
      const res = await client.get<ClintPaginatedV1<ClintGroup>>("/v1/groups", {
        limit: limit ?? 200,
        page,
      });
      return {
        page: res.page,
        total_pages: res.totalPages,
        total_count: res.totalCount,
        data: res.data,
      };
    },
  );

  defineTool(
    server,
    "get_group",
    "Detalhes de um group pelo ID.",
    { id: z.string().describe("UUID do group") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintGroup>>(
        `/v1/groups/${id}`,
      );
      return res.data;
    },
  );

  // Lost Status
  defineTool(
    server,
    "list_lost_status",
    "Lista motivos de perda (lost reasons) configurados na conta. Use o ID retornado em update_deal quando marcar status=LOST.",
    {
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ limit, page }, client) => {
      const res = await client.get<ClintPaginatedV1<ClintLostStatus>>(
        "/v1/lost-status",
        {
          limit: limit ?? 200,
          page,
        },
      );
      return {
        page: res.page,
        total_pages: res.totalPages,
        total_count: res.totalCount,
        data: res.data,
      };
    },
  );

  defineTool(
    server,
    "get_lost_status",
    "Detalhes de um lost status pelo ID.",
    { id: z.string().describe("UUID do lost status") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintLostStatus>>(
        `/v1/lost-status/${id}`,
      );
      return res.data;
    },
  );

  // Account fields (custom fields catalog)
  defineTool(
    server,
    "get_account_fields",
    "Lista catalogo de custom fields configurados na conta (DEAL/CONTACT/ORGANIZATION). Endpoint pode retornar 404 em algumas contas — depende de feature flag.",
    {},
    async (_args, client) => {
      // Try documented path first; fall back gracefully
      try {
        const res =
          await client.get<ClintSingleResponse<unknown>>("/v1/account-fields");
        return res.data ?? res;
      } catch (e) {
        return {
          status: "unavailable",
          note: "Endpoint /v1/account-fields nao esta disponivel para esta conta/token. Custom fields ainda podem ser usados — apenas o catalogo nao e listavel via API.",
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
  );
}
