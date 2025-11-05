import type {
  AgentType,
  WorkflowEventBus as IWorkflowEventBus,
  TaskId,
  WorkflowEvent,
  WorkflowId,
} from "../types/workflow.types";

export interface BranchProgressMetrics {
  workflowId: WorkflowId;
  branchId: string; // Unique identifier for the parallel branch
  agentType: AgentType;
  taskId: TaskId;
  progress: number; // 0-100
  status: "pending" | "active" | "completed" | "failed";
  estimatedTimeRemaining?: number; // milliseconds
  startedAt?: Date;
  completedAt?: Date;
}

export interface ParallelExecutionMetrics {
  workflowId: WorkflowId;
  totalBranches: number;
  activeBranches: number;
  completedBranches: number;
  failedBranches: number;
  overallProgress: number; // 0-100
  estimatedTimeRemaining?: number; // milliseconds
  bottlenecks?: AgentType[]; // Agents that might be slowing progress
}

export class WorkflowEventBus implements IWorkflowEventBus {
  private subscribers = new Map<
    WorkflowId,
    Set<(event: WorkflowEvent) => void>
  >();
  private globalSubscribers = new Set<(event: WorkflowEvent) => void>();
  private branchMetrics = new Map<string, BranchProgressMetrics>();
  private parallelMetrics = new Map<WorkflowId, ParallelExecutionMetrics>();

  emit(event: WorkflowEvent): void {
    // Structured logging for telemetry
    this.logEvent(event);

    this.emitToWorkflow(event.workflowId, event);
    this.emitGlobally(event);

    // Emit branch progress metrics for parallel execution events
    if (this.isParallelExecutionEvent(event)) {
      this.emitBranchProgressMetrics(event);
      this.emitParallelExecutionMetrics(event.workflowId);
    }
  }

  /**
   * Structured logging for telemetry and observability
   * Logs workflow events with consistent format for monitoring tools
   */
  private logEvent(event: WorkflowEvent): void {
    const logData = {
      timestamp: event.timestamp.toISOString(),
      workflowId: event.workflowId,
      eventType: event.type,
      data: event.data,
    };

    // Use console for now; can be replaced with structured logging service
    if (process.env.NODE_ENV === "development") {
      console.log("[WorkflowEventBus]", JSON.stringify(logData, null, 2));
    }

    // In production, emit to telemetry service
    // telemetryService.recordEvent('workflow_event', logData);
  }

  /**
   * Log branch progress with structured format
   * Optimized for monitoring individual parallel branch execution
   */
  private logBranchProgress(metrics: BranchProgressMetrics): void {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const logData = {
      type: "branch_progress",
      workflowId: metrics.workflowId,
      branchId: metrics.branchId,
      agent: metrics.agentType,
      task: metrics.taskId,
      progress: `${metrics.progress}%`,
      status: metrics.status,
      timeRemaining: metrics.estimatedTimeRemaining
        ? `${metrics.estimatedTimeRemaining}ms`
        : "unknown",
      duration: this.calculateDuration(metrics.startedAt, metrics.completedAt),
    };

    console.log("[BranchProgress]", JSON.stringify(logData, null, 2));
  }

  /**
   * Log parallel execution metrics with structured format
   * Provides overview of all parallel branches progress
   */
  private logParallelExecution(metrics: ParallelExecutionMetrics): void {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const logData = {
      type: "parallel_execution",
      workflowId: metrics.workflowId,
      branches: {
        total: metrics.totalBranches,
        active: metrics.activeBranches,
        completed: metrics.completedBranches,
        failed: metrics.failedBranches,
      },
      overallProgress: `${metrics.overallProgress}%`,
      timeRemaining: metrics.estimatedTimeRemaining
        ? `${metrics.estimatedTimeRemaining}ms`
        : "unknown",
      bottlenecks: metrics.bottlenecks || [],
    };

    console.log("[ParallelExecution]", JSON.stringify(logData, null, 2));
  }

  /**
   * Calculate duration between two dates for logging
   */
  private calculateDuration(
    startedAt?: Date,
    completedAt?: Date
  ): string | undefined {
    if (!startedAt) {
      return;
    }

    const end = completedAt || new Date();
    const durationMs = end.getTime() - startedAt.getTime();
    return `${durationMs}ms`;
  }

