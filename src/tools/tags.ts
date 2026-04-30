import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { defineTool } from "../tool-helpers.js";
import type {
  ClintPaginatedV1,
  ClintSingleResponse,
  ClintTag,
} from "../types.js";
import { TAG_COLORS } from "../types.js";

const TagColorEnum = z.enum(TAG_COLORS);

export function registerTagTools(server: McpServer) {
  defineTool(
    server,
    "list_tags",
    "Lista todas as tags da conta (paginado).",
    {
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ limit, page }, client) => {
      const res = await client.get<ClintPaginatedV1<ClintTag>>("/v1/tags", {
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
    "get_tag",
    "Detalhes de uma tag pelo ID.",
    { id: z.string().describe("UUID da tag") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintTag>>(
        `/v1/tags/${id}`,
      );
      return res.data;
    },
  );

  defineTool(
    server,
    "create_tag",
    "Cria uma nova tag com nome + cor (ambos obrigatorios). Cores aceitas sao 16 valores Material (#f44336, #2196f3, etc).",
    {
      name: z.string().min(1),
      color: TagColorEnum.describe(
        "Hex color from Material palette: #f44336 #e91e63 #9c27b0 #673ab7 #3f51b5 #2196f3 #03a9f4 #00bcd4 #009688 #4caf50 #8bc34a #faa200 #ff9800 #ff5722 #795548 #607d8b",
      ),
    },
    async ({ name, color }, client) => {
      const res = await client.post<ClintSingleResponse<{ id: string }>>(
        "/v1/tags",
        {
          name,
          color,
        },
      );
      return res;
    },
  );

  defineTool(
    server,
    "delete_tag",
    "Remove uma tag permanentemente. Tags em uso por contatos sao automaticamente desvinculadas.",
    { id: z.string().describe("UUID da tag") },
    async ({ id }, client) => {
      await client.delete(`/v1/tags/${id}`);
      return { status: "deleted", id };
    },
  );
}
