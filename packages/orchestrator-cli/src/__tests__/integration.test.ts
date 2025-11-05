/**
 * Integration test for orchestrator → agent coordination
 */

import { beforeEach, describe, expect, it } from "bun:test";
import { AgentOrchestrator } from "@repo/orchestrator";

describe("Orchestrator Integration", () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator({
      apiKey: process.env.OPENAI_API_KEY || "test-key",
      model: "gpt-5",
    });
  });

  it("should initialize orchestrator", async () => {
    await orchestrator.initialize();
    const agentManager = orchestrator.getAgentManager();
    expect(agentManager).toBeDefined();
  });

  it("should create and list agents", async () => {
    await orchestrator.initialize();
    const agentManager = orchestrator.getAgentManager();

    const agent = await agentManager.createAgent("codex", "Test Agent");
    expect(agent).toBeDefined();
    expect(agent.type).toBe("codex");

    const agents = agentManager.listAgents();
    expect(agents.length).toBeGreaterThan(0);
    expect(agents.some((a) => a.id === agent.id)).toBe(true);
  });

  it("should process messages through orchestrator", async () => {
    await orchestrator.initialize();
    const result = await orchestrator.processMessage("List all agents");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});
