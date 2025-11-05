/**
 * Unit tests for GeminiAgent
 */

import { describe, expect, it } from "bun:test";
import { GeminiAgent } from "../GeminiAgent.js";

describe("GeminiAgent", () => {
  it("should initialize with Gemini provider", () => {
    const agent = new GeminiAgent({
      apiKey: "test-key",
    });
    expect(agent).toBeDefined();
    const session = agent.getSession();
    expect(session.type).toBe("gemini-browser");
  });
});
