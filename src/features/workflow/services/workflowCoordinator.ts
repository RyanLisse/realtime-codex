import { randomUUID } from "node:crypto";
import { inferRequiredAgents } from "../config/agentCapabilities";
import { ArtifactIdSchema } from "../types/workflow.schema";
import type {
  BranchProgressMetrics,
  CreateWorkflowParams,
  HandoffRecord,
  ParallelExecutionMetrics,
  Task,
  TaskId,
  TaskRouter,
  Workflow,
  WorkflowCoordinator as IWorkflowCoordinator,
  WorkflowEventBus,
  WorkflowId,
  WorkflowPersistence,
} from "../types/workflow.types";
import { AgentType, TaskStatus, WorkflowStatus } from "../types/workflow.types";
import {
  buildDependencyGraph,
  type DependencyGraph,
  getReadyTasks,
} from "./dependencyGraph";
import { TaskQueue } from "./taskQueue";

export type WorkflowCoordinatorDependencies = {
  persistence: WorkflowPersistence;
  eventBus: WorkflowEventBus;
  taskRouter: TaskRouter;
  agentOrder?: AgentType[];
  maxConcurrentTasks?: number;
  defaultTaskTimeoutMs?: number;
};

type WorkflowRuntimeState = {
  queue: TaskQueue;
  parallelBranches?: Map<string, ParallelBranch>;
  convergencePoints?: Map<TaskId, Set<TaskId>>;
};

type ParallelBranch = {
  id: string;
  taskId: TaskId;
  agentType: AgentType;
  status: "active" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
};

const DEFAULT_MAX_CONCURRENT_TASKS = 10;
const DEFAULT_TASK_TIMEOUT_MS = 15 * 60 * 1000;
const PERCENT_SCALE = 100;
const BOTTLENECK_THRESHOLD_MULTIPLIER = 1.5;

const DEFAULT_AGENT_ORDER: AgentType[] = [
  AgentType.PROJECT_MANAGER,
  AgentType.DESIGNER,
  AgentType.FRONTEND,
  AgentType.BACKEND,
  AgentType.TESTER,
];

export class WorkflowCoordinator implements IWorkflowCoordinator {
  private readonly persistence: WorkflowPersistence;
  private readonly eventBus: WorkflowEventBus;
  private readonly taskRouter: TaskRouter;
  private readonly agentOrder: AgentType[];
  private readonly maxConcurrentTasks: number;
  private readonly runtime = new Map<WorkflowId, WorkflowRuntimeState>();
  private readonly dependencyGraphs = new Map<WorkflowId, DependencyGraph>();
  private readonly defaultTaskTimeoutMs: number;

  constructor(dependencies: WorkflowCoordinatorDependencies) {
    this.persistence = dependencies.persistence;
    this.eventBus = dependencies.eventBus;
    this.taskRouter = dependencies.taskRouter;
    this.maxConcurrentTasks =
      dependencies.maxConcurrentTasks ?? DEFAULT_MAX_CONCURRENT_TASKS;
    this.agentOrder = dependencies.agentOrder ?? DEFAULT_AGENT_ORDER;
    this.defaultTaskTimeoutMs =
      dependencies.defaultTaskTimeoutMs ?? DEFAULT_TASK_TIMEOUT_MS;
  }

  async createWorkflow(params: CreateWorkflowParams): Promise<WorkflowId> {
    const workflowId = this.generateWorkflowId();
    const tasks = this.createInitialTasks(workflowId, params);

    const queue = new TaskQueue();
    for (const task of tasks) {
      queue.enqueue(task);
    }

    const now = new Date();
    const workflow: Workflow = {
      id: workflowId,
      description: params.description,
      status: WorkflowStatus.IN_PROGRESS,
      createdAt: now,
      updatedAt: now,
      currentAgent: tasks[0]?.assignedAgent ?? null,
      taskQueue: tasks,
      completedTasks: [],
      artifacts: [],
      history: [],
    };

    this.runtime.set(workflowId, { queue });
    this.updateDependencyGraph(workflow);
    this.syncTaskRouter(workflow);

    await this.saveWorkflow(workflow);

    this.eventBus.emit({
      type: "created",
      workflowId,
      timestamp: now,
      data: { description: params.description },
    });

    await this.processWorkflow(workflowId);

    return workflowId;
  }