  subscribe(
    workflowId: WorkflowId,
    handler: (event: WorkflowEvent) => void
  ): () => void {
    if (workflowId === "*") {
      this.globalSubscribers.add(handler);
      return () => this.globalSubscribers.delete(handler);
    }

    this.addSubscriber(workflowId, handler);

    return () => {
      this.removeSubscriber(workflowId, handler);
    };
  }

  /**
   * Emit branch progress event for individual parallel branch
   * Provides real-time progress updates for specific agent execution
   */
  emitBranchProgress(
    workflowId: WorkflowId,
    branchId: string,
    agentType: AgentType,
    taskId: TaskId,
    progress: number,
    status: BranchProgressMetrics["status"],
    estimatedTimeRemaining?: number,
    startedAt?: Date,
    completedAt?: Date
  ): void {
    const metrics: BranchProgressMetrics = {
      workflowId,
      branchId,
      agentType,
      taskId,
      progress: Math.min(100, Math.max(0, progress)), // Clamp 0-100
      status,
      estimatedTimeRemaining,
      startedAt,
      completedAt,
    };

    const key = `${workflowId}:${branchId}`;
    this.branchMetrics.set(key, metrics);

    // Emit branch progress event
    this.emit({
      type: "branch_progress",
      workflowId,
      timestamp: new Date(),
      data: metrics,
    });

    // Log structured branch progress
    this.logBranchProgress(metrics);
  }

  // Branch progress tracking methods
  updateBranchProgress(metrics: BranchProgressMetrics): void {
    const key = `${metrics.workflowId}:${metrics.branchId}`;
    this.branchMetrics.set(key, metrics);

    // Emit branch progress update event
    this.emit({
      type: "branch_progress",
      workflowId: metrics.workflowId,
      timestamp: new Date(),
      data: metrics,
    });
  }

  getBranchProgress(
    workflowId: WorkflowId,
    branchId: string
  ): BranchProgressMetrics | null {
    const key = `${workflowId}:${branchId}`;
    return this.branchMetrics.get(key) || null;
  }

  getAllBranchProgress(workflowId: WorkflowId): BranchProgressMetrics[] {
    const branches: BranchProgressMetrics[] = [];
    this.branchMetrics.forEach((metrics, key) => {
      if (key.startsWith(`${workflowId}:`)) {
        branches.push(metrics);
      }
    });
    return branches;
  }

  /**
   * Emit parallel execution update event
   * Provides overall progress metrics for all parallel branches
   */
  emitParallelExecutionUpdate(
    workflowId: WorkflowId,
    totalBranches: number,
    activeBranches: number,
    completedBranches: number,
    failedBranches: number,
    overallProgress: number,
    estimatedTimeRemaining?: number,
    bottlenecks?: AgentType[]
  ): void {
    const metrics: ParallelExecutionMetrics = {
      workflowId,
      totalBranches,
      activeBranches,
      completedBranches,
      failedBranches,
      overallProgress: Math.min(100, Math.max(0, overallProgress)), // Clamp 0-100
      estimatedTimeRemaining,
      bottlenecks:
        bottlenecks && bottlenecks.length > 0 ? bottlenecks : undefined,
    };

    this.parallelMetrics.set(workflowId, metrics);

    // Emit parallel execution update event
    this.emit({
      type: "parallel_execution_update",
      workflowId,
      timestamp: new Date(),
      data: metrics,
    });

    // Log structured parallel execution metrics
    this.logParallelExecution(metrics);
  }

  // Parallel execution metrics methods
  updateParallelExecutionMetrics(
    workflowId: WorkflowId,
    metrics: ParallelExecutionMetrics
  ): void {
    this.parallelMetrics.set(workflowId, metrics);

    // Emit parallel execution update event
    this.emit({
      type: "parallel_execution_update",
      workflowId,
      timestamp: new Date(),
      data: metrics,
    });
  }

  getParallelExecutionMetrics(
    workflowId: WorkflowId
  ): ParallelExecutionMetrics | null {
    return this.parallelMetrics.get(workflowId) || null;
  }

  // Helper methods for event management
  private addSubscriber(
    workflowId: WorkflowId,
    handler: (event: WorkflowEvent) => void
  ): void {
    const existing = this.subscribers.get(workflowId);
    if (existing) {
      existing.add(handler);
      return;
    }

    this.subscribers.set(workflowId, new Set([handler]));
  }

