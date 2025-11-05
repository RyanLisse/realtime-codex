/**
 * Unit tests for BackendDeveloperAgent
 */

import { describe, expect, it } from "bun:test";
import { BackendDeveloperAgent } from "../BackendDeveloperAgent.js";

describe("BackendDeveloperAgent", () => {
  it("should initialize with GPT-5 Codex model", () => {
    const agent = new BackendDeveloperAgent({
      apiKey: "test-key",
    });
    expect(agent).toBeDefined();
    const session = agent.getSession();
    expect(session.type).toBe("backend-dev");
  });
});
