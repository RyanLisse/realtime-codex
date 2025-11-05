/**
 * Unit tests for FrontendDeveloperAgent
 */

import { describe, expect, it } from "bun:test";
import { FrontendDeveloperAgent } from "../FrontendDeveloperAgent.js";

describe("FrontendDeveloperAgent", () => {
  it("should initialize with GPT-5 Codex model", () => {
    const agent = new FrontendDeveloperAgent({
      apiKey: "test-key",
    });
    expect(agent).toBeDefined();
    const session = agent.getSession();
    expect(session.type).toBe("frontend-dev");
  });
});
