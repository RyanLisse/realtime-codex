import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorkflowEventBus } from "../workflowEventBus";
import { AgentType, type WorkflowEvent } from "../../types/workflow.types";

describe("WorkflowEventBus - Parallel Execution Events", () => {
  let eventBus: WorkflowEventBus;
  const workflowId = "workflow-123";
  const branchId = "branch-1";
  const taskId = "task-1";

  beforeEach(() => {
    eventBus = new WorkflowEventBus();
  });

  describe("emitBranchProgress", () => {
    it("should emit branch progress event with all parameters", () => {
      const events: WorkflowEvent[] = [];
      eventBus.subscribe(workflowId, (event) => events.push(event));

      const startedAt = new Date();
      const completedAt = new Date(startedAt.getTime() + 5000);

      eventBus.emitBranchProgress(
        workflowId,
        branchId,
        AgentType.FRONTEND,
        taskId,
        75,
        "active",
        2000,
        startedAt,
        completedAt
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("branch_progress");
      expect(events[0].workflowId).toBe(workflowId);
      expect(events[0].data).toMatchObject({
        workflowId,
        branchId,
        agentType: AgentType.FRONTEND,
        taskId,
        progress: 75,
        status: "active",
        estimatedTimeRemaining: 2000,
        startedAt,
        completedAt,
      });
    });

    it("should clamp progress to 0-100 range", () => {
      const events: WorkflowEvent[] = [];
      eventBus.subscribe(workflowId, (event) => events.push(event));

      // Test progress > 100
      eventBus.emitBranchProgress(
        workflowId,
        branchId,
        AgentType.BACKEND,
        taskId,
        150,
        "completed"
      );

      expect(events[0].data).toMatchObject({
        progress: 100,
      });

      events.length = 0;

      // Test progress < 0
      eventBus.emitBranchProgress(
        workflowId,
        "branch-2",
        AgentType.TESTER,
        "task-2",
        -50,
        "failed"
      );

      expect(events[0].data).toMatchObject({
        progress: 0,
      });
    });

    it("should store branch metrics for retrieval", () => {
      eventBus.emitBranchProgress(
        workflowId,
        branchId,
        AgentType.DESIGNER,
        taskId,
        50,
        "active"
      );

      const metrics = eventBus.getBranchProgress(workflowId, branchId);
      expect(metrics).not.toBeNull();
      expect(metrics?.progress).toBe(50);
      expect(metrics?.agentType).toBe(AgentType.DESIGNER);
      expect(metrics?.status).toBe("active");
    });

    it("should handle optional parameters as undefined", () => {
      const events: WorkflowEvent[] = [];
      eventBus.subscribe(workflowId, (event) => events.push(event));

      eventBus.emitBranchProgress(
        workflowId,
        branchId,
        AgentType.PROJECT_MANAGER,
        taskId,
        25,
        "pending"
      );

      const data = events[0].data as any;
      expect(data).toMatchObject({
        workflowId,
        branchId,
        agentType: AgentType.PROJECT_MANAGER,
        taskId,
        progress: 25,
        status: "pending",
      });
      expect(data.estimatedTimeRemaining).toBeUndefined();
      expect(data.startedAt).toBeUndefined();
      expect(data.completedAt).toBeUndefined();
    });

    it("should emit to global subscribers", () => {
      const events: WorkflowEvent[] = [];
      eventBus.subscribe("*", (event) => events.push(event));

      eventBus.emitBranchProgress(
        workflowId,
        branchId,
        AgentType.FRONTEND,
        taskId,
        100,
        "completed"
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("branch_progress");
    });
  });

  describe("emitParallelExecutionUpdate", () => {
    it("should emit parallel execution metrics with all parameters", () => {
      const events: WorkflowEvent[] = [];
      eventBus.subscribe(workflowId, (event) => events.push(event));

      const bottlenecks = [AgentType.BACKEND, AgentType.TESTER];

      eventBus.emitParallelExecutionUpdate(
        workflowId,
        5,
        2,
        2,
        1,
        60,
        3000,
        bottlenecks
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("parallel_execution_update");
      expect(events[0].workflowId).toBe(workflowId);
      expect(events[0].data).toMatchObject({
        workflowId,
        totalBranches: 5,
        activeBranches: 2,
        completedBranches: 2,
        failedBranches: 1,
        overallProgress: 60,
        estimatedTimeRemaining: 3000,
        bottlenecks,
      });
    });

    it("should clamp overall progress to 0-100 range", () => {
      const events1: WorkflowEvent[] = [];
      const events2: WorkflowEvent[] = [];

      eventBus.subscribe(workflowId, (event) => events1.push(event));
      eventBus.subscribe("workflow-456", (event) => events2.push(event));

      // Test progress > 100
      eventBus.emitParallelExecutionUpdate(workflowId, 3, 0, 3, 0, 120);

      expect(events1[0].data).toMatchObject({
        overallProgress: 100,
      });

      // Test progress < 0
      eventBus.emitParallelExecutionUpdate(
        "workflow-456",
        3,
        3,
        0,
        0,
        -10
      );

      expect(events2[0].data).toMatchObject({
        overallProgress: 0,
      });
    });

    it("should store parallel metrics for retrieval", () => {
      eventBus.emitParallelExecutionUpdate(workflowId, 4, 2, 1, 1, 50);

      const metrics = eventBus.getParallelExecutionMetrics(workflowId);
      expect(metrics).not.toBeNull();
      expect(metrics?.totalBranches).toBe(4);
      expect(metrics?.activeBranches).toBe(2);
      expect(metrics?.completedBranches).toBe(1);
      expect(metrics?.failedBranches).toBe(1);
      expect(metrics?.overallProgress).toBe(50);
    });

    it("should handle empty bottlenecks array", () => {
      const events: WorkflowEvent[] = [];
      eventBus.subscribe(workflowId, (event) => events.push(event));

      eventBus.emitParallelExecutionUpdate(
        workflowId,
        3,
        1,
        2,
        0,
        80,
        1000,
        []
      );

      const data = events[0].data as any;
      expect(data).toMatchObject({
        overallProgress: 80,
      });
      expect(data.bottlenecks).toBeUndefined();
    });

    it("should handle optional parameters as undefined", () => {
      const events: WorkflowEvent[] = [];
      eventBus.subscribe(workflowId, (event) => events.push(event));

      eventBus.emitParallelExecutionUpdate(workflowId, 2, 2, 0, 0, 25);

      const data = events[0].data as any;
      expect(data).toMatchObject({
        workflowId,
        totalBranches: 2,
        activeBranches: 2,
        completedBranches: 0,
        failedBranches: 0,
        overallProgress: 25,
      });
      expect(data.estimatedTimeRemaining).toBeUndefined();
      expect(data.bottlenecks).toBeUndefined();
    });

    it("should emit to global subscribers", () => {
      const events: WorkflowEvent[] = [];
      eventBus.subscribe("*", (event) => events.push(event));

      eventBus.emitParallelExecutionUpdate(workflowId, 5, 0, 5, 0, 100);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("parallel_execution_update");
    });
  });

  describe("Integration with existing event system", () => {
    it("should support multiple subscribers for branch progress events", () => {
      const subscriber1Events: WorkflowEvent[] = [];
      const subscriber2Events: WorkflowEvent[] = [];

      eventBus.subscribe(workflowId, (event) => subscriber1Events.push(event));
      eventBus.subscribe(workflowId, (event) => subscriber2Events.push(event));

      eventBus.emitBranchProgress(
        workflowId,
        branchId,
        AgentType.FRONTEND,
        taskId,
        50,
        "active"
      );

      expect(subscriber1Events).toHaveLength(1);
      expect(subscriber2Events).toHaveLength(1);
      expect(subscriber1Events[0].type).toBe("branch_progress");
      expect(subscriber2Events[0].type).toBe("branch_progress");
    });

    it("should support unsubscribe for parallel execution events", () => {
      const events: WorkflowEvent[] = [];
      const unsubscribe = eventBus.subscribe(workflowId, (event) =>
        events.push(event)
      );

      eventBus.emitParallelExecutionUpdate(workflowId, 3, 1, 2, 0, 66);
      expect(events).toHaveLength(1);

      unsubscribe();

      eventBus.emitParallelExecutionUpdate(workflowId, 3, 0, 3, 0, 100);
      expect(events).toHaveLength(1); // Still 1, no new events
    });

    it("should retrieve all branch progress for workflow", () => {
      eventBus.emitBranchProgress(
        workflowId,
        "branch-1",
        AgentType.FRONTEND,
        "task-1",
        30,
        "active"
      );
      eventBus.emitBranchProgress(
        workflowId,
        "branch-2",
        AgentType.BACKEND,
        "task-2",
        60,
        "active"
      );
      eventBus.emitBranchProgress(
        workflowId,
        "branch-3",
        AgentType.TESTER,
        "task-3",
        100,
        "completed"
      );

      const allBranches = eventBus.getAllBranchProgress(workflowId);
      expect(allBranches).toHaveLength(3);
      expect(allBranches.map((b) => b.branchId)).toEqual([
        "branch-1",
        "branch-2",
        "branch-3",
      ]);
    });

    it("should clear workflow metrics on clearWorkflow", () => {
      eventBus.emitBranchProgress(
        workflowId,
        branchId,
        AgentType.DESIGNER,
        taskId,
        50,
        "active"
      );
      eventBus.emitParallelExecutionUpdate(workflowId, 1, 1, 0, 0, 50);

      eventBus.clearWorkflow(workflowId);

      expect(eventBus.getBranchProgress(workflowId, branchId)).toBeNull();
      expect(eventBus.getParallelExecutionMetrics(workflowId)).toBeNull();
      expect(eventBus.getAllBranchProgress(workflowId)).toHaveLength(0);
    });
  });

  describe("Error handling", () => {
    it("should handle subscriber errors gracefully for branch progress", () => {
      const events: WorkflowEvent[] = [];
      const consoleWarnSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => {});

      eventBus.subscribe(workflowId, () => {
        throw new Error("Subscriber error");
      });
      eventBus.subscribe(workflowId, (event) => events.push(event));

      eventBus.emitBranchProgress(
        workflowId,
        branchId,
        AgentType.FRONTEND,
        taskId,
        75,
        "active"
      );

      // Second subscriber should still receive event
      expect(events).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should handle subscriber errors gracefully for parallel execution", () => {
      const events: WorkflowEvent[] = [];
      const consoleWarnSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => {});

      eventBus.subscribe(workflowId, () => {
        throw new Error("Subscriber error");
      });
      eventBus.subscribe(workflowId, (event) => events.push(event));

      eventBus.emitParallelExecutionUpdate(workflowId, 2, 1, 1, 0, 50);

      // Second subscriber should still receive event
      expect(events).toHaveLength(1);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Real-world parallel execution scenario", () => {
    it("should track complete parallel workflow lifecycle", () => {
      const allEvents: WorkflowEvent[] = [];
      eventBus.subscribe(workflowId, (event) => allEvents.push(event));

      // Start 3 parallel branches
      eventBus.emitBranchProgress(
        workflowId,
        "frontend-branch",
        AgentType.FRONTEND,
        "task-1",
        0,
        "pending"
      );
      eventBus.emitBranchProgress(
        workflowId,
        "backend-branch",
        AgentType.BACKEND,
        "task-2",
        0,
        "pending"
      );
      eventBus.emitBranchProgress(
        workflowId,
        "designer-branch",
        AgentType.DESIGNER,
        "task-3",
        0,
        "pending"
      );

      // Initial parallel execution state
      eventBus.emitParallelExecutionUpdate(workflowId, 3, 0, 0, 0, 0);

      // Activate branches
      eventBus.emitBranchProgress(
        workflowId,
        "frontend-branch",
        AgentType.FRONTEND,
        "task-1",
        25,
        "active",
        4000,
        new Date()
      );
      eventBus.emitBranchProgress(
        workflowId,
        "backend-branch",
        AgentType.BACKEND,
        "task-2",
        10,
        "active",
        6000,
        new Date()
      );
      eventBus.emitBranchProgress(
        workflowId,
        "designer-branch",
        AgentType.DESIGNER,
        "task-3",
        50,
        "active",
        2000,
        new Date()
      );

      // Update parallel execution
      eventBus.emitParallelExecutionUpdate(
        workflowId,
        3,
        3,
        0,
        0,
        28,
        5000,
        [AgentType.BACKEND]
      );

      // Complete designer branch
      eventBus.emitBranchProgress(
        workflowId,
        "designer-branch",
        AgentType.DESIGNER,
        "task-3",
        100,
        "completed",
        0,
        new Date(Date.now() - 2000),
        new Date()
      );

      // Update parallel execution
      eventBus.emitParallelExecutionUpdate(workflowId, 3, 2, 1, 0, 45, 4000);

      // Complete frontend branch
      eventBus.emitBranchProgress(
        workflowId,
        "frontend-branch",
        AgentType.FRONTEND,
        "task-1",
        100,
        "completed",
        0,
        new Date(Date.now() - 4000),
        new Date()
      );

      // Backend fails
      eventBus.emitBranchProgress(
        workflowId,
        "backend-branch",
        AgentType.BACKEND,
        "task-2",
        60,
        "failed",
        0,
        new Date(Date.now() - 6000),
        new Date()
      );

      // Final parallel execution state
      eventBus.emitParallelExecutionUpdate(workflowId, 3, 0, 2, 1, 86);

      // Verify event sequence
      const branchEvents = allEvents.filter((e) => e.type === "branch_progress");
      const parallelEvents = allEvents.filter(
        (e) => e.type === "parallel_execution_update"
      );

      expect(branchEvents).toHaveLength(9); // 3 pending + 3 active + 3 final states
      expect(parallelEvents).toHaveLength(4); // Initial + 2 updates + final

      // Verify final state
      const finalMetrics = eventBus.getParallelExecutionMetrics(workflowId);
      expect(finalMetrics).toMatchObject({
        totalBranches: 3,
        activeBranches: 0,
        completedBranches: 2,
        failedBranches: 1,
        overallProgress: 86,
      });
    });
  });
});
