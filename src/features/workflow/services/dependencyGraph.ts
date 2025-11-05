import { type Task, type TaskId, TaskStatus } from "../types/workflow.types";

export type DependencyGraphNode = {
  task: Task;
  dependencies: Set<TaskId>;
  dependents: Set<TaskId>;
};

export type DependencyGraph = {
  nodes: Map<TaskId, DependencyGraphNode>;
};

/**
 * Represents a batch of tasks that can be executed in parallel
 */
export type ParallelBatch = {
  batch: Task[];
  batchNumber: number;
};

/**
 * Result of cycle detection in the dependency graph
 */
export type CycleDetectionResult = {
  hasCycle: boolean;
  cycle?: TaskId[];
};

const VISITING = 1;
const VISITED = 2;

/**
 * Build a dependency graph from a set of tasks.
 * Throws when a dependency references an unknown task or when circular
 * dependencies are detected.
 */
export function buildDependencyGraph(tasks: Task[]): DependencyGraph {
  const nodes = new Map<TaskId, DependencyGraphNode>();

  for (const task of tasks) {
    nodes.set(task.id, {
      task,
      dependencies: new Set(task.dependencies),
      dependents: new Set(),
    });
  }

  // Validate that all dependencies exist and populate dependents
  for (const node of Array.from(nodes.values())) {
    for (const dependency of Array.from(node.dependencies)) {
      const dependencyNode = nodes.get(dependency);
      if (!dependencyNode) {
        throw new Error(
          `Task ${node.task.id} depends on unknown task ${dependency}`
        );
      }
      dependencyNode.dependents.add(node.task.id);
    }
  }

  ensureAcyclic(nodes);

  return { nodes };
}

/**
 * Return tasks whose dependencies are satisfied given a set of completed tasks.
 */
export function getReadyTasks(
  graph: DependencyGraph,
  completedTasks: Set<TaskId>
): Task[] {
  const ready: Task[] = [];

  for (const node of Array.from(graph.nodes.values())) {
    if (node.task.status !== TaskStatus.PENDING) {
      continue;
    }

    let allSatisfied = true;
    for (const dependency of Array.from(node.dependencies)) {
      if (!completedTasks.has(dependency)) {
        allSatisfied = false;
        break;
      }
    }

    if (allSatisfied) {
      ready.push(node.task);
    }
  }

  return ready;
}

/**
 * Topologically sort tasks to produce execution groups that can run in parallel.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Topological sort algorithm requires complex state management
export function getExecutionLayers(graph: DependencyGraph): Task[][] {
  const inDegree = new Map<TaskId, number>();
  const layers: Task[][] = [];

  graph.nodes.forEach((node, taskId) => {
    inDegree.set(taskId, node.dependencies.size);
  });

  let currentLayer = Array.from(graph.nodes.values())
    .filter((node) => node.dependencies.size === 0)
    .map((node) => node.task);

  const remaining = new Set(Array.from(graph.nodes.keys()));

  while (currentLayer.length > 0) {
    layers.push(currentLayer);

    const nextLayerCandidates = new Set<TaskId>();
    for (const task of currentLayer) {
      remaining.delete(task.id);
      const dependents = graph.nodes.get(task.id)?.dependents;
      if (dependents) {
        for (const dependentId of Array.from(dependents)) {
          const degree = inDegree.get(dependentId);
          if (degree === undefined) {
            continue;
          }
          const updated = degree - 1;
          inDegree.set(dependentId, updated);
          if (updated === 0) {
            nextLayerCandidates.add(dependentId);
          }
        }
      }
    }

    currentLayer = Array.from(nextLayerCandidates)
      .map((taskId) => graph.nodes.get(taskId)?.task)
      .filter((task): task is Task => Boolean(task));
  }

  if (remaining.size > 0) {
    throw new Error("Dependency graph contains a cycle");
  }

  return layers;
}

function ensureAcyclic(nodes: Map<TaskId, DependencyGraphNode>): void {
  const visited = new Map<TaskId, number>();

  const visit = (taskId: TaskId, path: TaskId[]): void => {
    const state = visited.get(taskId) ?? 0;
    if (state === VISITING) {
      throw new Error(
        `Circular dependency detected: ${[...path, taskId].join(" -> ")}`
      );
    }
    if (state === VISITED) {
      return;
    }

    visited.set(taskId, VISITING);
    const node = nodes.get(taskId);
    if (!node) {
      return;
    }

    for (const dependency of Array.from(node.dependencies)) {
      visit(dependency, [...path, taskId]);
    }
    visited.set(taskId, VISITED);
  };

  for (const [taskId, _node] of Array.from(nodes.entries())) {
    if ((visited.get(taskId) ?? 0) === 0) {
      visit(taskId, []);
    }
  }
}

/**
 * Class-based Dependency Graph for analyzing and managing task dependencies
 * Supports DAG validation, parallel batch identification, and dependency tracking
 */
