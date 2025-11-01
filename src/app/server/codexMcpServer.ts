import { MCPServerStdio } from "@openai/agents/mcp";

/**
 * Initializes the Codex CLI as an MCP server.
 *
 * The Codex MCP server exposes two tools on the Agents SDK side:
 * - `codex()` for creating a conversation with Codex.
 * - `codex-reply()` for continuing an existing conversation.
 */
export async function initializeCodexCliMcpServer() {
  const codexMcpServer = await MCPServerStdio.create({
    name: "Codex CLI",
    params: {
      command: "npx",
      args: ["-y", "codex", "mcp"],
    },
    // Extend the timeout so the Codex CLI has enough time to finish tasks.
    clientSessionTimeoutSeconds: 360_000,
  });

  console.log("Codex MCP server started.");

  return codexMcpServer;
}

export async function main(): Promise<void> {
  const codexMcpServer = await initializeCodexCliMcpServer();

  try {
    // Additional orchestration logic will be added in the next section.
  } finally {
    await codexMcpServer.close();
  }
}
