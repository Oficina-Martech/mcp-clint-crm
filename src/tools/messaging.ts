import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { cleanBody, defineTool } from "../tool-helpers.js";
import type {
  ClintChannelAccount,
  ClintChat,
  ClintMessage,
  ClintMessageTemplate,
  ClintPaginatedV2,
  ClintSingleResponse,
} from "../types.js";

export function registerMessagingTools(server: McpServer) {
  // Channel Accounts
  defineTool(
    server,
    "list_channel_accounts",
    "Lista contas de canal (WhatsApp Official) configuradas. Cada conta tem id, status (CONNECTED/DISCONNECTED/CANCELLED) e identifier (numero de telefone).",
    {
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ limit, page }, client) => {
      const res = await client.get<ClintPaginatedV2<ClintChannelAccount>>(
        "/v2/channel-accounts",
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
    "get_channel_account",
    "Detalhes de uma channel account pelo ID.",
    { id: z.string().describe("UUID do channel account") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintChannelAccount>>(
        `/v2/channel-accounts/${id}`,
      );
      return res.data;
    },
  );

  // Message Templates
  defineTool(
    server,
    "list_message_templates",
    "Lista templates HSM aprovadas no Meta para um channel account. `channel_account_id` e obrigatorio.",
    {
      channel_account_id: z
        .string()
        .describe("UUID do channel account (obrigatorio)"),
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ channel_account_id, limit, page }, client) => {
      const res = await client.get<ClintPaginatedV2<ClintMessageTemplate>>(
        "/v2/message-templates",
        { channel_account_id, limit: limit ?? 200, page },
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
    "get_message_template",
    "Detalhes de um template message pelo ID — inclui components (HEADER/BODY/FOOTER/BUTTONS).",
    { id: z.string().describe("UUID do template") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintMessageTemplate>>(
        `/v2/message-templates/${id}`,
      );
      return res.data;
    },
  );

  // Chats
  defineTool(
    server,
    "get_chat",
    "Detalhes de um chat pelo ID.",
    { id: z.string().describe("UUID do chat") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintChat>>(
        `/v2/chats/${id}`,
      );
      return res.data;
    },
  );

  defineTool(
    server,
    "list_chats_by_contact",
    "Lista chats de um contato (todos os channels).",
    {
      contact_id: z.string().describe("UUID do contato"),
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ contact_id, limit, page }, client) => {
      const res = await client.get<ClintPaginatedV2<ClintChat>>(
        `/v2/chats/contact/${contact_id}`,
        { limit: limit ?? 50, page },
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
    "list_chats_by_channel",
    "Lista chats de um channel account (todos os contatos).",
    {
      channel_account_id: z.string().describe("UUID do channel account"),
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ channel_account_id, limit, page }, client) => {
      const res = await client.get<ClintPaginatedV2<ClintChat>>(
        `/v2/chats/channel-account/${channel_account_id}`,
        { limit: limit ?? 50, page },
      );
      return {
        page: res.page,
        total_pages: res.total_pages,
        total_count: res.total_count,
        data: res.data,
      };
    },
  );

  // Messages — read
  defineTool(
    server,
    "get_message",
    "Detalhes de uma mensagem pelo ID.",
    { id: z.string().describe("UUID da mensagem") },
    async ({ id }, client) => {
      const res = await client.get<ClintSingleResponse<ClintMessage>>(
        `/v2/messages/${id}`,
      );
      return res.data;
    },
  );

  defineTool(
    server,
    "list_messages_by_chat",
    "Lista mensagens de um chat (paginado, ordem cronologica).",
    {
      chat_id: z.string().describe("UUID do chat"),
      limit: z.number().int().min(1).max(1000).optional(),
      page: z.number().int().min(1).optional(),
    },
    async ({ chat_id, limit, page }, client) => {
      const res = await client.get<ClintPaginatedV2<ClintMessage>>(
        `/v2/messages/chat/${chat_id}`,
        { limit: limit ?? 100, page },
      );
      return {
        page: res.page,
        total_pages: res.total_pages,
        total_count: res.total_count,
        data: res.data,
      };
    },
  );

  // Messages — send
  defineTool(
    server,
    "send_text_message",
    "Envia mensagem de texto via WhatsApp Official. Sujeito a janela de 24h — fora dela use send_template_message. Cria/reaproveita chat automaticamente.",
    {
      channel_account_id: z.string().describe("UUID do channel account"),
      contact_id: z.string().describe("UUID do contato destinatario"),
      message: z.string().min(1).describe("Conteudo de texto"),
      chat_id: z
        .string()
        .optional()
        .describe("UUID de chat existente (opcional)"),
    },
    async (args, client) => {
      const body = cleanBody(args);
      const res = await client.post<ClintSingleResponse<unknown>>(
        "/v2/messages/text",
        body,
      );
      return res;
    },
  );

  defineTool(
    server,
    "send_template_message",
    "Envia template HSM aprovado pelo Meta. Funciona fora da janela de 24h. `parameters` substitui {{1}}, {{2}}, etc nos componentes header/body do template.",
    {
      channel_account_id: z.string().describe("UUID do channel account"),
      contact_id: z.string().describe("UUID do contato"),
      template_id: z.string().describe("UUID do template (status APPROVED)"),
      chat_id: z.string().optional(),
      parameters: z
        .object({
          header: z.array(z.string()).optional(),
          body: z.array(z.string()).optional(),
        })
        .optional()
        .describe("Valores para {{1}}, {{2}} etc. em cada componente."),
    },
    async (args, client) => {
      const body = cleanBody(args);
      const res = await client.post<ClintSingleResponse<unknown>>(
        "/v2/messages/template",
        body,
      );
      return res;
    },
  );

  defineTool(
    server,
    "send_image_message",
    "Envia imagem por URL direta (sem upload). Suporta caption opcional.",
    {
      channel_account_id: z.string(),
      contact_id: z.string(),
      url: z.string().url().describe("URL direta da imagem"),
      caption: z.string().optional(),
      chat_id: z.string().optional(),
    },
    async (args, client) => {
      const body = cleanBody(args);
      const res = await client.post<ClintSingleResponse<unknown>>(
        "/v2/messages/image",
        body,
      );
      return res;
    },
  );

  defineTool(
    server,
    "send_audio_message",
    "Envia audio por URL direta (sem upload). Audio nao suporta caption.",
    {
      channel_account_id: z.string(),
      contact_id: z.string(),
      url: z.string().url().describe("URL direta do audio (ogg/mp3 etc)"),
      chat_id: z.string().optional(),
    },
    async (args, client) => {
      const body = cleanBody(args);
      const res = await client.post<ClintSingleResponse<unknown>>(
        "/v2/messages/audio",
        body,
      );
      return res;
    },
  );

  defineTool(
    server,
    "send_document_message",
    "Envia documento por URL direta. `filename` e obrigatorio (exibido ao destinatario).",
    {
      channel_account_id: z.string(),
      contact_id: z.string(),
      url: z.string().url().describe("URL direta do documento"),
      filename: z.string().describe("Nome de exibicao (ex: 'contrato.pdf')"),
      caption: z.string().optional(),
      chat_id: z.string().optional(),
    },
    async (args, client) => {
      const body = cleanBody(args);
      const res = await client.post<ClintSingleResponse<unknown>>(
        "/v2/messages/document",
        body,
      );
      return res;
    },
  );
}
