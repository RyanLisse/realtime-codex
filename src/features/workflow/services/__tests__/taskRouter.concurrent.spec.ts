import { beforeEach, describe, expect, it } from "vitest";
import { AgentType, type Task, TaskStatus } from "../../types/workflow.types";
import { type ParallelExecutionResult, TaskRouter } from "../taskRouter";

describe("TaskRouter - Concurrent Scheduling", () => {
  let router: TaskRouter;
  const workflowId = "test-workflow-1";

  beforeEach(() => {
    router = new TaskRouter();
  });

  const createTask = (
    id: string,
    dependencies: string[] = [],
    status: TaskStatus = TaskStatus.PENDING,
    timeoutMs = 5000
  ): Task => ({
    id,
    description: `Task ${id}`,
    assignedAgent: AgentType.FRONTEND,
    status,
    dependencies,
    createdAt: new Date(),
    timeoutMs,
  });

  describe("scheduleParallelTasks", () => {
    it("should return empty array for non-existent workflow", async () => {
      const result = await router.scheduleParallelTasks("non-existent");
      expect(result).toEqual([]);
    });

    it("should return empty array for workflow with no tasks", async () => {
      router.syncWorkflowTasks(workflowId, []);
      const result = await router.scheduleParallelTasks(workflowId);
      expect(result).toEqual([]);
    });

    it("should create single batch for independent tasks", async () => {
      const tasks = [
        createTask("task-1"),
        createTask("task-2"),
        createTask("task-3"),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const batches = await router.scheduleParallelTasks(workflowId);

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(3);
      expect(batches[0].map((t) => t.id).sort()).toEqual([
        "task-1",
        "task-2",
        "task-3",
      ]);
    });

    it("should create multiple batches for sequential dependencies", async () => {
      const tasks = [
        createTask("task-1"),
        createTask("task-2", ["task-1"]),
        createTask("task-3", ["task-2"]),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const batches = await router.scheduleParallelTasks(workflowId);

      expect(batches).toHaveLength(3);
      expect(batches[0][0].id).toBe("task-1");
      expect(batches[1][0].id).toBe("task-2");
      expect(batches[2][0].id).toBe("task-3");
    });

    it("should group parallel tasks in same batch", async () => {
      const tasks = [
        createTask("task-1"),
        createTask("task-2", ["task-1"]),
        createTask("task-3", ["task-1"]),
        createTask("task-4", ["task-2", "task-3"]),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const batches = await router.scheduleParallelTasks(workflowId);

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(1); // task-1
      expect(batches[1]).toHaveLength(2); // task-2, task-3
      expect(batches[2]).toHaveLength(1); // task-4
    });

    it("should handle complex dependency trees", async () => {
      const tasks = [
        createTask("task-1"),
        createTask("task-2"),
        createTask("task-3", ["task-1", "task-2"]),
        createTask("task-4", ["task-1"]),
        createTask("task-5", ["task-3", "task-4"]),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const batches = await router.scheduleParallelTasks(workflowId);

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(2); // task-1, task-2
      expect(batches[1]).toHaveLength(2); // task-3, task-4
      expect(batches[2]).toHaveLength(1); // task-5
    });
  });

  describe("resolveDependencies", () => {
    it("should return empty for non-existent workflow", () => {
      const result = router.resolveDependencies("non-existent");
      expect(result.independent).toEqual([]);
      expect(result.dependent.size).toBe(0);
    });

    it("should identify all tasks as independent when no dependencies", () => {
      const tasks = [createTask("task-1"), createTask("task-2")];

      router.syncWorkflowTasks(workflowId, tasks);
      const result = router.resolveDependencies(workflowId);

      expect(result.independent).toHaveLength(2);
      expect(result.dependent.size).toBe(0);
    });

    it("should separate independent and dependent tasks", () => {
      const tasks = [
        createTask("task-1"),
        createTask("task-2", ["task-1"]),
        createTask("task-3"),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const result = router.resolveDependencies(workflowId);

      expect(result.independent).toHaveLength(2);
      expect(result.independent.map((t) => t.id).sort()).toEqual([
        "task-1",
        "task-3",
      ]);
      expect(result.dependent.size).toBe(1);
      expect(result.dependent.get("task-2")).toEqual(["task-1"]);
    });

    it("should map multiple dependencies correctly", () => {
      const tasks = [
        createTask("task-1"),
        createTask("task-2"),
        createTask("task-3", ["task-1", "task-2"]),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const result = router.resolveDependencies(workflowId);

      expect(result.dependent.get("task-3")).toEqual(["task-1", "task-2"]);
    });
  });

  describe("getBatchExecutionPlan", () => {
    it("should return empty plan for non-existent workflow", async () => {
      const plan = await router.getBatchExecutionPlan("non-existent");
      expect(plan.batches).toEqual([]);
      expect(plan.totalEstimatedDuration).toBe(0);
      expect(plan.parallelizationRatio).toBe(0);
    });

    it("should return empty plan for workflow with no tasks", async () => {
      router.syncWorkflowTasks(workflowId, []);
      const plan = await router.getBatchExecutionPlan(workflowId);
      expect(plan.batches).toEqual([]);
      expect(plan.totalEstimatedDuration).toBe(0);
      expect(plan.parallelizationRatio).toBe(0);
    });

    it("should calculate plan for independent tasks", async () => {
      const tasks = [
        createTask("task-1", [], TaskStatus.PENDING, 1000),
        createTask("task-2", [], TaskStatus.PENDING, 1000),
        createTask("task-3", [], TaskStatus.PENDING, 1000),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const plan = await router.getBatchExecutionPlan(workflowId);

      expect(plan.batches).toHaveLength(1);
      expect(plan.batches[0].canExecuteInParallel).toBe(true);
      expect(plan.batches[0].tasks).toHaveLength(3);
      expect(plan.totalEstimatedDuration).toBeGreaterThan(0);
      expect(plan.parallelizationRatio).toBeLessThan(1);
    });

    it("should calculate plan for sequential tasks", async () => {
      const tasks = [
        createTask("task-1", [], TaskStatus.PENDING, 1000),
        createTask("task-2", ["task-1"], TaskStatus.PENDING, 1000),
        createTask("task-3", ["task-2"], TaskStatus.PENDING, 1000),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const plan = await router.getBatchExecutionPlan(workflowId);

      expect(plan.batches).toHaveLength(3);
      expect(plan.batches[0].canExecuteInParallel).toBe(false);
      expect(plan.totalEstimatedDuration).toBeGreaterThan(0);
      expect(plan.parallelizationRatio).toBeCloseTo(1, 1);
    });

    it("should calculate parallelization ratio correctly", async () => {
      const tasks = [
        createTask("task-1", [], TaskStatus.PENDING, 1000),
        createTask("task-2", ["task-1"], TaskStatus.PENDING, 1000),
        createTask("task-3", ["task-1"], TaskStatus.PENDING, 1000),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const plan = await router.getBatchExecutionPlan(workflowId);

      expect(plan.batches).toHaveLength(2);
      expect(plan.batches[1].canExecuteInParallel).toBe(true);
      expect(plan.parallelizationRatio).toBeLessThan(1);
      expect(plan.parallelizationRatio).toBeGreaterThan(0);
    });

    it("should handle complex dependency trees", async () => {
      const tasks = [
        createTask("task-1", [], TaskStatus.PENDING, 1000),
        createTask("task-2", [], TaskStatus.PENDING, 1000),
        createTask("task-3", ["task-1", "task-2"], TaskStatus.PENDING, 1000),
        createTask("task-4", ["task-1"], TaskStatus.PENDING, 1000),
        createTask("task-5", ["task-3", "task-4"], TaskStatus.PENDING, 1000),
      ];

      router.syncWorkflowTasks(workflowId, tasks);
      const plan = await router.getBatchExecutionPlan(workflowId);

      expect(plan.batches).toHaveLength(3);
      expect(plan.batches[0].tasks).toHaveLength(2); // task-1, task-2
      expect(plan.batches[1].tasks).toHaveLength(2); // task-3, task-4
      expect(plan.batches[2].tasks).toHaveLength(1); // task-5
    });
  });

  describe("canExecuteParallel", () => {
    it("should return false for non-existent workflow", () => {
      expect(router.canExecuteParallel("non-existent", ["task-1"])).toBe(false);
    });

    it("should return false for single task", () => {
      const tasks = [createTask("task-1")];
      router.syncWorkflowTasks(workflowId, tasks);
      expect(router.canExecuteParallel(workflowId, ["task-1"])).toBe(false);
    });

    it("should return true for independent tasks", () => {
      const tasks = [createTask("task-1"), createTask("task-2")];
      router.syncWorkflowTasks(workflowId, tasks);
      expect(router.canExecuteParallel(workflowId, ["task-1", "task-2"])).toBe(
        true
      );
    });

    it("should return false for dependent tasks", () => {
      const tasks = [createTask("task-1"), createTask("task-2", ["task-1"])];
      router.syncWorkflowTasks(workflowId, tasks);
      expect(router.canExecuteParallel(workflowId, ["task-1", "task-2"])).toBe(
        false
      );
    });

    it("should return false for tasks when not all tasks provided", () => {
      const tasks = [
        createTask("task-1"),
        createTask("task-2", ["task-1"]),
        createTask("task-3", ["task-1"]),
      ];
      router.syncWorkflowTasks(workflowId, tasks);
      // When checking only task-2 and task-3, dependencies aren't in the subset
      expect(router.canExecuteParallel(workflowId, ["task-2", "task-3"])).toBe(
        false
      );
    });
  });

  describe("mergeParallelResults", () => {
    it("should handle empty results array", () => {
      const merged = router.mergeParallelResults([]);
      expect(merged.successful).toEqual([]);
      expect(merged.failed).toEqual([]);
      expect(merged.totalExecutionTime).toBe(0);
      expect(merged.successRate).toBe(0);
    });

    it("should aggregate successful results", () => {
      const results: ParallelExecutionResult<string>[] = [
        {
          taskId: "task-1",
          success: true,
          result: "result-1",
          executionTime: 100,
        },
        {
          taskId: "task-2",
          success: true,
          result: "result-2",
          executionTime: 200,
        },
      ];

      const merged = router.mergeParallelResults(results);
      expect(merged.successful).toHaveLength(2);
      expect(merged.failed).toHaveLength(0);
      expect(merged.totalExecutionTime).toBe(300);
      expect(merged.successRate).toBe(1);
    });

    it("should aggregate failed results", () => {
      const error1 = new Error("Error 1");
      const error2 = new Error("Error 2");

      const results: ParallelExecutionResult[] = [
        {
          taskId: "task-1",
          success: false,
          error: error1,
          executionTime: 100,
        },
        {
          taskId: "task-2",
          success: false,
          error: error2,
          executionTime: 200,
        },
      ];

      const merged = router.mergeParallelResults(results);
      expect(merged.successful).toHaveLength(0);
      expect(merged.failed).toHaveLength(2);
      expect(merged.failed[0].error).toBe(error1);
      expect(merged.failed[1].error).toBe(error2);
      expect(merged.successRate).toBe(0);
    });

    it("should handle mixed success and failure", () => {
      const error = new Error("Task failed");
      const results: ParallelExecutionResult<number>[] = [
        {
          taskId: "task-1",
          success: true,
          result: 42,
          executionTime: 100,
        },
        {
          taskId: "task-2",
          success: false,
          error,
          executionTime: 150,
        },
        {
          taskId: "task-3",
          success: true,
          result: 84,
          executionTime: 120,
        },
      ];

      const merged = router.mergeParallelResults(results);
      expect(merged.successful).toHaveLength(2);
      expect(merged.failed).toHaveLength(1);
      expect(merged.totalExecutionTime).toBe(370);
      expect(merged.successRate).toBeCloseTo(0.666, 2);
    });

    it("should preserve result types", () => {
      const results: ParallelExecutionResult<{ data: string }>[] = [
        {
          taskId: "task-1",
          success: true,
          result: { data: "test" },
          executionTime: 100,
        },
      ];

      const merged = router.mergeParallelResults(results);
      expect(merged.successful[0].result).toEqual({ data: "test" });
      expect(merged.successful[0].taskId).toBe("task-1");
    });

    it("should calculate success rate correctly", () => {
      const results: ParallelExecutionResult[] = [
        { taskId: "task-1", success: true, result: 1, executionTime: 100 },
        { taskId: "task-2", success: true, result: 2, executionTime: 100 },
        { taskId: "task-3", success: true, result: 3, executionTime: 100 },
        {
          taskId: "task-4",
          success: false,
          error: new Error("fail"),
          executionTime: 100,
        },
      ];

      const merged = router.mergeParallelResults(results);
      expect(merged.successRate).toBe(0.75);
    });
  });

  describe("Integration: Parallel execution workflow", () => {
    it("should handle complete parallel workflow", async () => {
      const tasks = [
        createTask("task-1", [], TaskStatus.PENDING, 1000),
        createTask("task-2", [], TaskStatus.PENDING, 1000),
        createTask("task-3", ["task-1", "task-2"], TaskStatus.PENDING, 1000),
      ];

      router.syncWorkflowTasks(workflowId, tasks);

      const plan = await router.getBatchExecutionPlan(workflowId);
      expect(plan.batches).toHaveLength(2);

      const deps = router.resolveDependencies(workflowId);
      expect(deps.independent).toHaveLength(2);
      expect(deps.dependent.size).toBe(1);

      const batches = await router.scheduleParallelTasks(workflowId);
      expect(batches).toHaveLength(2);
      expect(batches[0]).toHaveLength(2);
      expect(batches[1]).toHaveLength(1);
    });

    it("should support parallel task validation", async () => {
      const tasks = [
        createTask("task-1"),
        createTask("task-2"),
        createTask("task-3", ["task-1"]),
        createTask("task-4", ["task-1"]),
      ];

      router.syncWorkflowTasks(workflowId, tasks);

      // Independent tasks can execute in parallel
      expect(router.canExecuteParallel(workflowId, ["task-1", "task-2"])).toBe(
        true
      );
      // Tasks with dependencies not in subset return false
      expect(router.canExecuteParallel(workflowId, ["task-3", "task-4"])).toBe(
        false
      );
      // Dependent tasks cannot execute in parallel
      expect(router.canExecuteParallel(workflowId, ["task-1", "task-3"])).toBe(
        false
      );
    });
  });
});
