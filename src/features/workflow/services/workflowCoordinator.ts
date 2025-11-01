import {
  WorkflowCoordinator as IWorkflowCoordinator,
  CreateWorkflowParams,
  WorkflowId,
  Workflow,
  WorkflowStatus,
  TaskRouter,
  WorkflowPersistence,
  WorkflowEventBus,
  Task,
  AgentType,
  TaskStatus,
  HandoffRecord,
  WorkflowEvent,
  WorkflowEventType
} from '../types/workflow.types';
import { TaskQueue } from './taskQueue';

export interface WorkflowCoordinatorDependencies {
  persistence: WorkflowPersistence;
  eventBus: WorkflowEventBus;
  taskRouter: TaskRouter;
  agentOrder?: AgentType[];
}

export class WorkflowCoordinator implements IWorkflowCoordinator {
  private readonly persistence: WorkflowPersistence;
  private readonly eventBus: WorkflowEventBus;
  private readonly taskRouter: TaskRouter;
  private readonly agentOrder: AgentType[];
  private readonly taskQueues = new Map<WorkflowId, TaskQueue>();

  constructor(dependencies: WorkflowCoordinatorDependencies) {
    this.persistence = dependencies.persistence;
    this.eventBus = dependencies.eventBus;
    this.taskRouter = dependencies.taskRouter;
    this.agentOrder = dependencies.agentOrder || [
      AgentType.PROJECT_MANAGER,
      AgentType.DESIGNER,
      AgentType.FRONTEND,
      AgentType.BACKEND,
      AgentType.TESTER,
    ];
  }

  async createWorkflow(params: CreateWorkflowParams): Promise<WorkflowId> {
    const workflowId = this.generateWorkflowId();

    // Create initial sequential tasks based on agent order
    const tasks = this.createSequentialTasks(workflowId, params);

    // Initialize workflow
    const workflow: Workflow = {
      id: workflowId,
      description: params.description,
      status: WorkflowStatus.IN_PROGRESS,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentAgent: AgentType.PROJECT_MANAGER, // Start with ProjectManager
      taskQueue: tasks,
      completedTasks: [],
      artifacts: [],
      history: []
    };

    // Initialize task queue for this workflow
    const taskQueue = new TaskQueue();
    tasks.forEach(task => taskQueue.enqueue(task));
    this.taskQueues.set(workflowId, taskQueue);

    // Save workflow
    await this.saveWorkflow(workflow);

    // Emit workflow created event
    this.eventBus.emit({
      type: WorkflowEventType.CREATED,
      workflowId,
      timestamp: new Date(),
      data: { description: params.description }
    });

    return workflowId;
  }

  async getWorkflow(id: WorkflowId): Promise<Workflow | null> {
    return this.persistence.loadWorkflow(id);
  }

  async pauseWorkflow(id: WorkflowId): Promise<void> {
    // TODO: Load workflow
    // TODO: Update status to paused
    // TODO: Save to persistence
    // TODO: Emit paused event
    throw new Error("WorkflowCoordinator.pauseWorkflow not implemented");
  }

  async resumeWorkflow(id: WorkflowId): Promise<void> {
    // TODO: Load workflow
    // TODO: Update status to in_progress
    // TODO: Save to persistence
    // TODO: Emit resumed event
    // TODO: Continue processing next task
    throw new Error("WorkflowCoordinator.resumeWorkflow not implemented");
  }

  async cancelWorkflow(id: WorkflowId): Promise<void> {
    // TODO: Load workflow
    // TODO: Update status to failed
    // TODO: Save to persistence
    // TODO: Emit failed event
    // TODO: Cleanup any running tasks
    throw new Error("WorkflowCoordinator.cancelWorkflow not implemented");
  }

  // Internal workflow processing methods
  private async processWorkflow(workflowId: WorkflowId): Promise<void> {
    const taskQueue = this.taskQueues.get(workflowId);
    if (!taskQueue) return;

    const nextTask = taskQueue.dequeue();
    if (!nextTask) {
      // No more tasks - workflow is complete
      await this.completeWorkflow(workflowId);
      return;
    }

    // Update workflow with current agent
    const workflow = await this.loadWorkflow(workflowId);
    workflow.currentAgent = nextTask.assignedAgent;
    workflow.updatedAt = new Date();
    await this.saveWorkflow(workflow);

    // Emit agent changed event
    this.eventBus.emit({
      type: WorkflowEventType.AGENT_CHANGED,
      workflowId,
      timestamp: new Date(),
      data: { fromAgent: null, toAgent: nextTask.assignedAgent }
    });
  }

