import { describe, expect, it } from "vitest";
import { createTesterAgent } from "./tester.agent";

describe("TesterAgent", () => {
  let agent: any;

  it("should be created with correct configuration", () => {
    agent = createTesterAgent();

    expect(agent).toBeDefined();
    expect(agent.name).toBe("Tester");
    expect(agent).toHaveProperty("instructions");
    expect(agent).toHaveProperty("tools");
  });

  it("should have proper instructions for testing and validation", () => {
    agent = createTesterAgent();

    expect(agent.instructions).toContain("test");
    expect(agent.instructions).toContain("Validating");
    expect(agent.instructions).toContain("quality");
  });

  it("should have required tools available", () => {
    agent = createTesterAgent();

    expect(agent.tools).toBeDefined();
    expect(Array.isArray(agent.tools)).toBe(true);
    expect(agent.tools.length).toBeGreaterThan(0);

    const hasTestGen = agent.tools.some(
      (tool: any) =>
        tool.name === "testGeneration" ||
        (typeof tool === "object" && tool.name === "testGeneration")
    );
    expect(hasTestGen).toBe(true);
  });

  it("should support comprehensive testing strategies", () => {
    agent = createTesterAgent();

    expect(agent.instructions).toContain("coverage");
  });
});
