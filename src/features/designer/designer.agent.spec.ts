import { describe, expect, it } from "vitest";
import { createDesignerAgent } from "./designer.agent";

describe("DesignerAgent", () => {
  let agent: any;

  it("should be created with correct configuration", () => {
    agent = createDesignerAgent();

    expect(agent).toBeDefined();
    expect(agent.name).toBe("UI/UX Designer");
    expect(agent).toHaveProperty("instructions");
    expect(agent).toHaveProperty("tools");
  });

  it("should have proper instructions for UI/UX design", () => {
    agent = createDesignerAgent();

    expect(agent.instructions).toContain("design");
    expect(agent.instructions).toContain("UI/UX");
    expect(agent.instructions).toContain("specification");
  });

  it("should have required tools available", () => {
    agent = createDesignerAgent();

    expect(agent.tools).toBeDefined();
    expect(Array.isArray(agent.tools)).toBe(true);
    expect(agent.tools.length).toBeGreaterThan(0);

    const hasDesignSpec = agent.tools.some(
      (tool: any) => tool.name === "designSpecification"
    );
    expect(hasDesignSpec).toBe(true);
  });

  it("should have proper model configuration", () => {
    agent = createDesignerAgent();

    expect(agent.model).toBeDefined();
  });

  it("should support design artifact creation", () => {
    agent = createDesignerAgent();

    expect(agent).toBeDefined();
    expect(agent.tools).toBeDefined();
  });
});