  async getWorkflow(id: WorkflowId): Promise<Workflow | null> {
    const workflow = await this.persistence.loadWorkflow(id);
    if (!workflow) {
      return null;
    }
    this.ensureRuntime(workflow);
    this.syncTaskRouter(workflow);
    return workflow;
  }

  async pauseWorkflow(id: WorkflowId): Promise<void> {
    const workflow = await this.loadWorkflow(id);
    if (workflow.status !== WorkflowStatus.IN_PROGRESS) {
      return;
    }

    workflow.status = WorkflowStatus.PAUSED;
    workflow.updatedAt = new Date();
    await this.saveWorkflow(workflow);

    this.eventBus.emit({
      type: "paused",
      workflowId: id,
      timestamp: workflow.updatedAt,
      data: { reason: "manual" },
    });
  }

  async resumeWorkflow(id: WorkflowId): Promise<void> {
    const workflow = await this.loadWorkflow(id);
    if (workflow.status !== WorkflowStatus.PAUSED) {
      return;
    }

    const runtime = this.ensureRuntime(workflow);

    workflow.status = WorkflowStatus.IN_PROGRESS;
    workflow.currentAgent = null;
    workflow.updatedAt = new Date();

    // Reset failed tasks so they can be retried
    for (const task of workflow.taskQueue) {
      if (task.status === TaskStatus.FAILED) {
        task.status = TaskStatus.PENDING;
        task.startedAt = undefined;
        runtime.queue.removeTask(task.id);
        runtime.queue.enqueue(task);
      }
    }

    await this.saveWorkflow(workflow);
    this.syncTaskRouter(workflow);

    this.eventBus.emit({
      type: "resumed",
      workflowId: id,
      timestamp: workflow.updatedAt,
    });

    await this.processWorkflow(id);
  }

  async cancelWorkflow(id: WorkflowId): Promise<void> {
    const workflow = await this.loadWorkflow(id);
    if (
      workflow.status === WorkflowStatus.COMPLETED ||
      workflow.status === WorkflowStatus.FAILED
    ) {
      return;
    }

    workflow.status = WorkflowStatus.FAILED;
    workflow.currentAgent = null;
    workflow.updatedAt = new Date();

    const runtime = this.ensureRuntime(workflow);
    runtime.queue.clear();

    await this.saveWorkflow(workflow);
    this.syncTaskRouter(workflow);

    this.runtime.delete(id);
    this.dependencyGraphs.delete(id);
    this.taskRouter.removeWorkflow(id);

    this.eventBus.emit({
      type: "failed",
      workflowId: id,
      timestamp: workflow.updatedAt,
      data: { reason: "cancelled" },
    });
  }

