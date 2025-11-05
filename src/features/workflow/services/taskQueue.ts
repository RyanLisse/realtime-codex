import { type Task, type TaskId, TaskStatus } from "../types/workflow.types";

export interface TaskQueueItem {
  task: Task;
  priority: number; // Lower number = higher priority
  enqueuedAt: Date;
}

/**
 * FIFO Task Queue for workflow orchestration
 * Manages task execution order with priority support and dependency resolution
 */
export class TaskQueue {
  private queue: TaskQueueItem[] = [];
  private completedTasks = new Set<TaskId>();

  /**
   * Add a task to the queue
   */
  enqueue(task: Task, priority = 0): void {
    const queueItem: TaskQueueItem = {
      task,
      priority,
      enqueuedAt: new Date(),
    };

    // Insert in priority order (lower priority number = higher priority)
    const insertIndex = this.queue.findIndex(
      (item) => item.priority > priority
    );
    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }
  }

  /**
   * Remove and return the next executable task
   * Considers task dependencies and priority
   */
  dequeue(): Task | null {
    // Find the first task whose dependencies are all satisfied
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      if (
        item.task.status === TaskStatus.PENDING &&
        this.areDependenciesSatisfied(item.task)
      ) {
        this.queue.splice(i, 1);
        return item.task;
      }
    }

    return null; // No tasks ready to execute
  }

  /**
   * Peek at the next task without removing it
   */
  peek(): Task | null {
    for (const item of this.queue) {
      if (
        item.task.status === TaskStatus.PENDING &&
        this.areDependenciesSatisfied(item.task)
      ) {
        return item.task;
      }
    }
    return null;
  }

  /**
   * Get all tasks that are ready to execute (dependencies satisfied)
   */
  getReadyTasks(): Task[] {
    return this.queue
      .filter(
        (item) =>
          item.task.status === TaskStatus.PENDING &&
          this.areDependenciesSatisfied(item.task)
      )
      .map((item) => item.task);
  }

  /**
   * Get all tasks in the queue (including those with unsatisfied dependencies)
   */
  getAllTasks(): Task[] {
    return this.queue.map((item) => item.task);
  }

  /**
   * Check if the queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get the number of tasks in the queue
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Remove and return all tasks that are ready for execution.
   * Useful when scheduling parallel branches.
   */
  dequeueReadyTasks(limit?: number): Task[] {
    const ready: Task[] = [];
    let collected = 0;

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      if (
        item.task.status !== TaskStatus.PENDING ||
        !this.areDependenciesSatisfied(item.task)
      ) {
        continue;
      }

      ready.push(item.task);
      this.queue.splice(i, 1);
      i -= 1; // Adjust index after removal

      collected += 1;
      if (limit !== undefined && collected >= limit) {
        break;
      }
    }

    return ready;
  }

  /**
   * Mark a task as completed (for dependency resolution)
   */
  markCompleted(taskId: TaskId): void {
    this.completedTasks.add(taskId);
  }

  /**
   * Clear completed task tracking (useful for workflow resets)
   */
  clearCompleted(): void {
    this.completedTasks.clear();
  }

  /**
   * Check if a task's dependencies are satisfied
   */
  private areDependenciesSatisfied(task: Task): boolean {
    return task.dependencies.every((depId) => this.completedTasks.has(depId));
  }

  /**
   * Remove a specific task from the queue (useful for cancellation)
   */
  removeTask(taskId: TaskId): boolean {
    const index = this.queue.findIndex((item) => item.task.id === taskId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Clear all tasks from the queue
   */
  clear(): void {
    this.queue = [];
  }
}
