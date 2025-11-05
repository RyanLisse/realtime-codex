import { beforeEach, describe, expect, it } from "vitest";
import { AgentType, type Task, TaskStatus } from "../../types/workflow.types";
import {
  buildDependencyGraph,
  DependencyGraphManager,
  getExecutionLayers,
} from "../dependencyGraph";

describe("DependencyGraphManager", () => {
  let graph: DependencyGraphManager;

  beforeEach(() => {
    graph = new DependencyGraphManager();
  });

  const createTask = (
    id: string,
    dependencies: string[] = [],
    status: TaskStatus = TaskStatus.PENDING
  ): Task => ({
    id,
    description: `Task ${id}`,
    assignedAgent: AgentType.FRONTEND,
    status,
    dependencies,
    createdAt: new Date(),
    timeoutMs: 5000,
  });

  describe("addTask", () => {
    it("should add a task to the graph", () => {
      const task = createTask("task-1");
      graph.addTask(task);

      expect(graph.hasTask("task-1")).toBe(true);
      expect(graph.size()).toBe(1);
    });

    it("should throw when adding duplicate task", () => {
      const task = createTask("task-1");
      graph.addTask(task);

      expect(() => graph.addTask(task)).toThrow(
        "Task task-1 already exists in dependency graph"
      );
    });

    it("should update dependents when adding task with dependencies", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);

      const dependents = graph.getDependents("task-1");
      expect(dependents).toHaveLength(1);
      expect(dependents[0].id).toBe("task-2");
    });

    it("should mark completed tasks automatically", () => {
      const task = createTask("task-1", [], TaskStatus.COMPLETED);
      graph.addTask(task);

      const stats = graph.getStats();
      expect(stats.completedTasks).toBe(1);
    });
  });

  describe("getExecutableTasks", () => {
    it("should return tasks with no dependencies", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2");

      graph.addTask(task1);
      graph.addTask(task2);

      const executable = graph.getExecutableTasks();
      expect(executable).toHaveLength(2);
      expect(executable.map((t) => t.id).sort()).toEqual(["task-1", "task-2"]);
    });

    it("should not return tasks with unsatisfied dependencies", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);

      const executable = graph.getExecutableTasks();
      expect(executable).toHaveLength(1);
      expect(executable[0].id).toBe("task-1");
    });

    it("should return tasks when dependencies are completed", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);

      graph.markTaskComplete("task-1");

      const executable = graph.getExecutableTasks();
      expect(executable).toHaveLength(1);
      expect(executable[0].id).toBe("task-2");
    });

    it("should not return non-pending tasks", () => {
      const task1 = createTask("task-1", [], TaskStatus.ACTIVE);
      graph.addTask(task1);

      const executable = graph.getExecutableTasks();
      expect(executable).toHaveLength(0);
    });
  });

  describe("markTaskComplete", () => {
    it("should mark task as completed", () => {
      const task = createTask("task-1");
      graph.addTask(task);

      graph.markTaskComplete("task-1");

      const stats = graph.getStats();
      expect(stats.completedTasks).toBe(1);
    });

    it("should throw when marking non-existent task", () => {
      expect(() => graph.markTaskComplete("non-existent")).toThrow(
        "Task non-existent not found in dependency graph"
      );
    });

    it("should update task status", () => {
      const task = createTask("task-1");
      graph.addTask(task);

      graph.markTaskComplete("task-1");

      const retrieved = graph.getTask("task-1");
      expect(retrieved?.status).toBe(TaskStatus.COMPLETED);
    });
  });

  describe("detectCycles", () => {
    it("should detect no cycles in acyclic graph", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);
      const task3 = createTask("task-3", ["task-2"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const result = graph.detectCycles();
      expect(result.hasCycle).toBe(false);
      expect(result.cycle).toBeUndefined();
    });

    it("should detect direct cycle", () => {
      const task1 = createTask("task-1", ["task-2"]);
      const task2 = createTask("task-2", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);

      const result = graph.detectCycles();
      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
      expect(result.cycle?.length).toBeGreaterThan(0);
    });

    it("should detect indirect cycle", () => {
      const task1 = createTask("task-1", ["task-3"]);
      const task2 = createTask("task-2", ["task-1"]);
      const task3 = createTask("task-3", ["task-2"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const result = graph.detectCycles();
      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toBeDefined();
    });

    it("should detect self-referential cycle", () => {
      const task1 = createTask("task-1", ["task-1"]);
      graph.addTask(task1);

      const result = graph.detectCycles();
      expect(result.hasCycle).toBe(true);
      expect(result.cycle).toContain("task-1");
    });
  });

  describe("getParallelBatches", () => {
    it("should create single batch for independent tasks", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2");
      const task3 = createTask("task-3");

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const batches = graph.getParallelBatches();
      expect(batches).toHaveLength(1);
      expect(batches[0].batch).toHaveLength(3);
      expect(batches[0].batchNumber).toBe(0);
    });

    it("should create multiple batches for sequential dependencies", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);
      const task3 = createTask("task-3", ["task-2"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const batches = graph.getParallelBatches();
      expect(batches).toHaveLength(3);
      expect(batches[0].batch[0].id).toBe("task-1");
      expect(batches[1].batch[0].id).toBe("task-2");
      expect(batches[2].batch[0].id).toBe("task-3");
    });

    it("should group parallel tasks in same batch", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);
      const task3 = createTask("task-3", ["task-1"]);
      const task4 = createTask("task-4", ["task-2", "task-3"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);
      graph.addTask(task4);

      const batches = graph.getParallelBatches();
      expect(batches).toHaveLength(3);
      expect(batches[0].batch).toHaveLength(1); // task-1
      expect(batches[1].batch).toHaveLength(2); // task-2, task-3
      expect(batches[2].batch).toHaveLength(1); // task-4
    });

    it("should maintain dependency order across batches", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2");
      const task3 = createTask("task-3", ["task-1", "task-2"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const batches = graph.getParallelBatches();
      expect(batches).toHaveLength(2);

      const batch0Ids = batches[0].batch.map((t) => t.id).sort();
      expect(batch0Ids).toEqual(["task-1", "task-2"]);

      expect(batches[1].batch[0].id).toBe("task-3");
    });
  });

  describe("getDependents", () => {
    it("should return tasks that depend on specified task", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);
      const task3 = createTask("task-3", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const dependents = graph.getDependents("task-1");
      expect(dependents).toHaveLength(2);
      expect(dependents.map((t) => t.id).sort()).toEqual(["task-2", "task-3"]);
    });

    it("should return empty array for task with no dependents", () => {
      const task = createTask("task-1");
      graph.addTask(task);

      const dependents = graph.getDependents("task-1");
      expect(dependents).toHaveLength(0);
    });

    it("should return empty array for non-existent task", () => {
      const dependents = graph.getDependents("non-existent");
      expect(dependents).toHaveLength(0);
    });
  });

  describe("getDependencies", () => {
    it("should return tasks that specified task depends on", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2");
      const task3 = createTask("task-3", ["task-1", "task-2"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const dependencies = graph.getDependencies("task-3");
      expect(dependencies).toHaveLength(2);
      expect(dependencies.map((t) => t.id).sort()).toEqual([
        "task-1",
        "task-2",
      ]);
    });

    it("should return empty array for task with no dependencies", () => {
      const task = createTask("task-1");
      graph.addTask(task);

      const dependencies = graph.getDependencies("task-1");
      expect(dependencies).toHaveLength(0);
    });

    it("should return empty array for non-existent task", () => {
      const dependencies = graph.getDependencies("non-existent");
      expect(dependencies).toHaveLength(0);
    });
  });

  describe("removeTask", () => {
    it("should remove task without dependents", () => {
      const task = createTask("task-1");
      graph.addTask(task);

      graph.removeTask("task-1");

      expect(graph.hasTask("task-1")).toBe(false);
      expect(graph.size()).toBe(0);
    });

    it("should throw when removing task with dependents", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);

      expect(() => graph.removeTask("task-1")).toThrow(
        "Cannot remove task task-1: tasks [task-2] depend on it"
      );
    });

    it("should update dependencies when removing task", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);

      graph.removeTask("task-2");

      const dependents = graph.getDependents("task-1");
      expect(dependents).toHaveLength(0);
    });

    it("should do nothing when removing non-existent task", () => {
      expect(() => graph.removeTask("non-existent")).not.toThrow();
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", () => {
      const task1 = createTask("task-1", [], TaskStatus.COMPLETED);
      const task2 = createTask("task-2", ["task-1"]);
      const task3 = createTask("task-3", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const stats = graph.getStats();
      expect(stats.totalTasks).toBe(3);
      expect(stats.completedTasks).toBe(1);
      expect(stats.pendingTasks).toBe(2);
      expect(stats.executableTasks).toBe(2);
    });

    it("should calculate max dependency depth", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);
      const task3 = createTask("task-3", ["task-2"]);

      graph.addTask(task1);
      graph.addTask(task2);
      graph.addTask(task3);

      const stats = graph.getStats();
      expect(stats.maxDependencyDepth).toBe(2);
    });

    it("should return 0 depth for graph with no dependencies", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2");

      graph.addTask(task1);
      graph.addTask(task2);

      const stats = graph.getStats();
      expect(stats.maxDependencyDepth).toBe(0);
    });
  });

  describe("validate", () => {
    it("should return no errors for valid graph", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);

      const errors = graph.validate();
      expect(errors).toHaveLength(0);
    });

    it("should detect missing dependencies", () => {
      const task = createTask("task-1", ["non-existent"]);
      graph.addTask(task);

      const errors = graph.validate();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("depends on non-existent task non-existent");
    });

    it("should detect cycles", () => {
      const task1 = createTask("task-1", ["task-2"]);
      const task2 = createTask("task-2", ["task-1"]);

      graph.addTask(task1);
      graph.addTask(task2);

      const errors = graph.validate();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Cycle detected");
    });
  });

  describe("clear", () => {
    it("should remove all tasks", () => {
      const task1 = createTask("task-1");
      const task2 = createTask("task-2");

      graph.addTask(task1);
      graph.addTask(task2);

      graph.clear();

      expect(graph.size()).toBe(0);
      expect(graph.getStats().totalTasks).toBe(0);
    });
  });
});

