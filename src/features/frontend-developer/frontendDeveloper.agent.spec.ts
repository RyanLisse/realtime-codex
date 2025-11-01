import { describe, expect, it } from "vitest";
import { createFrontendDeveloperAgent } from "./frontendDeveloper.agent";

describe("FrontendDeveloperAgent", () => {
  let agent: any;

  it("should be created with correct configuration", () => {
    agent = createFrontendDeveloperAgent();

    expect(agent).toBeDefined();
    expect(agent.name).toBe("Frontend Developer");
    expect(agent).toHaveProperty("instructions");
    expect(agent).toHaveProperty("tools");
  });

  it("should have proper instructions for UI implementation", () => {
    agent = createFrontendDeveloperAgent();

    expect(agent.instructions).toContain("UI");
    expect(agent.instructions).toContain("implement");
    expect(agent.instructions).toContain("React");
  });

  it("should have required tools available", () => {
    agent = createFrontendDeveloperAgent();

    expect(agent.tools).toBeDefined();
    expect(Array.isArray(agent.tools)).toBe(true);
    expect(agent.tools.length).toBeGreaterThan(0);

    const hasComponentGen = agent.tools.some(
      (tool: any) =>
        tool.name === "componentGeneration" ||
        (typeof tool === "object" && tool.name === "componentGeneration")
    );
    expect(hasComponentGen).toBe(true);
  });

  it("should support TypeScript code generation", () => {
    agent = createFrontendDeveloperAgent();

    expect(agent.instructions).toContain("TypeScript");
  });
});