export class DependencyGraphManager {
  private readonly nodes = new Map<TaskId, DependencyGraphNode>();
  private readonly completedTasks = new Set<TaskId>();

  /**
   * Add a task to the dependency graph
   * @throws Error if task already exists
   */
  addTask(task: Task): void {
    if (this.nodes.has(task.id)) {
      throw new Error(`Task ${task.id} already exists in dependency graph`);
    }

    // Create node
    const node: DependencyGraphNode = {
      task,
      dependencies: new Set(task.dependencies),
      dependents: new Set(),
    };

    this.nodes.set(task.id, node);

    // Update dependents for all dependency tasks
    for (const depId of Array.from(task.dependencies)) {
      const depNode = this.nodes.get(depId);
      if (depNode) {
        depNode.dependents.add(task.id);
      }
    }

    // If task is already completed, mark it
    if (task.status === TaskStatus.COMPLETED) {
      this.completedTasks.add(task.id);
    }
  }

  /**
   * Get all tasks that are ready to execute (all dependencies satisfied)
   * @returns Array of tasks ready for execution
   */
  getExecutableTasks(): Task[] {
    return getReadyTasks({ nodes: this.nodes }, this.completedTasks);
  }

  /**
   * Mark a task as complete and update graph state
   * @throws Error if task doesn't exist
   */
  markTaskComplete(taskId: TaskId): void {
    const node = this.nodes.get(taskId);
    if (!node) {
      throw new Error(`Task ${taskId} not found in dependency graph`);
    }

    this.completedTasks.add(taskId);
    node.task.status = TaskStatus.COMPLETED;
  }

  /**
   * Detect cycles in the dependency graph using DFS
   * @returns CycleDetectionResult with cycle information if found
   */
  detectCycles(): CycleDetectionResult {
    const visited = new Map<TaskId, number>();
    const path: TaskId[] = [];

    const visit = (taskId: TaskId): CycleDetectionResult => {
      const state = visited.get(taskId) ?? 0;
      if (state === VISITING) {
        const cycleStart = path.indexOf(taskId);
        const cycle = [...path.slice(cycleStart), taskId];
        return { hasCycle: true, cycle };
      }
      if (state === VISITED) {
        return { hasCycle: false };
      }

      visited.set(taskId, VISITING);
      path.push(taskId);

      const node = this.nodes.get(taskId);
      if (node) {
        for (const dependency of Array.from(node.dependencies)) {
          const result = visit(dependency);
          if (result.hasCycle) {
            return result;
          }
        }
      }

      path.pop();
      visited.set(taskId, VISITED);
      return { hasCycle: false };
    };

    for (const taskId of Array.from(this.nodes.keys())) {
      if ((visited.get(taskId) ?? 0) === 0) {
        const result = visit(taskId);
        if (result.hasCycle) {
          return result;
        }
      }
    }

    return { hasCycle: false };
  }

  /**
   * Group independent tasks into parallel execution batches
   * Uses topological sorting to maintain dependency order
   * @returns Array of batches, each containing tasks that can run in parallel
   */
  getParallelBatches(): ParallelBatch[] {
    const layers = getExecutionLayers({ nodes: this.nodes });
    return layers.map((batch, index) => ({
      batch,
      batchNumber: index,
    }));
  }

  /**
   * Get all tasks that depend on the specified task
   * @param taskId - The task to find dependents for
   * @returns Array of tasks that depend on this task
   */
  getDependents(taskId: TaskId): Task[] {
    const node = this.nodes.get(taskId);
    if (!node) {
      return [];
    }

    return Array.from(node.dependents)
      .map((id) => this.nodes.get(id)?.task)
      .filter((task): task is Task => task !== undefined);
  }

