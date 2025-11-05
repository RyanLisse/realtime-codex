/**
 * List agents command handler
 */

import type { AgentOrchestrator } from "@repo/orchestrator";

export async function handleListAgents(
  args: string[],
  orchestrator: AgentOrchestrator
): Promise<void> {
  const agentManager = orchestrator.getAgentManager();
  const agents = agentManager.listAgents();

  if (agents.length === 0) {
    console.log("No agents found");
    return;
  }

  console.log(`Found ${agents.length} agent(s):\n`);
  for (const agent of agents) {
    console.log(`  - ${agent.id} (${agent.type}) [${agent.status}]`);
    if (agent.metadata.name) {
      console.log(`    Name: ${agent.metadata.name}`);
    }
    console.log(`    Created: ${agent.createdAt.toISOString()}`);
    console.log();
  }
}
