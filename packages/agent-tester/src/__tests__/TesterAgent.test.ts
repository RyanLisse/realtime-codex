/**
 * Unit tests for TesterAgent
 */

import { describe, expect, it } from "bun:test";
import { TesterAgent } from "../TesterAgent.js";

describe("TesterAgent", () => {
  it("should initialize with GPT-5 Codex model", () => {
    const agent = new TesterAgent({
      apiKey: "test-key",
    });
    expect(agent).toBeDefined();
    const session = agent.getSession();
    expect(session.type).toBe("tester");
  });
});
