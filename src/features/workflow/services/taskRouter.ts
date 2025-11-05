import { getCapabilityKeywords } from "../config/agentCapabilities";
import {
  AgentType,
  type TaskRouter as ITaskRouter,
  type Task,
  type TaskId,
  TaskStatus,
  type WorkflowId,
} from "../types/workflow.types";
import {
  buildDependencyGraph,
  type DependencyGraph,
  DependencyGraphManager,
  getExecutionLayers,
  getReadyTasks,
} from "./dependencyGraph";

const CAPABILITY_KEYWORDS = getCapabilityKeywords();
const ROUTING_PRIORITY: AgentType[] = [
  AgentType.FRONTEND,
  AgentType.BACKEND,
  AgentType.DESIGNER,
  AgentType.TESTER,
  AgentType.PROJECT_MANAGER,
];
const PARALLEL_DURATION_WEIGHT = 0.7;
const SEQUENTIAL_DURATION_WEIGHT = 0.3;

export type ConcurrentTaskGroup = {
  tasks: Task[];
  canExecuteInParallel: boolean;
  estimatedDuration: number;
};

export type ParallelExecutionResult<T = unknown> = {
  taskId: TaskId;
  success: boolean;
  result?: T;
  error?: Error;
  executionTime: number;
};

export type BatchExecutionPlan = {
  batches: ConcurrentTaskGroup[];
  totalEstimatedDuration: number;
  parallelizationRatio: number;
};

export class TaskRouter implements ITaskRouter {
  private readonly workflowTasks = new Map<WorkflowId, Map<string, Task>>();

  routeTask(workflowId: WorkflowId, task: Task): Promise<AgentType> {
    const agent = this.determineAgentForTask(task);
    task.assignedAgent = agent;
    this.registerTask(workflowId, task);
    return Promise.resolve(agent);
  }

  syncWorkflowTasks(workflowId: WorkflowId, tasks: Task[]): void {
    const taskMap = new Map<string, Task>();
    for (const task of tasks) {
      taskMap.set(task.id, task);
    }
    this.workflowTasks.set(workflowId, taskMap);
  }

  removeWorkflow(workflowId: WorkflowId): void {
    this.workflowTasks.delete(workflowId);
  }

  getNextTasks(workflowId: WorkflowId): Promise<Task[]> {
    const tasks = this.workflowTasks.get(workflowId);
    if (!tasks) {
      return Promise.resolve([]);
    }

    const taskList = Array.from(tasks.values());
    if (taskList.length === 0) {
      return Promise.resolve([]);
    }

    const graph = buildDependencyGraph(taskList);
    const completedIds = new Set(
      taskList
        .filter((task) => task.status === TaskStatus.COMPLETED)
        .map((task) => task.id)
    );

    return Promise.resolve(getReadyTasks(graph, completedIds));
  }

  /**
   * Get concurrent task groups that can execute in parallel
   */
  async getConcurrentTaskGroups(
    workflowId: WorkflowId
  ): Promise<ConcurrentTaskGroup[]> {
    const tasks = this.workflowTasks.get(workflowId);
    if (!tasks) {
      return [];
    }

    const readyTasks = await this.getNextTasks(workflowId);
    if (readyTasks.length === 0) {
      return [];
    }

    const graph = buildDependencyGraph(Array.from(tasks.values()));
    const layers = getExecutionLayers(graph).filter((layer) =>
      layer.some((task) => readyTasks.some((ready) => ready.id === task.id))
    );

    if (layers.length === 0) {
      return [
        {
          tasks: readyTasks,
          canExecuteInParallel: readyTasks.length > 1,
          estimatedDuration: this.estimateGroupDuration(readyTasks),
        },
      ];
    }

    return layers
      .map((layer) => {
        const intersecting = layer.filter((task) =>
          readyTasks.some((ready) => ready.id === task.id)
        );
        return {
          tasks: intersecting,
          canExecuteInParallel: intersecting.length > 1,
          estimatedDuration: this.estimateGroupDuration(intersecting),
        };
      })
      .filter((group) => group.tasks.length > 0);
  }

