# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.1.0] — 2026-04-30

### Adicionado

Release inicial. **47 tools** cobrindo a totalidade da Clint API (v1 + v2).

**Token (1)**
- `check_token` — valida token e retorna contadores agregados da conta

**Contacts (8)**
- `list_contacts`, `get_contact`, `create_contact`, `update_contact`, `delete_contact`
- `add_contact_tags` (body = array JSON de strings — UUIDs ou nomes; nomes inexistentes são criados)
- `remove_contact_tag` (body = `{ tag_id }` ou `{ tag_name }`)
- `list_contact_attachments`

**Deals (5)**
- `list_deals` com filtros completos (origin, stage, status, datas, tags, fields)
- `get_deal`, `create_deal`, `update_deal`, `delete_deal`

**Organizations (2)**
- `get_organization`, `update_organization`

**Tags (4)**
- `list_tags`, `get_tag`, `create_tag` (16 cores Material), `delete_tag`

**Catalogs (8)**
- `list_origins` / `get_origin` (com stages aninhadas)
- `list_groups` / `get_group`
- `list_lost_status` / `get_lost_status`
- `list_users` / `get_user`
- `get_account_fields` (graceful fallback se conta não expõe o endpoint)

**Channel Accounts (2)**
- `list_channel_accounts`, `get_channel_account`

**Message Templates (2)**
- `list_message_templates` (requer `channel_account_id`)
- `get_message_template`

**Chats (3)**
- `get_chat`, `list_chats_by_contact`, `list_chats_by_channel`

**Messages (7)**
- Leitura: `get_message`, `list_messages_by_chat`
- Envio: `send_text_message`, `send_template_message`, `send_image_message`, `send_audio_message`, `send_document_message`

**Dashboards (4)**
- `list_dashboards`, `get_dashboard`, `get_dashboard_data`, `get_chart_data`

### Infra

- Cliente HTTP (`ClintClient`) com retry exponencial em 429 / 5xx, timeout 30s, erros tipados (`ClintApiRequestError`)
- Helpers `paginateV1` / `paginateV2` para auto-pagination até N páginas (default 5 × 200 itens)
- `cleanBody` em writes — descarta `undefined`/`null`/objetos vazios para não sujar payload da API
- Workflow `release.yml` (GitHub Actions): tag → valida `package.json` vs tag → typecheck → release notes do CHANGELOG → GitHub Release