describe("buildDependencyGraph (functional API)", () => {
  const createTask = (id: string, dependencies: string[] = []): Task => ({
    id,
    description: `Task ${id}`,
    assignedAgent: AgentType.FRONTEND,
    status: TaskStatus.PENDING,
    dependencies,
    createdAt: new Date(),
    timeoutMs: 5000,
  });

  it("should build graph from task array", () => {
    const tasks = [createTask("task-1"), createTask("task-2", ["task-1"])];

    const graph = buildDependencyGraph(tasks);

    expect(graph.nodes.size).toBe(2);
    expect(graph.nodes.get("task-1")).toBeDefined();
    expect(graph.nodes.get("task-2")).toBeDefined();
  });

  it("should populate dependents", () => {
    const tasks = [createTask("task-1"), createTask("task-2", ["task-1"])];

    const graph = buildDependencyGraph(tasks);
    const task1Node = graph.nodes.get("task-1");

    expect(task1Node?.dependents.has("task-2")).toBe(true);
  });

  it("should throw on missing dependency", () => {
    const tasks = [createTask("task-1", ["non-existent"])];

    expect(() => buildDependencyGraph(tasks)).toThrow(
      "Task task-1 depends on unknown task non-existent"
    );
  });

  it("should throw on circular dependency", () => {
    const tasks = [
      createTask("task-1", ["task-2"]),
      createTask("task-2", ["task-1"]),
    ];

    expect(() => buildDependencyGraph(tasks)).toThrow(
      "Circular dependency detected"
    );
  });
});

