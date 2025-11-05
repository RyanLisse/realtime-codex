/**
 * Unit tests for ClaudeAgent
 */

import { describe, expect, it } from "bun:test";
import { ClaudeAgent } from "../ClaudeAgent.js";

describe("ClaudeAgent", () => {
  it("should initialize with Anthropic provider", () => {
    const agent = new ClaudeAgent({
      apiKey: "test-key",
    });
    expect(agent).toBeDefined();
    const session = agent.getSession();
    expect(session.type).toBe("claude-code");
  });
});
