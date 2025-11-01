import { describe, expect, it } from "vitest";
import { createBackendDeveloperAgent } from "./backendDeveloper.agent";

describe("BackendDeveloperAgent", () => {
  let agent: any;

  it("should be created with correct configuration", () => {
    agent = createBackendDeveloperAgent();

    expect(agent).toBeDefined();
    expect(agent.name).toBe("Backend Developer");
    expect(agent).toHaveProperty("instructions");
    expect(agent).toHaveProperty("tools");
  });

  it("should have proper instructions for API implementation", () => {
    agent = createBackendDeveloperAgent();

    expect(agent.instructions).toContain("API");
    expect(agent.instructions).toContain("backend");
    expect(agent.instructions).toContain("endpoint");
  });

  it("should have required tools available", () => {
    agent = createBackendDeveloperAgent();

    expect(agent.tools).toBeDefined();
    expect(Array.isArray(agent.tools)).toBe(true);
    expect(agent.tools.length).toBeGreaterThan(0);

    const hasApiGen = agent.tools.some(
      (tool: any) =>
        tool.name === "apiGeneration" ||
        (typeof tool === "object" && tool.name === "apiGeneration")
    );
    expect(hasApiGen).toBe(true);
  });

  it("should support database schema generation", () => {
    agent = createBackendDeveloperAgent();

    expect(agent.instructions).toContain("database");
  });
});
