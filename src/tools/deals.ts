import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cleanBody, defineTool } from "../tool-helpers.js";
import type {
  ClintDeal,
  ClintPaginatedV1,
  ClintSingleResponse,
} from "../types.js";
import { DEAL_STATUSES } from "../types.js";

const DealStatusEnum = z.enum(DEAL_STATUSES);

export function registerDealTools(server: McpServer) {
  defineTool(
    server,
    "list_deals",
    "Lista deals com paginacao + filtros. Filtros suportados: origin_id, stage_id, status (OPEN/WON/LOST), user_id, user_email, contact_id, phone, email, tag_ids/tag_names (CSV), datas (created_at, updated_at, updated_stage_at, won_at, lost_at), fields (deepObject).",
    {
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
      offset: z.number().int().min(0).optional(),
      origin_id: z.string().optional(),
      stage_id: z.string().optional(),
      status: DealStatusEnum.optional(),
      user_id: z.string().optional(),
      user_email: z.string().optional(),
      contact_id: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      tag_ids: z.string().optional(),
      tag_names: z.string().optional(),
      created_at_start: z.string().optional(),
      created_at_end: z.string().optional(),
      updated_at_start: z.string().optional(),
      updated_at_end: z.string().optional(),
      updated_stage_at_start: z.string().optional(),
      updated_stage_at_end: z.string().optional(),
      won_at_start: z.string().optional(),
      won_at_end: z.string().optional(),
      lost_at_start: z.string().optional(),
      lost_at_end: z.string().optional(),
    },
    async (args, client) => {
      const res = await client.get<ClintPaginatedV1<ClintDeal>>("/v1/deals", {
        ...args,
        limit: args.limit ?? 50,
      });
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
    "get_deal",
    "Detalhes completos de um deal pelo ID.",
    { id: z.string().describe("UUID do deal") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintDeal>>(
        `/v1/deals/${id}`,
      );
      return res.data;
    },
  );

  defineTool(
    server,
    "create_deal",
    "Cria um deal. Apenas `origin_id` e obrigatorio. Para vincular a contato existente use `contact_id`. Para criar contato novo junto, forneca name/email/phone/username — Clint cria/reaproveita contato com base no email/phone/username.",
    {
      origin_id: z.string().describe("UUID da origin (obrigatorio)"),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      username: z.string().optional().describe("Instagram username"),
      value: z.number().optional().describe("Valor do deal"),
      stage_id: z
        .string()
        .optional()
        .describe("Stage UUID — default: primeira stage da origin"),
      user_id: z.string().optional().describe("Owner UUID"),
      contact_id: z.string().optional().describe("UUID do contato existente"),
      fields: z
        .record(z.unknown())
        .optional()
        .describe("Custom fields. Pode aninhar 'contact' e 'organization'."),
    },
    async (args, client) => {
      const body = cleanBody(args);
      const res = await client.post<ClintSingleResponse<{ id: string }>>(
        "/v1/deals",
        body,
      );
      return res;
    },
  );

  defineTool(
    server,
    "update_deal",
    "Atualiza um deal existente. Permite mover entre stages, marcar como WON/LOST, editar custom fields. Para LOST e recomendado tambem setar lost_status_id (use list_lost_status).",
    {
      id: z.string().describe("UUID do deal"),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      value: z.number().optional(),
      stage_id: z.string().optional(),
      status: DealStatusEnum.optional(),
      user_id: z.string().optional(),
      origin_id: z.string().optional(),
      lost_status_id: z
        .string()
        .optional()
        .describe("Obrigatorio se status=LOST"),
      fields: z.record(z.unknown()).optional(),
    },
    async ({ id, ...rest }, client) => {
      const body = cleanBody(rest);
      const res = await client.post<ClintSingleResponse<unknown>>(
        `/v1/deals/${id}`,
        body,
      );
      return res;
    },
  );

  defineTool(
    server,
    "delete_deal",
    "Remove um deal permanentemente.",
    { id: z.string().describe("UUID do deal") },
    async ({ id }, client) => {
      await client.delete(`/v1/deals/${id}`);
      return { status: "deleted", id };
    },
  );
}
