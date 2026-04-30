# @oficina-martech/mcp-clint-crm

> MCP server para Clint CRM — API v1 + v2 (https://api.clint.digital)
> 47 tools cobrindo Contatos, Deals, Organizações, Tags, Origins, Groups, Lost Status, Users, Channel Accounts, Message Templates, Chats, Messages e Dashboards.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D20-green.svg)](https://nodejs.org)

Implementação independente da Oficina Martech, sem dependência de gateways pagos. Conecta direto à API da Clint com seu próprio `CLINT_API_TOKEN`.

## Tools (47)

### Token (1)
- `check_token` — valida token, retorna usuários e contadores básicos da conta

### Contacts (8)
- `list_contacts` — lista paginada com filtros (tags, origin, datas, telefone, email)
- `get_contact` — detalhes completos
- `create_contact` — cria contato (phone/email/username + custom fields)
- `update_contact` — atualiza campos
- `delete_contact` — remove contato
- `add_contact_tags` — anexa tags por ID ou nome (cria tags inexistentes)
- `remove_contact_tag` — remove tag por id ou nome
- `list_contact_attachments` — anexos de documentos

### Deals (5)
- `list_deals` — filtros completos: origin, stage, status, datas, fields, tags
- `get_deal` — detalhes
- `create_deal` — cria deal (`origin_id` obrigatório, vincula contato)
- `update_deal` — move stage, marca WON/LOST, edita custom fields
- `delete_deal` — remove deal

### Organizations (2)
- `get_organization` — detalhes
- `update_organization` — edita nome + custom fields

### Tags (4)
- `list_tags` — lista paginada
- `get_tag` — detalhes
- `create_tag` — cria com nome + cor (16 cores Material)
- `delete_tag` — remove

### Origins / Groups / Lost Status / Users / Account Fields (8)
- `list_origins` / `get_origin` — funis e suas stages
- `list_groups` / `get_group` — agrupadores de origins
- `list_lost_status` / `get_lost_status` — motivos de perda
- `list_users` / `get_user` — operadores
- `get_account_fields` — catálogo de custom fields (pode retornar 404 conforme conta)

### Channel Accounts (2)
- `list_channel_accounts` — contas WhatsApp Official conectadas
- `get_channel_account` — detalhes

### Message Templates (2)
- `list_message_templates` — HSM aprovados (requer `channel_account_id`)
- `get_message_template` — components do template

### Chats (3)
- `get_chat` — detalhes
- `list_chats_by_contact` — chats de um contato
- `list_chats_by_channel` — chats de um channel account

### Messages — leitura (2)
- `get_message` — detalhes
- `list_messages_by_chat` — histórico cronológico

### Messages — envio (5)
- `send_text_message` — texto via WhatsApp Official
- `send_template_message` — HSM com placeholders `{{1}}`, `{{2}}` (fora da janela 24h)
- `send_image_message` — imagem por URL + caption
- `send_audio_message` — áudio por URL
- `send_document_message` — documento por URL + filename

### Dashboards (4)
- `list_dashboards` — resumo dos dashboards
- `get_dashboard` — charts + layout
- `get_dashboard_data` — executa todos os charts
- `get_chart_data` — executa um chart individual

## Instalação

### Como dependência num repo (recomendado)

Adicione ao seu `.mcp.json`:

```json
{
  "mcpServers": {
    "clint-crm": {
      "command": "npx",
      "args": ["-y", "@oficina-martech/mcp-clint-crm"],
      "env": {
        "CLINT_API_TOKEN": "${CLINT_API_TOKEN}"
      }
    }
  }
}
```

Defina `CLINT_API_TOKEN` em `.env` (gitignored).

### Desenvolvimento local

```bash
git clone https://github.com/Oficina-Martech/mcp-clint-crm.git
cd mcp-clint-crm
npm install
cp .env.example .env  # popular CLINT_API_TOKEN
npm run dev
```

## Configuração

| Variável | Obrigatória | Descrição |
|---|---|---|
| `CLINT_API_TOKEN` | ✅ | Token da Clint API. Gerar em `app.clint.digital → Configurações → API`. |

## API patterns

- **Base URL**: `https://api.clint.digital`
- **Auth**: header `api-token: <token>`
- **Versões**: v1 (CRM core, paginação `totalCount`/`hasNext`) e v2 (mensageria + dashboards, paginação `total_count`/`has_next`)
- **Updates**: PATCH semântico via `POST /v1/{resource}/{id}` (somente campos enviados são alterados)
- **Tags em contatos**: `POST /v1/contacts/{id}/tags` aceita array JSON cru de strings (UUIDs ou nomes); `DELETE` aceita body `{ tag_id }` ou `{ tag_name }`
- **Custom fields**: `fields` é um objeto livre (`Record<string, unknown>`) por contato/deal/organização; usa labels da própria conta
- **Cores de tag**: 16 valores fixos da paleta Material (validados no schema)

## Uso com Claude Code

Permissions em `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["mcp__clint-crm__*"]
  }
}
```

## Referências da API

- [Clint API Reference](https://clint-api.readme.io/reference/)
- [Documentação oficial](https://docs.clint.digital/)

## Releases

Versionamento [SemVer](https://semver.org/lang/pt-BR/). Releases ficam em [GitHub Releases](https://github.com/Oficina-Martech/mcp-clint-crm/releases).

### Como cortar uma nova versão

1. Adicionar entrada no [CHANGELOG.md](./CHANGELOG.md) sob `## [X.Y.Z] — YYYY-MM-DD`
2. Atualizar `version` em `package.json`
3. Commit + push:
   ```bash
   git commit -am "chore: release vX.Y.Z"
   git push origin main
   ```
4. Criar tag e push:
   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z — descrição"
   git push origin vX.Y.Z
   ```
5. Workflow `.github/workflows/release.yml` dispara automaticamente:
   - Valida que `package.json` bate com a tag
   - Roda `typecheck`
   - Extrai notas do CHANGELOG
   - Cria GitHub Release

### Pin a uma versão específica

```json
{
  "args": ["-y", "github:Oficina-Martech/mcp-clint-crm#v0.1.0"]
}
```

Sem pin, `npx -y github:Oficina-Martech/mcp-clint-crm` usa `main` (sempre última).

## Licença

MIT — ver [LICENSE](./LICENSE).