  /**
   * Get optimal execution plan with parallel groups
   */
  getExecutionPlan(workflowId: WorkflowId): Promise<ConcurrentTaskGroup[]> {
    const tasks = this.workflowTasks.get(workflowId);
    if (!tasks) {
      return Promise.resolve([]);
    }

    const graph = buildDependencyGraph(Array.from(tasks.values()));
    return Promise.resolve(this.buildExecutionPlanFromGraph(graph));
  }

  private buildExecutionPlanFromGraph(
    graph: DependencyGraph
  ): ConcurrentTaskGroup[] {
    const layers = getExecutionLayers(graph);
    return layers.map((layer) => ({
      tasks: layer,
      canExecuteInParallel: layer.length > 1,
      estimatedDuration: this.estimateGroupDuration(layer),
    }));
  }

  /**
   * Check if tasks can execute concurrently
   */
  canExecuteConcurrently(workflowId: WorkflowId, taskIds: string[]): boolean {
    const tasks = this.workflowTasks.get(workflowId);
    if (!tasks) {
      return false;
    }

    const taskList = taskIds
      .map((id) => tasks.get(id))
      .filter(Boolean) as Task[];
    if (taskList.length <= 1) {
      return false;
    }

    // Build dependency graph for these tasks
    try {
      const graph = buildDependencyGraph(taskList);
      const layers = getExecutionLayers(graph);

      // If all tasks are in the same layer, they can execute in parallel
      return layers.length === 1 && layers[0].length === taskList.length;
    } catch {
      // If there's a cycle or other issue, assume they can't execute concurrently
      return false;
    }
  }

  /**
   * Schedule parallel tasks using dependency graph analysis
   * Identifies independent tasks that can execute concurrently
   */
  scheduleParallelTasks(workflowId: WorkflowId): Promise<Task[][]> {
    const tasks = this.workflowTasks.get(workflowId);
    if (!tasks) {
      return Promise.resolve([]);
    }

    const taskList = Array.from(tasks.values());
    if (taskList.length === 0) {
      return Promise.resolve([]);
    }

    const manager = this.buildDependencyGraphManager(taskList);
    const batches = manager.getParallelBatches();

    return Promise.resolve(batches.map((batch) => batch.batch));
  }

  /**
   * Resolve task dependencies using DependencyGraphManager
   * Returns tasks organized by their dependency relationships
   */
  resolveDependencies(workflowId: WorkflowId): {
    independent: Task[];
    dependent: Map<TaskId, TaskId[]>;
  } {
    const tasks = this.workflowTasks.get(workflowId);
    if (!tasks) {
      return { independent: [], dependent: new Map() };
    }

    const taskList = Array.from(tasks.values());
    const manager = this.buildDependencyGraphManager(taskList);

    const independent: Task[] = [];
    const dependent = new Map<TaskId, TaskId[]>();

    for (const task of taskList) {
      const deps = manager.getDependencies(task.id);
      if (deps.length === 0) {
        independent.push(task);
      } else {
        dependent.set(
          task.id,
          deps.map((d) => d.id)
        );
      }
    }

    return { independent, dependent };
  }

  /**
   * Generate comprehensive batch execution plan with metrics
   * Provides parallelization ratio and duration estimates
   */
  getBatchExecutionPlan(workflowId: WorkflowId): Promise<BatchExecutionPlan> {
    const tasks = this.workflowTasks.get(workflowId);
    if (!tasks) {
      return Promise.resolve({
        batches: [],
        totalEstimatedDuration: 0,
        parallelizationRatio: 0,
      });
    }

    const taskList = Array.from(tasks.values());
    if (taskList.length === 0) {
      return Promise.resolve({
        batches: [],
        totalEstimatedDuration: 0,
        parallelizationRatio: 0,
      });
    }

    const manager = this.buildDependencyGraphManager(taskList);
    const parallelBatches = manager.getParallelBatches();

    const batches: ConcurrentTaskGroup[] = parallelBatches.map((pb) => ({
      tasks: pb.batch,
      canExecuteInParallel: pb.batch.length > 1,
      estimatedDuration: this.estimateGroupDuration(pb.batch),
    }));

    const totalEstimatedDuration = batches.reduce(
      (sum, batch) => sum + batch.estimatedDuration,
      0
    );

    const sequentialDuration = taskList.reduce(
      (sum, task) => sum + task.timeoutMs,
      0
    );

    const parallelizationRatio =
      sequentialDuration > 0 ? totalEstimatedDuration / sequentialDuration : 0;

    return Promise.resolve({
      batches,
      totalEstimatedDuration,
      parallelizationRatio,
    });
  }

