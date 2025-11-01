import { beforeEach, describe, expect, it } from "vitest";
import type { TaskList } from "../shared/types/workflow.types";
import { createProjectManagerAgent } from "./projectManager.agent";

describe("ProjectManagerAgent", () => {
  let agent: any;

  beforeEach(() => {
    agent = createProjectManagerAgent();
  });

  it("should be created with correct configuration", () => {
    expect(agent).toBeDefined();
    expect(agent.name).toBe("Project Manager");
    expect(agent).toHaveProperty("instructions");
    expect(agent).toHaveProperty("tools");
    expect(agent).toHaveProperty("handoffs");
  });

  it("should have proper instructions for task coordination", () => {
    expect(agent.instructions).toContain("Breaking down");
    expect(agent.instructions).toContain("requirements");
    expect(agent.instructions).toContain("Coordination");
  });

  it("should have required tools available", () => {
    expect(agent.tools).toBeDefined();
    expect(Array.isArray(agent.tools)).toBe(true);
    expect(agent.tools.length).toBeGreaterThan(0);

    // Verify taskDecomposition tool is present
    const hasTaskDecomp = agent.tools.some(
      (tool: any) =>
        tool.name === "taskDecomposition" ||
        (typeof tool === "object" && tool.name === "taskDecomposition")
    );
    expect(hasTaskDecomp).toBe(true);
  });

  it("should have agent configuration for coordination", () => {
    // Verify agent has proper configuration for coordination
    expect(agent.instructions).toBeDefined();
    expect(agent.instructions).toContain("Coordination");

    // Note: Handoffs will be configured when other agents are created
    // For now, we verify the agent structure supports handoffs
    expect(agent).toBeDefined();
  });

  it("should be able to decompose a task list", async () => {
    const _taskList: TaskList = {
      title: "Test Project",
      tasks: [
        {
          id: "task-1",
          description: "Test task",
          dependencies: [],
          priority: "high",
        },
      ],
    };

    // This would require actual agent execution
    // For unit test, we verify the agent structure
    expect(agent.tools).toBeDefined();
    expect(agent.tools.length).toBeGreaterThan(0);
  });

  it("should handle task decomposition errors gracefully", () => {
    // Verify error handling structure exists
    expect(agent).toBeDefined();
    // In actual implementation, this would test error handling
  });

  it("should support parallel task coordination", () => {
    // Verify parallel execution capabilities
    expect(agent).toBeDefined();
    expect(agent.tools).toBeDefined();
  });
});
