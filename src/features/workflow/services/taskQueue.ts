import { Task, TaskId } from '../types/workflow.types';

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
  enqueue(task: Task, priority: number = 0): void {
    const queueItem: TaskQueueItem = {
      task,
      priority,
      enqueuedAt: new Date()
    };

    // Insert in priority order (lower priority number = higher priority)
    const insertIndex = this.queue.findIndex(item => item.priority > priority);
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
      if (this.areDependenciesSatisfied(item.task)) {
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
      if (this.areDependenciesSatisfied(item.task)) {
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
      .filter(item => this.areDependenciesSatisfied(item.task))
      .map(item => item.task);
  }

  /**
   * Get all tasks in the queue (including those with unsatisfied dependencies)
   */
  getAllTasks(): Task[] {
    return this.queue.map(item => item.task);
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
  size(): boolean {
    return this.queue.length;
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
    return task.dependencies.every(depId => this.completedTasks.has(depId));
  }

  /**
   * Remove a specific task from the queue (useful for cancellation)
   */
  removeTask(taskId: TaskId): boolean {
    const index = this.queue.findIndex(item => item.task.id === taskId);
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