  async completeTask(workflowId: WorkflowId, taskId: string, result: unknown): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);
    const taskQueue = this.taskQueues.get(workflowId);

    if (!workflow || !taskQueue) return;

    // Find and update the task
    const taskIndex = workflow.taskQueue.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = workflow.taskQueue[taskIndex];
    task.status = TaskStatus.COMPLETED;
    task.result = result;
    task.completedAt = new Date();

    // Move task to completed list
    workflow.completedTasks.push(task);
    workflow.taskQueue.splice(taskIndex, 1);
    workflow.updatedAt = new Date();

    // Mark task as completed in queue for dependency resolution
    taskQueue.markCompleted(taskId);

    // Create handoff record if this isn't the last task
    const nextTask = taskQueue.peek();
    if (nextTask) {
      const handoff: HandoffRecord = {
        id: this.generateId(),
        workflowId,
        fromAgent: task.assignedAgent,
        toAgent: nextTask.assignedAgent,
        context: `Completed ${task.description}. Passing to ${nextTask.assignedAgent} for ${nextTask.description}`,
        artifacts: workflow.artifacts,
        timestamp: new Date(),
        success: true
      };
      workflow.history.push(handoff);
    }

    await this.saveWorkflow(workflow);

    // Emit task completed event
    this.eventBus.emit({
      type: WorkflowEventType.TASK_COMPLETED,
      workflowId,
      timestamp: new Date(),
      data: { taskId, agentType: task.assignedAgent }
    });

    // Continue processing workflow
    await this.processWorkflow(workflowId);
  }

  async failTask(workflowId: WorkflowId, taskId: string, error: Error): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);

    if (!workflow) return;

    // Find the task
    const task = workflow.taskQueue.find(t => t.id === taskId);
    if (!task) return;

    task.status = TaskStatus.FAILED;
    task.result = error.message;
    workflow.status = WorkflowStatus.FAILED;
    workflow.updatedAt = new Date();

    await this.saveWorkflow(workflow);

    // Emit task failed event
    this.eventBus.emit({
      type: WorkflowEventType.TASK_FAILED,
      workflowId,
      timestamp: new Date(),
      data: { taskId, agentType: task.assignedAgent, error: error.message }
    });
  }

  // Helper methods
  private generateWorkflowId(): WorkflowId {
    // Simple ID generation - could be replaced with proper UUID
    return "workflow-" + Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
  }

  private generateId(): string {
    return "record-" + Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
  }

  private createSequentialTasks(workflowId: WorkflowId, params: CreateWorkflowParams): Task[] {
    const tasks: Task[] = [];

    // Create sequential tasks for each agent in order
    this.agentOrder.forEach((agentType, index) => {
      const task: Task = {
        id: `${workflowId}-task-${index + 1}`,
        description: this.generateTaskDescription(agentType, params),
        assignedAgent: agentType,
        status: TaskStatus.PENDING,
        dependencies: index > 0 ? [`${workflowId}-task-${index}`] : [], // Depend on previous task
        createdAt: new Date(),
        timeoutMs: 300000 // 5 minutes default
      };
      tasks.push(task);
    });

    return tasks;
  }

  private generateTaskDescription(agentType: AgentType, params: CreateWorkflowParams): string {
    const baseDescription = params.description;
    const requirements = params.requirements?.join(", ") || "";

    switch (agentType) {
      case AgentType.PROJECT_MANAGER:
        return `Analyze and decompose: ${baseDescription}. Requirements: ${requirements}`;
      case AgentType.DESIGNER:
        return `Create UI/UX design specifications for: ${baseDescription}`;
      case AgentType.FRONTEND:
        return `Implement frontend components and UI for: ${baseDescription}`;
      case AgentType.BACKEND:
        return `Implement backend services and APIs for: ${baseDescription}`;
      case AgentType.TESTER:
        return `Test and validate the complete implementation of: ${baseDescription}`;
      default:
        return `Process task for ${agentType}: ${baseDescription}`;
    }
  }

  private async completeWorkflow(workflowId: WorkflowId): Promise<void> {
    const workflow = await this.loadWorkflow(workflowId);
    if (!workflow) return;

    workflow.status = WorkflowStatus.COMPLETED;
    workflow.currentAgent = null;
    workflow.updatedAt = new Date();

    await this.saveWorkflow(workflow);

    // Clean up task queue
    this.taskQueues.delete(workflowId);

    // Emit workflow completed event
    this.eventBus.emit({
      type: WorkflowEventType.COMPLETED,
      workflowId,
      timestamp: new Date(),
      data: { artifactCount: workflow.artifacts.length }
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
    return workflow;
  }
}
