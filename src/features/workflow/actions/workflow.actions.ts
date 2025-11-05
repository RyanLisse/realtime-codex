"use server";

import { TaskRouter } from "../services/taskRouter";
import { WorkflowCoordinator } from "../services/workflowCoordinator";
import { WorkflowEventBus } from "../services/workflowEventBus";
import { FileWorkflowPersistence } from "../services/workflowPersistence";
import type { CreateWorkflowParams, WorkflowId } from "../types/workflow.types";

// Singleton coordinator instance
let coordinator: WorkflowCoordinator | null = null;

function getCoordinator(): WorkflowCoordinator {
  if (!coordinator) {
    const persistence = new FileWorkflowPersistence("./workflows");
    const eventBus = new WorkflowEventBus();
    const taskRouter = new TaskRouter();

    coordinator = new WorkflowCoordinator({
      persistence,
      eventBus,
      taskRouter,
    });
  }
  return coordinator;
}

// Server actions
export async function createWorkflow(
  params: CreateWorkflowParams
): Promise<WorkflowId> {
  const coord = getCoordinator();
  return coord.createWorkflow(params);
}

export async function pauseWorkflow(workflowId: WorkflowId): Promise<void> {
  const coord = getCoordinator();
  return coord.pauseWorkflow(workflowId);
}

export async function resumeWorkflow(workflowId: WorkflowId): Promise<void> {
  const coord = getCoordinator();
  return coord.resumeWorkflow(workflowId);
}

export async function cancelWorkflow(workflowId: WorkflowId): Promise<void> {
  const coord = getCoordinator();
  return coord.cancelWorkflow(workflowId);
}

export async function getWorkflow(workflowId: WorkflowId) {
  const coord = getCoordinator();
  return coord.getWorkflow(workflowId);
}

export async function completeTask(
  workflowId: WorkflowId,
  taskId: string,
  result: unknown
): Promise<void> {
  const coord = getCoordinator();
  return coord.completeTask(workflowId, taskId, result);
}

export async function failTask(
  workflowId: WorkflowId,
  taskId: string,
  error: Error
): Promise<void> {
  const coord = getCoordinator();
  return coord.failTask(workflowId, taskId, error);
}

export async function startWorkflow(workflowId: WorkflowId): Promise<void> {
  const coord = getCoordinator();
  await coord.resumeWorkflow(workflowId);
}
