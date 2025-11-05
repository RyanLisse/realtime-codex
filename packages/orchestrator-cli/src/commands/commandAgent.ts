/**
 * Command agent command handler
 */

import type { AgentOrchestrator } from "@repo/orchestrator";

export async function handleCommandAgent(
  args: string[],
  orchestrator: AgentOrchestrator
): Promise<void> {
  if (args.length < 2) {
    console.error(
      "Usage: orchestrator command <agentId> <command> [parameters]"
    );
    process.exit(1);
  }

  const agentId = args[0];
  const command = args[1];

  const agentManager = orchestrator.getAgentManager();
  const agent = agentManager.getAgentById(agentId);

  if (!agent) {
    console.error(`Agent not found: ${agentId}`);
    process.exit(1);
  }

  // Process command through orchestrator
  const result = await orchestrator.processMessage(
    `Command: ${command} for agent ${agentId}`
  );

  console.log(`Command executed: ${command}`);
  console.log(`Result: ${result}`);
}
