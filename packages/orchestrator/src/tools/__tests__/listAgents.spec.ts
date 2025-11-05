/**
 * Unit tests for listAgents tool
 */

import { describe, it, expect } from "vitest";
import { listAgentsTool } from "../listAgents.js";

describe("listAgentsTool", () => {
  it("should list available agents", async () => {
    const result = await listAgentsTool.execute({});
    expect(result.success).toBe(true);
    expect(result.agents).toBeDefined();
    expect(Array.isArray(result.agents)).toBe(true);
  });

  it("should return agent types", async () => {
    const result = await listAgentsTool.execute({});
    if (result.success && result.agents) {
      result.agents.forEach((agent) => {
        expect(agent.type).toBeDefined();
        expect(agent.name).toBeDefined();
      });
    }
  });
});

