/**
 * CLI command handlers
 */

import type { AgentOrchestrator } from "@repo/orchestrator";
import { handleCommandAgent } from "./commandAgent.js";
import { handleCreateAgent } from "./createAgent.js";
import { handleListAgents } from "./listAgents.js";

/**
 * Handle CLI command
 */
export async function handleCommand(
  command: string,
  args: string[],
  orchestrator: AgentOrchestrator
): Promise<void> {
  switch (command) {
    case "list":
      await handleListAgents(args, orchestrator);
      break;
    case "create":
      await handleCreateAgent(args, orchestrator);
      break;
    case "command":
      await handleCommandAgent(args, orchestrator);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error("Available commands: list, create, command");
      process.exit(1);
  }
}
