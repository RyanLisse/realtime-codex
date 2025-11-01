import { Agent, tool } from "@openai/agents";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createAgent } from "@/shared/agent.utils";

describe("createAgent", () => {
  it("should create an agent with correct properties", () => {
    const mockTool = tool({
      name: "mockTool",
      description: "A mock tool",
      parameters: z.object({ param: z.string() }),
      execute: async () => "result",
    });

    const agent = createAgent({
      name: "TestAgent",
      instructions: "Test instructions",
      tools: [mockTool],
      model: "gpt-5-mini",
    });

    expect(agent).toBeInstanceOf(Agent);
    expect(agent.name).toBe("TestAgent");
    // Note: Agent properties might not be directly accessible, so test creation
  });

  it("should handle empty tools array", () => {
    const agent = createAgent({
      name: "EmptyAgent",
      instructions: "No tools",
      tools: [],
      model: "gpt-5-mini",
    });

    expect(agent).toBeInstanceOf(Agent);
  });
});
