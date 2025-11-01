import { describe, expect, it } from "vitest";
import type { TaskList } from "../../shared/types/workflow.types";
import { taskDecompositionTool } from "./taskDecomposition.tool";

describe("taskDecompositionTool", () => {
  it("should parse task list from markdown and decompose into agent-specific subtasks", async () => {
    const taskList: TaskList = {
      title: "User Authentication System",
      description: "Build authentication",
      tasks: [
        {
          id: "task-1",
          description: "Design login UI with modern styling",
          assignedTo: [],
          dependencies: [],
          priority: "high",
          estimatedDuration: 2,
        },
        {
          id: "task-2",
          description: "Implement login API endpoint",
          assignedTo: [],
          dependencies: [],
          priority: "high",
        },
        {
          id: "task-3",
          description: "Write tests for login flow",
          assignedTo: [],
          dependencies: ["task-1", "task-2"],
        },
      ],
    };

    const result = await taskDecompositionTool(taskList);

    expect(result).toBeDefined();
    expect(result.subtasks).toBeDefined();
    expect(result.subtasks.length).toBeGreaterThan(0);

    // Verify each subtask has required fields
    result.subtasks.forEach((subtask) => {
      expect(subtask).toHaveProperty("id");
      expect(subtask).toHaveProperty("description");
      expect(subtask).toHaveProperty("assignedAgent");
      expect(subtask).toHaveProperty("priority");
      expect(["low", "medium", "high"]).toContainEqual(subtask.priority);
    });

    // Verify original task is preserved
    expect(result.originalTask).toBe(taskList.title);
  });

  it("should detect dependencies between tasks", async () => {
    const taskList: TaskList = {
      title: "Feature Development",
      tasks: [
        {
          id: "task-1",
          description: "Design component",
          assignedTo: [],
          dependencies: [],
          priority: "high",
        },
        {
          id: "task-2",
          description: "Implement component",
          assignedTo: [],
          dependencies: ["task-1"],
          priority: "high",
        },
        {
          id: "task-3",
          description: "Test component",
          assignedTo: [],
          dependencies: ["task-2"],
        },
      ],
    };

    const result = await taskDecompositionTool(taskList);

    expect(result.dependencies).toBeDefined();
    expect(result.dependencies.length).toBeGreaterThan(0);

    // Verify dependency structure
    result.dependencies.forEach((dep) => {
      expect(dep).toHaveProperty("from");
      expect(dep).toHaveProperty("to");
      expect(dep).toHaveProperty("type");
      expect(["blocking", "informational"]).toContain(dep.type);
    });
  });

  it("should identify tasks that can run in parallel", async () => {
    const taskList: TaskList = {
      title: "Parallel Development",
      tasks: [
        {
          id: "task-1",
          description: "Design frontend",
          assignedTo: [],
          dependencies: [],
          priority: "high",
        },
        {
          id: "task-2",
          description: "Implement backend API",
          assignedTo: [],
          dependencies: [],
          priority: "high",
        },
      ],
    };

    const result = await taskDecompositionTool(taskList);

    expect(result.canRunInParallel).toBeDefined();
    expect(Array.isArray(result.canRunInParallel)).toBe(true);

    // If dependencies are independent, should identify parallel groups
    const hasNoDependencies = result.dependencies.length === 0;
    if (hasNoDependencies) {
      expect(result.canRunInParallel.length).toBeGreaterThan(0);
    }
  });

  it("should assign appropriate agents to subtasks based on task description", async () => {
    const taskList: TaskList = {
      title: "Multi-Agent Tasks",
      tasks: [
        {
          id: "task-1",
          description: "Create beautiful UI design for login form",
          assignedTo: [],
          dependencies: [],
          priority: "high",
        },
        {
          id: "task-2",
          description: "Build React login component with TypeScript",
          assignedTo: [],
          dependencies: [],
          priority: "high",
        },
        {
          id: "task-3",
          description: "Create REST API for authentication",
          assignedTo: [],
          dependencies: [],
          priority: "high",
        },
      ],
    };

    const result = await taskDecompositionTool(taskList);

    // Verify agent assignment based on keywords
    const designerTask = result.subtasks.find((t) =>
      t.description.toLowerCase().includes("design")
    );
    const frontendTask = result.subtasks.find(
      (t) =>
        t.description.toLowerCase().includes("react") ||
        t.description.toLowerCase().includes("component")
    );
    const backendTask = result.subtasks.find(
      (t) =>
        t.description.toLowerCase().includes("api") ||
        t.description.toLowerCase().includes("rest")
    );

    if (designerTask) {
      expect(designerTask.assignedAgent).toBe("Designer");
    }
    if (frontendTask) {
      expect(frontendTask.assignedAgent).toBe("FrontendDeveloper");
    }
    if (backendTask) {
      expect(backendTask.assignedAgent).toBe("BackendDeveloper");
    }
  });

  it("should handle empty task list gracefully", async () => {
    const taskList: TaskList = {
      title: "Empty Project",
      tasks: [],
    };

    const result = await taskDecompositionTool(taskList);

    expect(result).toBeDefined();
    expect(result.subtasks).toEqual([]);
    expect(result.dependencies).toEqual([]);
    expect(result.canRunInParallel).toEqual([]);
  });

  it("should preserve task IDs and descriptions", async () => {
    const taskList: TaskList = {
      title: "Preservation Test",
      tasks: [
        {
          id: "unique-task-id",
          description: "Specific task description",
          assignedTo: [],
          dependencies: [],
          priority: "medium",
        },
      ],
    };

    const result = await taskDecompositionTool(taskList);

    expect(result.subtasks.length).toBeGreaterThan(0);
    const originalTask = result.subtasks.find((t) => t.id === "unique-task-id");

    if (originalTask) {
      expect(originalTask.description).toBe("Specific task description");
    }
  });
});