  async completeTask(
    workflowId: WorkflowId,
    taskId: TaskId,
    result: unknown
  ): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);
    const runtime = this.ensureRuntime(workflow);

    const taskIndex = workflow.taskQueue.findIndex(
      (task) => task.id === taskId
    );
    if (taskIndex === -1) {
      return;
    }

    const task = workflow.taskQueue[taskIndex];
    const now = new Date();

    task.status = TaskStatus.COMPLETED;
    task.result = result;
    task.completedAt = now;

    this.appendArtifactsFromResult(workflow, result);

    workflow.completedTasks.push(task);
    workflow.taskQueue.splice(taskIndex, 1);
    workflow.currentAgent = null;
    workflow.updatedAt = now;

    runtime.queue.markCompleted(taskId);

    // Handle parallel branch completion if applicable
    await this.handleParallelBranchCompletion(workflowId, taskId, true);

    const graph = this.updateDependencyGraph(workflow);
    const readyTasks = getReadyTasks(
      graph,
      new Set(workflow.completedTasks.map((t) => t.id))
    );

    for (const nextTask of readyTasks) {
      const handoff: HandoffRecord = {
        id: this.generateId(),
        workflowId,
        fromAgent: task.assignedAgent,
        toAgent: nextTask.assignedAgent,
        context: this.buildHandoffContext(task, nextTask),
        artifacts: [...workflow.artifacts],
        timestamp: now,
        success: true,
      };
      workflow.history.push(handoff);
    }

    await this.saveWorkflow(workflow);
    this.syncTaskRouter(workflow);

    this.eventBus.emit({
      type: "task_completed",
      workflowId,
      timestamp: now,
      data: { taskId, agentType: task.assignedAgent },
    });

    // Check if we're in a parallel execution state
    const hasActiveBranches = runtime.parallelBranches && runtime.parallelBranches.size > 0;

    if (hasActiveBranches) {
      // Only process workflow if all parallel branches have converged
      const isConverged = await this.waitForParallelConvergence(workflowId);
      if (isConverged) {
        await this.processWorkflow(workflowId);
      }
    } else {
      // No parallel branches, proceed normally
      await this.processWorkflow(workflowId);
    }
  }

  async failTask(
    workflowId: WorkflowId,
    taskId: TaskId,
    error: Error
  ): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);
    const runtime = this.ensureRuntime(workflow);

    const task = workflow.taskQueue.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const now = new Date();

    task.status = TaskStatus.FAILED;
    task.result = error.message;
    workflow.status = WorkflowStatus.PAUSED;
    workflow.currentAgent = task.assignedAgent;
    workflow.updatedAt = now;

    runtime.queue.removeTask(taskId);
    runtime.queue.enqueue(task);

    // Handle parallel failure if applicable
    await this.handleParallelFailure(workflowId, taskId, error);

    workflow.history.push({
      id: this.generateId(),
      workflowId,
      fromAgent: task.assignedAgent,
      toAgent: task.assignedAgent,
      context: `Task ${task.description} failed: ${error.message}`,
      artifacts: [...workflow.artifacts],
      timestamp: now,
      success: false,
    });

    await this.saveWorkflow(workflow);
    this.syncTaskRouter(workflow);

    this.eventBus.emit({
      type: "task_failed",
      workflowId,
      timestamp: now,
      data: { taskId, agentType: task.assignedAgent, error: error.message },
    });

    this.eventBus.emit({
      type: "paused",
      workflowId,
      timestamp: now,
      data: { reason: "task_failed", taskId },
    });
  }

  private async processWorkflow(workflowId: WorkflowId): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);
    if (workflow.status !== WorkflowStatus.IN_PROGRESS) {
      return;
    }

    const runtime = this.ensureRuntime(workflow);
    const graph = this.updateDependencyGraph(workflow);
    const completedIds = new Set(
      workflow.completedTasks.map((task) => task.id)
    );
    const readyTasks = getReadyTasks(graph, completedIds);

    if (readyTasks.length === 0) {
      if (runtime.queue.isEmpty() && workflow.taskQueue.length === 0) {
        await this.completeWorkflow(workflowId);
      }
      return;
    }

    // Determine if we should execute tasks in parallel
    if (readyTasks.length > 1) {
      await this.executeParallelTasks(workflowId, readyTasks);
    } else {
      // Single task execution (original behavior)
      const now = new Date();
      const previousAgent = workflow.currentAgent;
      const task = readyTasks[0];

      const resolvedAgent = await this.taskRouter.routeTask(workflowId, task);
      task.assignedAgent = resolvedAgent;
      task.status = TaskStatus.ACTIVE;
      task.startedAt = now;
      runtime.queue.removeTask(task.id);

      workflow.currentAgent = task.assignedAgent;
      workflow.updatedAt = now;

      await this.saveWorkflow(workflow);
      this.syncTaskRouter(workflow);

      this.eventBus.emit({
        type: "agent_changed",
        workflowId,
        timestamp: now,
        data: {
          fromAgent: previousAgent,
          toAgent: task.assignedAgent,
          taskId: task.id,
        },
      });
    }
  }

  /**
   * Execute multiple independent tasks concurrently
   */
  async executeParallelTasks(
    workflowId: WorkflowId,
    tasks: Task[]
  ): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);
    const runtime = this.ensureRuntime(workflow);
    const now = new Date();
    const previousAgent = workflow.currentAgent;

    // Initialize parallel branches tracking
    if (!runtime.parallelBranches) {
      runtime.parallelBranches = new Map();
    }

    // Start all tasks in parallel
    for (const task of tasks) {
      // Find the actual task in the workflow queue (not the reference from readyTasks)
      const workflowTask = workflow.taskQueue.find((t) => t.id === task.id);
      if (!workflowTask) {
        continue;
      }

      const resolvedAgent = await this.taskRouter.routeTask(workflowId, workflowTask);
      workflowTask.assignedAgent = resolvedAgent;
      workflowTask.status = TaskStatus.ACTIVE;
      workflowTask.startedAt = now;
      runtime.queue.removeTask(workflowTask.id);

      // Track parallel branch
      const branchId = this.generateBranchId();
      runtime.parallelBranches.set(branchId, {
        id: branchId,
        taskId: workflowTask.id,
        agentType: workflowTask.assignedAgent,
        status: "active",
        startedAt: now,
      });

      // Emit branch progress event
      this.eventBus.emit({
        type: "branch_progress",
        workflowId,
        timestamp: now,
        data: {
          workflowId,
          branchId,
          agentType: workflowTask.assignedAgent,
          taskId: workflowTask.id,
          progress: 0,
          status: "active",
          startedAt: now,
        } as BranchProgressMetrics,
      });

      // Emit agent changed event
      this.eventBus.emit({
        type: "agent_changed",
        workflowId,
        timestamp: now,
        data: {
          fromAgent: previousAgent,
          toAgent: workflowTask.assignedAgent,
          taskId: workflowTask.id,
        },
      });
    }

    // Set currentAgent to null for parallel execution
    workflow.currentAgent = null;
    workflow.updatedAt = now;

    await this.saveWorkflow(workflow);
    this.syncTaskRouter(workflow);

    // Emit parallel execution update
    this.trackParallelProgress(workflowId);
  }

  /**
   * Handle completion of a parallel branch
   */
  async handleParallelBranchCompletion(
    workflowId: WorkflowId,
    taskId: TaskId,
    success: boolean,
    error?: Error
  ): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);
    const runtime = this.ensureRuntime(workflow);

    if (!runtime.parallelBranches) {
      return;
    }

    // Find and update the branch
    for (const [branchId, branch] of runtime.parallelBranches.entries()) {
      if (branch.taskId === taskId) {
        branch.status = success ? "completed" : "failed";
        branch.completedAt = new Date();
        if (error) {
          branch.error = error;
        }

        // Emit branch progress event
        this.eventBus.emit({
          type: "branch_progress",
          workflowId,
          timestamp: branch.completedAt,
          data: {
            workflowId,
            branchId,
            agentType: branch.agentType,
            taskId: branch.taskId,
            progress: 100,
            status: branch.status,
            startedAt: branch.startedAt,
            completedAt: branch.completedAt,
          } as BranchProgressMetrics,
        });
        break;
      }
    }

    // Track overall parallel progress
    this.trackParallelProgress(workflowId);

    // Check for convergence
    await this.checkParallelConvergence(workflowId);
  }

  /**
   * Wait for all parallel tasks to complete before proceeding
   */
  async waitForParallelConvergence(workflowId: WorkflowId): Promise<boolean> {
    const workflow = await this.loadWorkflow(workflowId);
    const runtime = this.ensureRuntime(workflow);

    if (!runtime.parallelBranches || runtime.parallelBranches.size === 0) {
      return true;
    }

    // Check if all branches are completed or failed
    const allSettled = Array.from(runtime.parallelBranches.values()).every(
      (branch) => branch.status === "completed" || branch.status === "failed"
    );

    return allSettled;
  }

  /**
   * Track progress across multiple parallel agents
   */
  trackParallelProgress(workflowId: WorkflowId): void {
    const runtime = this.runtime.get(workflowId);
    if (!runtime?.parallelBranches || runtime.parallelBranches.size === 0) {
      return;
    }

    const branches = Array.from(runtime.parallelBranches.values());
    const totalBranches = branches.length;
    const activeBranches = branches.filter(
      (b) => b.status === "active"
    ).length;
    const completedBranches = branches.filter(
      (b) => b.status === "completed"
    ).length;
    const failedBranches = branches.filter(
      (b) => b.status === "failed"
    ).length;

    const overallProgress =
      totalBranches > 0
        ? Math.round((completedBranches / totalBranches) * PERCENT_SCALE)
        : 0;

    // Identify bottlenecks (branches taking longer than average)
    const completedDurations: number[] = [];
    for (const branch of branches) {
      if (branch.status === "completed" && branch.startedAt && branch.completedAt) {
        completedDurations.push(
          branch.completedAt.getTime() - branch.startedAt.getTime()
        );
      }
    }

    const averageTime =
      completedDurations.length > 0
        ? completedDurations.reduce((sum, duration) => sum + duration, 0) /
          completedDurations.length
        : 0;

    const bottleneckAgents = new Set<AgentType>();
    if (averageTime > 0) {
      const now = Date.now();
      for (const branch of branches) {
        if (branch.status !== "active" || !branch.startedAt) {
          continue;
        }
        const elapsed = now - branch.startedAt.getTime();
        if (elapsed > averageTime * BOTTLENECK_THRESHOLD_MULTIPLIER) {
          bottleneckAgents.add(branch.agentType);
        }
      }
    }

    const bottlenecks = bottleneckAgents.size > 0
      ? Array.from(bottleneckAgents)
      : undefined;

    const metrics: ParallelExecutionMetrics = {
      workflowId,
      totalBranches,
      activeBranches,
      completedBranches,
      failedBranches,
      overallProgress,
      bottlenecks,
    };

    this.eventBus.emit({
      type: "parallel_execution_update",
      workflowId,
      timestamp: new Date(),
      data: metrics,
    });
  }

  /**
   * Handle failures in parallel execution gracefully
   */
  async handleParallelFailure(
    workflowId: WorkflowId,
    taskId: TaskId,
    error: Error
  ): Promise<void> {
    await this.handleParallelBranchCompletion(workflowId, taskId, false, error);

    // Tracking is handled by handleParallelBranchCompletion
    // The workflow pause and events are handled by failTask
    // This method just tracks the parallel branch state
  }

  /**
   * Check if parallel tasks have converged and next tasks can proceed
   */
  private async checkParallelConvergence(
    workflowId: WorkflowId
  ): Promise<void> {
    const isConverged = await this.waitForParallelConvergence(workflowId);

    if (isConverged) {
      const workflow = await this.loadWorkflow(workflowId);
      const runtime = this.ensureRuntime(workflow);

      // Clean up parallel branches
      if (runtime.parallelBranches) {
        runtime.parallelBranches.clear();
      }

      // Continue processing workflow
      await this.processWorkflow(workflowId);
    }
  }

  private generateBranchId(): string {
    return `branch_${randomUUID()}`;
  }

  private async completeWorkflow(workflowId: WorkflowId): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);
    if (workflow.status === WorkflowStatus.COMPLETED) {
      return;
    }

    workflow.status = WorkflowStatus.COMPLETED;
    workflow.currentAgent = null;
    workflow.updatedAt = new Date();

    await this.saveWorkflow(workflow);
    this.syncTaskRouter(workflow);

    this.runtime.delete(workflowId);
    this.dependencyGraphs.delete(workflowId);
    this.taskRouter.removeWorkflow(workflowId);

    this.eventBus.emit({
      type: "completed",
      workflowId,
      timestamp: workflow.updatedAt,
      data: { artifactCount: workflow.artifacts.length },
    });
  }

  private async saveWorkflow(workflow: Workflow): Promise<void> {
    await this.persistence.saveWorkflow(workflow);
  }

  private async loadWorkflow(workflowId: WorkflowId): Promise<Workflow> {
    const workflow = await this.persistence.loadWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    this.ensureRuntime(workflow);
    return workflow;
  }

  private ensureRuntime(workflow: Workflow): WorkflowRuntimeState {
    let runtime = this.runtime.get(workflow.id);
    if (!runtime) {
      runtime = { queue: new TaskQueue() };
      this.runtime.set(workflow.id, runtime);
    }

    runtime.queue.clear();
    runtime.queue.clearCompleted();
    for (const task of workflow.taskQueue) {
      runtime.queue.enqueue(task);
    }
    for (const task of workflow.completedTasks) {
      runtime.queue.markCompleted(task.id);
    }

    this.updateDependencyGraph(workflow);
    this.syncTaskRouter(workflow);
    return runtime;
  }

  private updateDependencyGraph(workflow: Workflow): DependencyGraph {
    const graph = buildDependencyGraph([
      ...workflow.taskQueue,
      ...workflow.completedTasks,
    ]);
    this.dependencyGraphs.set(workflow.id, graph);
    return graph;
  }

  private syncTaskRouter(workflow: Workflow): void {
    this.taskRouter.syncWorkflowTasks(workflow.id, [
      ...workflow.taskQueue,
      ...workflow.completedTasks,
    ]);
  }

  private createInitialTasks(
    workflowId: WorkflowId,
    params: CreateWorkflowParams
  ): Task[] {
    const requiredAgents = inferRequiredAgents(
      params.description,
      params.requirements
    );

    const tasks: Task[] = [];
    const projectManagerTask = this.buildTask(
      workflowId,
      AgentType.PROJECT_MANAGER,
      `Analyze and decompose: ${params.description}`,
      []
    );
    tasks.push(projectManagerTask);

    let dependencyRoots: Task[] = [projectManagerTask];

    if (requiredAgents.has(AgentType.DESIGNER)) {
      const designerTask = this.buildTask(
        workflowId,
        AgentType.DESIGNER,
        `Create design specifications for: ${params.description}`,
        dependencyRoots.map((task) => task.id)
      );
      tasks.push(designerTask);
      dependencyRoots = [designerTask];
    }

    const implementationDependencies = dependencyRoots.map((task) => task.id);
    const parallelImplementationTasks: Task[] = [];

    if (requiredAgents.has(AgentType.FRONTEND)) {
      parallelImplementationTasks.push(
        this.buildTask(
          workflowId,
          AgentType.FRONTEND,
          `Implement frontend components for: ${params.description}`,
          implementationDependencies
        )
      );
    }

    if (requiredAgents.has(AgentType.BACKEND)) {
      parallelImplementationTasks.push(
        this.buildTask(
          workflowId,
          AgentType.BACKEND,
          `Implement backend services for: ${params.description}`,
          implementationDependencies
        )
      );
    }

    tasks.push(...parallelImplementationTasks);

    const testerDependencies =
      parallelImplementationTasks.length > 0
        ? parallelImplementationTasks.map((task) => task.id)
        : dependencyRoots.map((task) => task.id);

    const testerTask = this.buildTask(
      workflowId,
      AgentType.TESTER,
      `Test and validate implementation for: ${params.description}`,
      testerDependencies
    );

    tasks.push(testerTask);

    return tasks;
  }

  private buildTask(
    workflowId: WorkflowId,
    agentType: AgentType,
    description: string,
    dependencies: TaskId[]
  ): Task {
    return {
      id: this.generateTaskId(workflowId),
      description,
      assignedAgent: agentType,
      status: TaskStatus.PENDING,
      dependencies,
      createdAt: new Date(),
      timeoutMs: this.defaultTaskTimeoutMs,
    };
  }

  private appendArtifactsFromResult(workflow: Workflow, result: unknown): void {
    if (
      !result ||
      typeof result !== "object" ||
      !("artifacts" in (result as Record<string, unknown>))
    ) {
      return;
    }

    const artifacts = (result as { artifacts?: unknown }).artifacts;
    if (!Array.isArray(artifacts)) {
      return;
    }

    for (const artifact of artifacts) {
      if (typeof artifact === "string") {
        if (
          this.isValidArtifactId(artifact) &&
          !workflow.artifacts.includes(artifact)
        ) {
          workflow.artifacts.push(artifact);
        }
        continue;
      }

      if (artifact && typeof artifact === "object" && "id" in artifact) {
        const id = (artifact as { id?: unknown }).id;
        if (
          typeof id === "string" &&
          this.isValidArtifactId(id) &&
          !workflow.artifacts.includes(id)
        ) {
          workflow.artifacts.push(id);
        }
      }
    }
  }

  private buildHandoffContext(fromTask: Task, toTask: Task): string {
    return `Completed ${fromTask.description}. Handoff to ${toTask.assignedAgent} for ${toTask.description}`;
  }

  private generateWorkflowId(): WorkflowId {
    return randomUUID();
  }

  private generateTaskId(_workflowId: WorkflowId): TaskId {
    return randomUUID();
  }

  private generateId(): string {
    return randomUUID();
  }

  private isValidArtifactId(id: string): boolean {
    return ArtifactIdSchema.safeParse(id).success;
  }
}
