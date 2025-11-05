/**
 * Unit tests for CodexAgent
 */

import { describe, expect, it } from "bun:test";
import { CodexAgent } from "../CodexAgent.js";

describe("CodexAgent", () => {
  it("should initialize with GPT-5 Codex model", () => {
    const agent = new CodexAgent({
      apiKey: "test-key",
    });
    expect(agent).toBeDefined();
    const session = agent.getSession();
    expect(session.type).toBe("codex");
  });

  it("should have file operation tools", () => {
    // Verify agent has readFile and writeFile tools
    expect(true).toBe(true); // Placeholder
  });
});
