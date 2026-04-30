import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { defineTool } from "../tool-helpers.js";
import type {
  ClintDashboardDetail,
  ClintDashboardSummary,
  ClintPaginatedV2,
  ClintSingleResponse,
} from "../types.js";

export function registerDashboardTools(server: McpServer) {
  defineTool(
    server,
    "list_dashboards",
    "Lista dashboards configurados na conta (resumo: id, name, charts_count).",
    {
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ limit, page }, client) => {
      const res = await client.get<ClintPaginatedV2<ClintDashboardSummary>>(
        "/v2/dashboards",
        { limit: limit ?? 200, page },
      );
      return {
        page: res.page,
        total_pages: res.total_pages,
        total_count: res.total_count,
        data: res.data,
      };
    },
  );

  defineTool(
    server,
    "get_dashboard",
    "Detalhes de um dashboard pelo ID — inclui lista de charts com layout.",
    { id: z.string().describe("UUID do dashboard") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintDashboardDetail>>(
        `/v2/dashboards/${id}`,
      );
      return res.data;
    },
  );

  defineTool(
    server,
    "get_dashboard_data",
    "Executa todos os charts do dashboard e retorna os dados (number/table/series por tipo de chart).",
    { id: z.string().describe("UUID do dashboard") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<unknown>>(
        `/v2/dashboards/${id}/data`,
      );
      return res.data ?? res;
    },
  );

  defineTool(
    server,
    "get_chart_data",
    "Executa um chart individual e retorna seus dados.",
    { id: z.string().describe("UUID do chart") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<unknown>>(
        `/v2/charts/${id}/data`,
      );
      return res.data ?? res;
    },
  );
}
