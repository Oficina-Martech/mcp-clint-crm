import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cleanBody, defineTool } from "../tool-helpers.js";
import type { ClintOrganization, ClintSingleResponse } from "../types.js";

export function registerOrganizationTools(server: McpServer) {
  defineTool(
    server,
    "get_organization",
    "Detalhes de uma organizacao pelo ID.",
    { id: z.string().describe("UUID da organizacao") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintOrganization>>(
        `/v1/organizations/${id}`,
      );
      return res.data;
    },
  );

  defineTool(
    server,
    "update_organization",
    "Atualiza uma organizacao. Permite editar nome e custom fields.",
    {
      id: z.string().describe("UUID da organizacao"),
      name: z.string().optional(),
      fields: z.record(z.unknown()).optional().describe("Custom fields da org"),
    },
    async ({ id, ...rest }, client) => {
      const body = cleanBody(rest);
      const res = await client.post<ClintSingleResponse<unknown>>(
        `/v1/organizations/${id}`,
        body,
      );
      return res;
    },
  );
}
