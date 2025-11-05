/**
 * Unit tests for createAgent tool
 */

import { describe, expect, it } from "vitest";
import { createAgentTool } from "../createAgent.js";

describe("createAgentTool", () => {
  it("should create agent with valid type", async () => {
    const result = await createAgentTool.execute({
      type: "codex",
      name: "test-agent",
    });
    expect(result.success).toBe(true);
    expect(result.agentId).toBeDefined();
  });

  it("should reject invalid agent type", async () => {
    const result = await createAgentTool.execute({
      type: "invalid-type",
      name: "test-agent",
    });
    expect(result.success).toBe(false);
  });
});
