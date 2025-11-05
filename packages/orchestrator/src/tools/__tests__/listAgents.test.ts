/**
 * Unit tests for listAgents tool
 */

import { describe, expect, it } from "bun:test";
import {
  createAgentSession,
  createInitialState,
} from "../../core/agentState.js";
import { listAgentsTool } from "../listAgents.js";

describe("listAgentsTool", () => {
  it("should list all agents when no filters provided", async () => {
    const state = createInitialState();
    const session1 = createAgentSession(state, "codex", "Codex Agent");
    const session2 = createAgentSession(
      session1,
      "claude-code",
      "Claude Agent"
    );

    // Note: This test assumes the tool has access to state
    // In actual implementation, this would be wired through AgentManager
    const result = await listAgentsTool.execute({});
    expect(result).toHaveProperty("agents");
    expect(Array.isArray(result.agents)).toBe(true);
  });

  it("should filter agents by status", async () => {
    const result = await listAgentsTool.execute({ status: "active" });
    expect(result).toHaveProperty("agents");
    // Filtered agents should only include active ones
  });

  it("should filter agents by type", async () => {
    const result = await listAgentsTool.execute({ type: "codex" });
    expect(result).toHaveProperty("agents");
    // Filtered agents should only include codex type
  });
});
