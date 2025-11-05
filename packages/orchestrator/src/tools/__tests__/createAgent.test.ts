/**
 * Unit tests for createAgent tool
 */

import { describe, expect, it } from "bun:test";

// Note: bun:test types are provided by Bun runtime
import { createAgentTool } from "../createAgent.js";

describe("createAgentTool", () => {
  it("should have correct description", () => {
    expect(createAgentTool.description).toBe(
      "Create a new agent instance of the specified type (codex, claude-code, gemini-browser, etc.)"
    );
  });

  it("should create agent with required fields", async () => {
    const result = await createAgentTool.execute({
      type: "codex",
      name: "Test Agent",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("type");
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("createdAt");
    expect(result.type).toBe("codex");
    expect(result.name).toBe("Test Agent");
  });

  it("should accept optional metadata", async () => {
    const result = await createAgentTool.execute({
      type: "backend-dev",
      name: "Backend Agent",
      metadata: { custom: "value" },
    });
    expect(result.type).toBe("backend-dev");
  });
});