  /**
   * Get all tasks that this task depends on
   * @param taskId - The task to find dependencies for
   * @returns Array of tasks this task depends on
   */
  getDependencies(taskId: TaskId): Task[] {
    const node = this.nodes.get(taskId);
    if (!node) {
      return [];
    }

    return Array.from(node.dependencies)
      .map((id) => this.nodes.get(id)?.task)
      .filter((task): task is Task => task !== undefined);
  }

  /**
   * Get a task by ID
   */
  getTask(taskId: TaskId): Task | undefined {
    return this.nodes.get(taskId)?.task;
  }

  /**
   * Get all tasks in the graph
   */
  getAllTasks(): Task[] {
    return Array.from(this.nodes.values()).map((node) => node.task);
  }

  /**
   * Check if a task exists in the graph
   */
  hasTask(taskId: TaskId): boolean {
    return this.nodes.has(taskId);
  }

  /**
   * Get the number of tasks in the graph
   */
  size(): number {
    return this.nodes.size;
  }

  /**
   * Remove a task from the graph
   * @throws Error if task has dependents
   */
  removeTask(taskId: TaskId): void {
    const node = this.nodes.get(taskId);
    if (!node) {
      return;
    }

    // Check if any tasks depend on this one
    if (node.dependents.size > 0) {
      const dependentIds = Array.from(node.dependents).join(", ");
      throw new Error(
        `Cannot remove task ${taskId}: tasks [${dependentIds}] depend on it`
      );
    }

    // Remove this task from its dependencies' dependents lists
    for (const depId of Array.from(node.dependencies)) {
      const depNode = this.nodes.get(depId);
      if (depNode) {
        depNode.dependents.delete(taskId);
      }
    }

    this.nodes.delete(taskId);
    this.completedTasks.delete(taskId);
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    this.nodes.clear();
    this.completedTasks.clear();
  }

  /**
   * Get graph statistics for debugging/monitoring
   */
  getStats(): {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    executableTasks: number;
    maxDependencyDepth: number;
  } {
    const executable = this.getExecutableTasks();
    const pending = Array.from(this.nodes.values()).filter(
      (node) => node.task.status === TaskStatus.PENDING
    );

    return {
      totalTasks: this.nodes.size,
      completedTasks: this.completedTasks.size,
      pendingTasks: pending.length,
      executableTasks: executable.length,
      maxDependencyDepth: this.calculateMaxDepth(),
    };
  }

  /**
   * Calculate the maximum dependency depth in the graph
   */
  private calculateMaxDepth(): number {
    const depths = new Map<TaskId, number>();

    const calculateDepth = (taskId: TaskId): number => {
      if (depths.has(taskId)) {
        // biome-ignore lint/style/noNonNullAssertion: We just checked it exists
        return depths.get(taskId)!;
      }

      const node = this.nodes.get(taskId);
      if (!node || node.dependencies.size === 0) {
        depths.set(taskId, 0);
        return 0;
      }

      const depDepths = Array.from(node.dependencies).map((depId) =>
        calculateDepth(depId)
      );
      const maxDepDepth = Math.max(...depDepths, -1);
      const depth = maxDepDepth + 1;
      depths.set(taskId, depth);
      return depth;
    };

    for (const taskId of Array.from(this.nodes.keys())) {
      calculateDepth(taskId);
    }

    return depths.size > 0 ? Math.max(...depths.values()) : 0;
  }

  /**
   * Validate the graph structure
   * @returns Array of validation errors (empty if valid)
   */
  validate(): string[] {
    const errors: string[] = [];

    // Check for cycles
    const cycleResult = this.detectCycles();
    if (cycleResult.hasCycle) {
      errors.push(
        `Cycle detected: ${cycleResult.cycle?.join(" -> ") ?? "unknown"}`
      );
    }

    // Check for missing dependencies
    for (const [taskId, node] of Array.from(this.nodes.entries())) {
      for (const depId of Array.from(node.dependencies)) {
        if (!this.nodes.has(depId)) {
          errors.push(`Task ${taskId} depends on non-existent task ${depId}`);
        }
      }
    }

    return errors;
  }
}
