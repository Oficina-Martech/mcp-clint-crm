#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerDashboardTools } from "./tools/dashboards.js";
import { registerDealTools } from "./tools/deals.js";
import { registerMessagingTools } from "./tools/messaging.js";
import { registerMiscTools } from "./tools/misc.js";
import { registerOrganizationTools } from "./tools/organizations.js";
import { registerTagTools } from "./tools/tags.js";
import { registerTokenTools } from "./tools/token.js";

const server = new McpServer({
  name: "clint-crm",
  version: "0.1.0",
});

registerTokenTools(server);
registerContactTools(server);
registerDealTools(server);
registerOrganizationTools(server);
registerTagTools(server);
registerMiscTools(server);
registerMessagingTools(server);
registerDashboardTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