  /**
   * Determine if specific tasks can execute in parallel
   * Alias for canExecuteConcurrently with more explicit naming
   */
  canExecuteParallel(workflowId: WorkflowId, taskIds: TaskId[]): boolean {
    return this.canExecuteConcurrently(workflowId, taskIds);
  }

  /**
   * Merge results from parallel task execution
   * Aggregates successful and failed results, preserving execution order
   */
  mergeParallelResults<T = unknown>(
    results: ParallelExecutionResult<T>[]
  ): {
    successful: Array<{ taskId: TaskId; result: T }>;
    failed: Array<{ taskId: TaskId; error: Error }>;
    totalExecutionTime: number;
    successRate: number;
  } {
    const successful: Array<{ taskId: TaskId; result: T }> = [];
    const failed: Array<{ taskId: TaskId; error: Error }> = [];
    let totalExecutionTime = 0;

    for (const result of results) {
      totalExecutionTime += result.executionTime;

      if (result.success && result.result !== undefined) {
        successful.push({
          taskId: result.taskId,
          result: result.result,
        });
      } else if (result.error) {
        failed.push({
          taskId: result.taskId,
          error: result.error,
        });
      }
    }

    const successRate =
      results.length > 0 ? successful.length / results.length : 0;

    return {
      successful,
      failed,
      totalExecutionTime,
      successRate,
    };
  }

  private registerTask(workflowId: WorkflowId, task: Task): void {
    const tasks = this.workflowTasks.get(workflowId);
    if (!tasks) {
      this.workflowTasks.set(workflowId, new Map([[task.id, task]]));
      return;
    }

    tasks.set(task.id, task);
  }

  private determineAgentForTask(task: Task): AgentType {
    const description = task.description.toLowerCase();

    const assignedKeywords = CAPABILITY_KEYWORDS[task.assignedAgent];
    const assignedMatch =
      assignedKeywords?.some((keyword) =>
        description.includes(keyword.toLowerCase())
      ) ?? false;
    if (assignedMatch) {
      return task.assignedAgent;
    }

    for (const agent of ROUTING_PRIORITY) {
      if (agent === task.assignedAgent) {
        continue;
      }
      const keywords = CAPABILITY_KEYWORDS[agent];
      if (
        keywords.some((keyword) => description.includes(keyword.toLowerCase()))
      ) {
        return agent;
      }
    }

    return task.assignedAgent ?? AgentType.PROJECT_MANAGER;
  }

  private buildDependencyGraphManager(tasks: Task[]): DependencyGraphManager {
    const manager = new DependencyGraphManager();
    for (const task of tasks) {
      manager.addTask(task);
    }
    return manager;
  }

  private estimateGroupDuration(tasks: Task[]): number {
    if (tasks.length === 0) {
      return 0;
    }
    if (tasks.length === 1) {
      return tasks[0].timeoutMs;
    }

    // For parallel execution, duration is the max of individual durations
    // For sequential, it's the sum
    const maxDuration = Math.max(...tasks.map((task) => task.timeoutMs));
    const totalDuration = tasks.reduce((sum, task) => sum + task.timeoutMs, 0);

    // Estimate as weighted average between parallel and sequential
    return Math.round(
      maxDuration * PARALLEL_DURATION_WEIGHT +
        totalDuration * SEQUENTIAL_DURATION_WEIGHT
    );
  }
}