  private removeSubscriber(
    workflowId: WorkflowId,
    handler: (event: WorkflowEvent) => void
  ): void {
    const handlers = this.subscribers.get(workflowId);
    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (handlers.size === 0) {
      this.subscribers.delete(workflowId);
    }
  }

  private emitToWorkflow(workflowId: WorkflowId, event: WorkflowEvent): void {
    const handlers = this.subscribers.get(workflowId);
    if (!handlers || handlers.size === 0) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        process.emitWarning?.(
          `WorkflowEventBus subscriber error (${workflowId}:${event.type})`,
          {
            detail: error instanceof Error ? error.message : `${error}`,
          }
        );
      }
    });
  }

  private emitGlobally(event: WorkflowEvent): void {
    if (this.globalSubscribers.size === 0) {
      return;
    }

    this.globalSubscribers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        process.emitWarning?.(
          `WorkflowEventBus global subscriber error (${event.workflowId}:${event.type})`,
          {
            detail: error instanceof Error ? error.message : `${error}`,
          }
        );
      }
    });
  }

  private isParallelExecutionEvent(event: WorkflowEvent): boolean {
    return ["agent_changed", "task_completed", "task_failed"].includes(
      event.type
    );
  }

  private emitBranchProgressMetrics(event: WorkflowEvent): void {
    // Extract branch information from event data
    const eventData = event.data as any;

    if (eventData && eventData.taskId && eventData.agentType) {
      const branchId = `${eventData.agentType}:${eventData.taskId}`;

      const metrics: BranchProgressMetrics = {
        workflowId: event.workflowId,
        branchId,
        agentType: eventData.agentType,
        taskId: eventData.taskId,
        progress: this.calculateProgressFromEvent(event),
        status: this.mapEventTypeToStatus(event.type),
        startedAt: event.type === "agent_changed" ? event.timestamp : undefined,
        completedAt: ["task_completed", "task_failed"].includes(event.type)
          ? event.timestamp
          : undefined,
      };

      this.updateBranchProgress(metrics);
    }
  }

  private emitParallelExecutionMetrics(workflowId: WorkflowId): void {
    const branches = this.getAllBranchProgress(workflowId);

    if (branches.length === 0) return;

    const totalBranches = branches.length;
    const activeBranches = branches.filter((b) => b.status === "active").length;
    const completedBranches = branches.filter(
      (b) => b.status === "completed"
    ).length;
    const failedBranches = branches.filter((b) => b.status === "failed").length;

    const overallProgress =
      branches.reduce((sum, branch) => sum + branch.progress, 0) /
      totalBranches;

    // Identify bottlenecks (branches that are significantly behind)
    const avgProgress = overallProgress;
    const bottlenecks = branches
      .filter((b) => b.status === "active" && b.progress < avgProgress * 0.5)
      .map((b) => b.agentType);

    const metrics: ParallelExecutionMetrics = {
      workflowId,
      totalBranches,
      activeBranches,
      completedBranches,
      failedBranches,
      overallProgress: Math.round(overallProgress),
      bottlenecks:
        bottlenecks.length > 0 ? Array.from(new Set(bottlenecks)) : undefined,
    };

    this.updateParallelExecutionMetrics(workflowId, metrics);
  }

  private calculateProgressFromEvent(event: WorkflowEvent): number {
    switch (event.type) {
      case "agent_changed":
        return 10; // Just started
      case "task_completed":
        return 100; // Finished
      case "task_failed":
        return 0; // Failed, needs retry
      default:
        return 50; // In progress
    }
  }

  private mapEventTypeToStatus(
    eventType: string
  ): BranchProgressMetrics["status"] {
    switch (eventType) {
      case "agent_changed":
        return "active";
      case "task_completed":
        return "completed";
      case "task_failed":
        return "failed";
      default:
        return "pending";
    }
  }

  // Cleanup methods
  clearWorkflow(workflowId: WorkflowId): void {
    this.subscribers.delete(workflowId);
    this.parallelMetrics.delete(workflowId);

    // Remove branch metrics for this workflow
    for (const [key] of Array.from(this.branchMetrics.entries())) {
      if (key.startsWith(`${workflowId}:`)) {
        this.branchMetrics.delete(key);
      }
    }
  }

  getSubscriberCount(workflowId: WorkflowId): number {
    return this.subscribers.get(workflowId)?.size ?? 0;
  }
}
