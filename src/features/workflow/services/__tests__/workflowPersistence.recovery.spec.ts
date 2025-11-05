import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AgentType,
  type CreateWorkflowParams,
  TaskStatus,
  type Workflow,
  WorkflowStatus,
} from "../../types/workflow.types";
import { TaskRouter } from "../taskRouter";
import { WorkflowCoordinator } from "../workflowCoordinator";
import { WorkflowEventBus } from "../workflowEventBus";
import { FileWorkflowPersistence } from "../workflowPersistence";

const findPendingTask = (workflow: Workflow | null, agent: AgentType) =>
  workflow?.taskQueue.find((task) => task.assignedAgent === agent);

const findCompletedTask = (workflow: Workflow | null, agent: AgentType) =>
  workflow?.completedTasks.find((task) => task.assignedAgent === agent);

describe("Workflow persistence and recovery", () => {
  let persistenceDir: string;
  let params: CreateWorkflowParams;

  beforeEach(async () => {
    persistenceDir = await mkdtemp(join(tmpdir(), "workflow-rec-"));
    params = {
      description: "Implement shared service with frontend + backend",
      requirements: [
        "Expose backend API for data",
        "Render frontend dashboard",
      ],
    };
  });

  afterEach(async () => {
    await rm(persistenceDir, { recursive: true, force: true });
  });

  it("recovers paused workflow and resumes failed task", async () => {
    const persistence = new FileWorkflowPersistence(persistenceDir);
    const coordinator = new WorkflowCoordinator({
      persistence,
      eventBus: new WorkflowEventBus(),
      taskRouter: new TaskRouter(),
    });

    const workflowId = await coordinator.createWorkflow(params);
    await coordinator.resumeWorkflow(workflowId);

    let workflow = await coordinator.getWorkflow(workflowId);
    const projectManagerTask = findPendingTask(
      workflow,
      AgentType.PROJECT_MANAGER
    );
    const pmArtifact = randomUUID();
    await coordinator.completeTask(workflowId, projectManagerTask!.id, {
      artifacts: [{ id: pmArtifact }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const frontendTask = findPendingTask(workflow, AgentType.FRONTEND);
    const backendTask = findPendingTask(workflow, AgentType.BACKEND);
    expect(frontendTask?.status).toBe(TaskStatus.ACTIVE);
    expect(backendTask?.status).toBe(TaskStatus.ACTIVE);

    const frontendArtifact = randomUUID();
    await coordinator.completeTask(workflowId, frontendTask!.id, {
      artifacts: [{ id: frontendArtifact }],
    });

    await coordinator.failTask(
      workflowId,
      backendTask!.id,
      new Error("API outage")
    );

    workflow = await coordinator.getWorkflow(workflowId);
    expect(workflow?.status).toBe(WorkflowStatus.PAUSED);
    const failedBackendTask = findPendingTask(workflow, AgentType.BACKEND);
    expect(failedBackendTask?.status).toBe(TaskStatus.FAILED);
    expect(workflow?.history.at(-1)?.success).toBe(false);

    // Simulate process restart with fresh coordinator instance
    const resumedCoordinator = new WorkflowCoordinator({
      persistence: new FileWorkflowPersistence(persistenceDir),
      eventBus: new WorkflowEventBus(),
      taskRouter: new TaskRouter(),
    });

    let resumedWorkflow = await resumedCoordinator.getWorkflow(workflowId);
    expect(resumedWorkflow?.status).toBe(WorkflowStatus.PAUSED);

    await resumedCoordinator.resumeWorkflow(workflowId);

    resumedWorkflow = await resumedCoordinator.getWorkflow(workflowId);
    const backendToRetry = findPendingTask(resumedWorkflow, AgentType.BACKEND);
    expect(backendToRetry?.status).toBe(TaskStatus.ACTIVE);

    const backendArtifact = randomUUID();
    await resumedCoordinator.completeTask(workflowId, backendToRetry!.id, {
      artifacts: [{ id: backendArtifact }],
    });

    resumedWorkflow = await resumedCoordinator.getWorkflow(workflowId);
    const testerTask = findPendingTask(resumedWorkflow, AgentType.TESTER);
    expect(testerTask?.status).toBe(TaskStatus.ACTIVE);

    const testerArtifact = randomUUID();
    await resumedCoordinator.completeTask(workflowId, testerTask!.id, {
      artifacts: [{ id: testerArtifact }],
    });

    resumedWorkflow = await resumedCoordinator.getWorkflow(workflowId);
    expect(resumedWorkflow?.status).toBe(WorkflowStatus.COMPLETED);
    expect(
      resumedWorkflow?.completedTasks.map((task) => task.assignedAgent)
    ).toEqual(
      expect.arrayContaining([
        AgentType.PROJECT_MANAGER,
        AgentType.FRONTEND,
        AgentType.BACKEND,
        AgentType.TESTER,
      ])
    );
    expect(findCompletedTask(resumedWorkflow, AgentType.BACKEND)?.status).toBe(
      TaskStatus.COMPLETED
    );
    expect(resumedWorkflow?.artifacts.sort()).toEqual(
      [pmArtifact, frontendArtifact, backendArtifact, testerArtifact].sort()
    );
  });
});
