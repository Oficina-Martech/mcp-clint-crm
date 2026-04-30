import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { defineTool } from "../tool-helpers.js";
import type { ClintPaginatedV1, ClintUser } from "../types.js";

export function registerTokenTools(server: McpServer) {
  defineTool(
    server,
    "check_token",
    "Valida o token Clint API e mostra usuarios + contadores basicos da conta. Use para diagnosticar problemas de autenticacao.",
    {},
    async (_args, client) => {
      const checks: Record<string, unknown> = { status: "VALID" };

      try {
        const usersRes = await client.get<ClintPaginatedV1<ClintUser>>(
          "/v1/users",
          { limit: 5 },
        );
        checks.users_count = usersRes.totalCount;
        checks.users_sample = usersRes.data.map((u) => ({
          id: u.id,
          email: u.email,
          name:
            [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
            u.full_name,
        }));
      } catch (e) {
        checks.status = "INVALID";
        checks.error = e instanceof Error ? e.message : String(e);
        return checks;
      }

      // Best-effort summary of CRM volume
      const counts: Record<string, number | string> = {};
      const probes = [
        { label: "contacts", path: "/v1/contacts" },
        { label: "deals", path: "/v1/deals" },
        { label: "tags", path: "/v1/tags" },
        { label: "origins", path: "/v1/origins" },
        { label: "groups", path: "/v1/groups" },
        { label: "lost_status", path: "/v1/lost-status" },
      ];
      for (const { label, path } of probes) {
        try {
          const res = await client.get<{ totalCount?: number }>(path, {
            limit: 1,
          });
          counts[label] = res.totalCount ?? 0;
        } catch (e) {
          counts[label] = `ERRO: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      checks.totals = counts;

      return `[OK] Clint token valido\n\n${JSON.stringify(checks, null, 2)}`;
    },
  );
}
