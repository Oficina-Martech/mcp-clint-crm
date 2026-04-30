import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cleanBody, defineTool } from "../tool-helpers.js";
import type {
  ClintContact,
  ClintContactAttachment,
  ClintPaginatedV1,
  ClintSingleResponse,
} from "../types.js";

export function registerContactTools(server: McpServer) {
  defineTool(
    server,
    "list_contacts",
    "Lista contatos com paginacao + filtros. Filtros suportados: tag_ids, tag_names (CSV), origin_id, user_id, contact_id, phone, email, organization, datas (created_at_start/end, updated_at_start/end). Retorna ate `limit` itens da pagina escolhida (default 50, max 1000).",
    {
      limit: z
        .number()
        .int()
        .min(1)
        .max(1000)
        .optional()
        .describe("Itens por pagina (default 50, max 1000)"),
      page: z.number().int().min(1).optional().describe("Pagina (default 1)"),
      offset: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Offset alternativo a page"),
      origin_id: z.string().optional().describe("Filtra por origin UUID"),
      user_id: z.string().optional().describe("Filtra por user UUID"),
      contact_id: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      organization: z.string().optional(),
      tag_ids: z
        .string()
        .optional()
        .describe("UUIDs de tags separados por virgula (OR)"),
      tag_names: z
        .string()
        .optional()
        .describe("Nomes de tags separados por virgula (OR)"),
      created_at_start: z
        .string()
        .optional()
        .describe("ISO 8601 — created_at >="),
      created_at_end: z
        .string()
        .optional()
        .describe("ISO 8601 — created_at <="),
      updated_at_start: z.string().optional(),
      updated_at_end: z.string().optional(),
    },
    async (args, client) => {
      const res = await client.get<ClintPaginatedV1<ClintContact>>(
        "/v1/contacts",
        {
          ...args,
          limit: args.limit ?? 50,
        },
      );
      return {
        page: res.page,
        total_pages: res.totalPages,
        total_count: res.totalCount,
        has_next: res.hasNext,
        returned: res.data.length,
        data: res.data,
      };
    },
  );

  defineTool(
    server,
    "get_contact",
    "Detalhes completos de um contato pelo ID.",
    { id: z.string().describe("UUID do contato") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintContact>>(
        `/v1/contacts/${id}`,
      );
      return res.data;
    },
  );

  defineTool(
    server,
    "create_contact",
    "Cria um contato. Pelo menos um identificador e obrigatorio (phone OU email OU username/Instagram). `fields` aceita custom fields da conta — use `get_account_fields` para listar.",
    {
      name: z.string().optional(),
      ddi: z.string().optional().describe("Codigo do pais (ex: '+55', '55')"),
      phone: z
        .string()
        .optional()
        .describe("Numero sem DDI (ex: '48999999999')"),
      email: z.string().optional(),
      username: z.string().optional().describe("Instagram username/ID"),
      fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom fields. Pode incluir 'organization' como objeto."),
    },
    async (args, client) => {
      const body = cleanBody(args);
      const res = await client.post<ClintSingleResponse<{ id: string }>>(
        "/v1/contacts",
        body,
      );
      return res;
    },
  );

  defineTool(
    server,
    "update_contact",
    "Atualiza um contato existente. Mesmos campos do create. Apenas campos fornecidos sao alterados.",
    {
      id: z.string().describe("UUID do contato"),
      name: z.string().optional(),
      ddi: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      username: z.string().optional(),
      fields: z.record(z.unknown()).optional(),
    },
    async ({ id, ...rest }, client) => {
      const body = cleanBody(rest);
      const res = await client.post<ClintSingleResponse<unknown>>(
        `/v1/contacts/${id}`,
        body,
      );
      return res;
    },
  );

  defineTool(
    server,
    "delete_contact",
    "Remove um contato permanentemente.",
    { id: z.string().describe("UUID do contato") },
    async ({ id }, client) => {
      await client.delete(`/v1/contacts/${id}`);
      return { status: "deleted", id };
    },
  );

  defineTool(
    server,
    "add_contact_tags",
    "Adiciona uma ou mais tags a um contato. Aceita IDs ou nomes de tags. O body enviado a API e um array JSON de strings.",
    {
      id: z.string().describe("UUID do contato"),
      tags: z
        .array(z.string())
        .min(1)
        .describe(
          "Array de UUIDs ou nomes de tags. Tags inexistentes pelo nome sao criadas automaticamente.",
        ),
    },
    async ({ id, tags }, client) => {
      // Body must be a raw JSON array of strings (per Clint API)
      await client.post(`/v1/contacts/${id}/tags`, tags);
      return { status: "ok", contact_id: id, tags_added: tags };
    },
  );

  defineTool(
    server,
    "remove_contact_tag",
    "Remove uma tag de um contato. Forneca tag_id OU tag_name (um dos dois).",
    {
      id: z.string().describe("UUID do contato"),
      tag_id: z.string().optional().describe("UUID da tag a remover"),
      tag_name: z.string().optional().describe("Nome da tag a remover"),
    },
    async ({ id, tag_id, tag_name }, client) => {
      if (!tag_id && !tag_name) {
        throw new Error("Forneca tag_id OU tag_name");
      }
      const body = cleanBody({ tag_id, tag_name });
      await client.delete(`/v1/contacts/${id}/tags`, body);
      return { status: "removed", contact_id: id, tag_id, tag_name };
    },
  );

  defineTool(
    server,
    "list_contact_attachments",
    "Lista anexos de documentos de um contato (paginado).",
    {
      id: z.string().describe("UUID do contato"),
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ id, limit, page }, client) => {
      const res = await client.get<ClintPaginatedV1<ClintContactAttachment>>(
        `/v1/contacts/${id}/attachments`,
        { limit: limit ?? 50, page },
      );
      return {
        page: res.page,
        total_pages: res.totalPages,
        total_count: res.totalCount,
        data: res.data,
      };
    },
  );
}