describe("getExecutionLayers (functional API)", () => {
  const createTask = (id: string, dependencies: string[] = []): Task => ({
    id,
    description: `Task ${id}`,
    assignedAgent: AgentType.FRONTEND,
    status: TaskStatus.PENDING,
    dependencies,
    createdAt: new Date(),
    timeoutMs: 5000,
  });

  it("should create single layer for independent tasks", () => {
    const tasks = [
      createTask("task-1"),
      createTask("task-2"),
      createTask("task-3"),
    ];

    const graph = buildDependencyGraph(tasks);
    const layers = getExecutionLayers(graph);

    expect(layers).toHaveLength(1);
    expect(layers[0]).toHaveLength(3);
  });

  it("should create multiple layers for dependent tasks", () => {
    const tasks = [
      createTask("task-1"),
      createTask("task-2", ["task-1"]),
      createTask("task-3", ["task-2"]),
    ];

    const graph = buildDependencyGraph(tasks);
    const layers = getExecutionLayers(graph);

    expect(layers).toHaveLength(3);
    expect(layers[0][0].id).toBe("task-1");
    expect(layers[1][0].id).toBe("task-2");
    expect(layers[2][0].id).toBe("task-3");
  });

  it("should group parallel tasks in same layer", () => {
    const tasks = [
      createTask("task-1"),
      createTask("task-2", ["task-1"]),
      createTask("task-3", ["task-1"]),
    ];

    const graph = buildDependencyGraph(tasks);
    const layers = getExecutionLayers(graph);

    expect(layers).toHaveLength(2);
    expect(layers[0]).toHaveLength(1);
    expect(layers[1]).toHaveLength(2);
  });
});
