/**
 * Create agent command handler
 */

import type { AgentOrchestrator } from "@repo/orchestrator";
import type { AgentType } from "@repo/shared";

export async function handleCreateAgent(
  args: string[],
  orchestrator: AgentOrchestrator
): Promise<void> {
  if (args.length < 2) {
    console.error("Usage: orchestrator create <type> <name>");
    console.error("Types: codex, claude-code, gemini-browser, backend-dev, frontend-dev, tester");
    process.exit(1);
  }

  const type = args[0] as AgentType;
  const name = args[1];

  const agentManager = orchestrator.getAgentManager();
  const agent = await agentManager.createAgent(type, name);

  console.log(`Created agent: ${agent.id}`);
  console.log(`  Type: ${agent.type}`);
  console.log(`  Name: ${name}`);
  console.log(`  Status: ${agent.status}`);
}

