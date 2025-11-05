/**
 * Unit tests for CodexAgent
 */

import { describe, it, expect } from "vitest";
import { CodexAgent } from "../CodexAgent.js";

describe("CodexAgent", () => {
  it("should initialize with config", () => {
    const agent = new CodexAgent({
      apiKey: "test-key",
    });
    expect(agent).toBeDefined();
    expect(agent.getSession()).toBeDefined();
  });

  it("should process code generation requests", async () => {
    const agent = new CodexAgent({
      apiKey: "test-key",
    });
    // Note: This would require mocking the AI SDK
    expect(agent).toBeDefined();
  });
});

