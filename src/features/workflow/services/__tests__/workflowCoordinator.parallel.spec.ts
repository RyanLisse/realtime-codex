import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AgentType,
  type CreateWorkflowParams,
  type Task,
  TaskStatus,
  type Workflow,
  type WorkflowEvent,
  WorkflowStatus,
} from "../../types/workflow.types";
import { TaskRouter } from "../taskRouter";
import { WorkflowCoordinator } from "../workflowCoordinator";
import { WorkflowEventBus } from "../workflowEventBus";
import { FileWorkflowPersistence } from "../workflowPersistence";

const findPendingTask = (
  workflow: Workflow | null | undefined,
  agent: AgentType
): Task | undefined =>
  workflow?.taskQueue.find((task) => task.assignedAgent === agent);

const findCompletedTask = (
  workflow: Workflow | null | undefined,
  agent: AgentType
): Task | undefined =>
  workflow?.completedTasks.find((task) => task.assignedAgent === agent);

describe("WorkflowCoordinator - Parallel Task Execution", () => {
  let coordinator: WorkflowCoordinator;
  let persistenceDir: string;
  let eventBus: WorkflowEventBus;
  let events: WorkflowEvent[];

  beforeEach(async () => {
    persistenceDir = await mkdtemp(join(tmpdir(), "workflow-parallel-"));
    const persistence = new FileWorkflowPersistence(persistenceDir);
    eventBus = new WorkflowEventBus();
    const taskRouter = new TaskRouter();

    coordinator = new WorkflowCoordinator({
      persistence,
      eventBus,
      taskRouter,
    });

    events = [];
  });

  afterEach(async () => {
    await rm(persistenceDir, { recursive: true, force: true });
  });

  it("executes Frontend + Backend in parallel before Tester", async () => {
    const params: CreateWorkflowParams = {
      description: "Build a full-stack todo application with API and interface",
      requirements: [
        "Create backend API for todos",
        "Implement frontend interface for todos",
        "Test the integrated system",
      ],
    };

    const workflowId = await coordinator.createWorkflow(params);
    eventBus.subscribe(workflowId, (event) => events.push(event));
    await coordinator.resumeWorkflow(workflowId);

    let workflow = await coordinator.getWorkflow(workflowId);
    expect(workflow).not.toBeNull();
    expect(workflow?.status).toBe(WorkflowStatus.IN_PROGRESS);

    const pmTask = findPendingTask(workflow, AgentType.PROJECT_MANAGER);
    expect(pmTask?.status).toBe(TaskStatus.ACTIVE);

    const artifactIds = {
      pm: randomUUID(),
      frontend: randomUUID(),
      backend: randomUUID(),
      tester: randomUUID(),
    };

    await coordinator.completeTask(workflowId, pmTask!.id, {
      artifacts: [{ id: artifactIds.pm, name: "requirements" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);

    const frontendTask = findPendingTask(workflow, AgentType.FRONTEND);
    const backendTask = findPendingTask(workflow, AgentType.BACKEND);
    expect(frontendTask?.status).toBe(TaskStatus.ACTIVE);
    expect(backendTask?.status).toBe(TaskStatus.ACTIVE);

    expect(frontendTask?.dependencies).toEqual([pmTask!.id]);
    expect(backendTask?.dependencies).toEqual([pmTask!.id]);

    const persistedAfterPm = JSON.parse(
      await readFile(join(persistenceDir, `${workflowId}.json`), "utf8")
    );
    const activeTasks = persistedAfterPm.taskQueue.filter(
      (task: { status: string }) => task.status === TaskStatus.ACTIVE
    );
    expect(activeTasks).toHaveLength(2);

    const activeAgents = activeTasks.map(
      (task: { assignedAgent: string }) => task.assignedAgent
    );
    expect(activeAgents).toContain(AgentType.FRONTEND);
    expect(activeAgents).toContain(AgentType.BACKEND);

    const testerTask = findPendingTask(workflow, AgentType.TESTER);
    expect(testerTask?.status).toBe(TaskStatus.PENDING);
    expect(testerTask?.dependencies).toContain(frontendTask!.id);
    expect(testerTask?.dependencies).toContain(backendTask!.id);

    await coordinator.completeTask(workflowId, frontendTask!.id, {
      artifacts: [{ id: artifactIds.frontend, name: "ui-components" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const testerAfterFrontend = findPendingTask(workflow, AgentType.TESTER);
    expect(testerAfterFrontend?.status).toBe(TaskStatus.PENDING);

    await coordinator.completeTask(workflowId, backendTask!.id, {
      artifacts: [{ id: artifactIds.backend, name: "api-endpoints" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const testerAfterBackend = findPendingTask(workflow, AgentType.TESTER);
    expect(testerAfterBackend?.status).toBe(TaskStatus.ACTIVE);

    await coordinator.completeTask(workflowId, testerAfterBackend!.id, {
      artifacts: [{ id: artifactIds.tester, name: "test-report" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    expect(workflow?.status).toBe(WorkflowStatus.COMPLETED);
    expect(workflow?.artifacts.sort()).toEqual(
      [
        artifactIds.pm,
        artifactIds.frontend,
        artifactIds.backend,
        artifactIds.tester,
      ].sort()
    );

    const completedEvents = events.filter(
      (event) => event.type === "task_completed"
    );
    expect(completedEvents).toHaveLength(4);
  });

  it("handles multiple parallel branches with different completion times", async () => {
    const params: CreateWorkflowParams = {
      description: "Multi-platform app with web and mobile frontends",
      requirements: [
        "Build backend API",
        "Implement web frontend",
        "Implement mobile frontend",
        "Test all platforms",
      ],
    };

    const workflowId = await coordinator.createWorkflow(params);
    await coordinator.resumeWorkflow(workflowId);

    let workflow = await coordinator.getWorkflow(workflowId);
    const pmTask = findPendingTask(workflow, AgentType.PROJECT_MANAGER);

    await coordinator.completeTask(workflowId, pmTask!.id, {
      artifacts: [{ id: randomUUID(), name: "project-spec" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const frontendTask = findPendingTask(workflow, AgentType.FRONTEND);
    const backendTask = findPendingTask(workflow, AgentType.BACKEND);

    expect(frontendTask?.status).toBe(TaskStatus.ACTIVE);
    expect(backendTask?.status).toBe(TaskStatus.ACTIVE);

    await coordinator.completeTask(workflowId, backendTask!.id, {
      artifacts: [{ id: randomUUID(), name: "api" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const testerTask = findPendingTask(workflow, AgentType.TESTER);
    expect(testerTask?.status).toBe(TaskStatus.PENDING);

    await coordinator.completeTask(workflowId, frontendTask!.id, {
      artifacts: [{ id: randomUUID(), name: "web-app" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const testerActive = findPendingTask(workflow, AgentType.TESTER);
    expect(testerActive?.status).toBe(TaskStatus.ACTIVE);

    expect(
      workflow?.completedTasks.map((task) => task.assignedAgent).sort()
    ).toEqual(
      [AgentType.PROJECT_MANAGER, AgentType.BACKEND, AgentType.FRONTEND].sort()
    );
  });

  it("continues parallel execution when one branch fails", async () => {
    const params: CreateWorkflowParams = {
      description: "Full-stack app with independent frontend and backend",
      requirements: [
        "Implement backend services",
        "Build frontend application",
        "Run integration tests",
      ],
    };

    const workflowId = await coordinator.createWorkflow(params);
    await coordinator.resumeWorkflow(workflowId);
    eventBus.subscribe(workflowId, (event) => events.push(event));

    let workflow = await coordinator.getWorkflow(workflowId);
    const pmTask = findPendingTask(workflow, AgentType.PROJECT_MANAGER);

    await coordinator.completeTask(workflowId, pmTask!.id, {
      artifacts: [{ id: randomUUID(), name: "requirements" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const frontendTask = findPendingTask(workflow, AgentType.FRONTEND);
    const backendTask = findPendingTask(workflow, AgentType.BACKEND);

    expect(frontendTask?.status).toBe(TaskStatus.ACTIVE);
    expect(backendTask?.status).toBe(TaskStatus.ACTIVE);

    await coordinator.failTask(
      workflowId,
      backendTask!.id,
      new Error("Database connection failed")
    );

    workflow = await coordinator.getWorkflow(workflowId);
    expect(workflow?.status).toBe(WorkflowStatus.PAUSED);

    const failedTask = workflow?.taskQueue.find(
      (task) => task.id === backendTask!.id
    );
    expect(failedTask?.status).toBe(TaskStatus.FAILED);
    expect(failedTask?.result).toBe("Database connection failed");

    const failedEvents = events.filter((event) => event.type === "task_failed");
    expect(failedEvents).toHaveLength(1);
    expect(failedEvents[0].data?.taskId).toBe(backendTask!.id);

    const pausedEvents = events.filter((event) => event.type === "paused");
    expect(pausedEvents).toHaveLength(1);
    expect(pausedEvents[0].data?.reason).toBe("task_failed");
  });

  it("handles dependencies between parallel tasks correctly", async () => {
    const params: CreateWorkflowParams = {
      description: "E-commerce platform with UI, API, and database",
      requirements: [
        "Design UI mockups",
        "Implement frontend",
        "Implement backend API",
        "Run end-to-end tests",
      ],
    };

    const workflowId = await coordinator.createWorkflow(params);
    await coordinator.resumeWorkflow(workflowId);

    let workflow = await coordinator.getWorkflow(workflowId);
    const pmTask = findPendingTask(workflow, AgentType.PROJECT_MANAGER);

    await coordinator.completeTask(workflowId, pmTask!.id, {
      artifacts: [{ id: randomUUID(), name: "spec" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const designerTask = findPendingTask(workflow, AgentType.DESIGNER);
    expect(designerTask?.status).toBe(TaskStatus.ACTIVE);

    await coordinator.completeTask(workflowId, designerTask!.id, {
      artifacts: [{ id: randomUUID(), name: "designs" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const frontendTask = findPendingTask(workflow, AgentType.FRONTEND);
    const backendTask = findPendingTask(workflow, AgentType.BACKEND);
    const testerTask = findPendingTask(workflow, AgentType.TESTER);

    expect(frontendTask?.status).toBe(TaskStatus.ACTIVE);
    expect(backendTask?.status).toBe(TaskStatus.ACTIVE);
    expect(testerTask?.status).toBe(TaskStatus.PENDING);

    expect(frontendTask?.dependencies).toEqual([designerTask!.id]);
    expect(backendTask?.dependencies).toEqual([designerTask!.id]);
    expect(testerTask?.dependencies).toContain(frontendTask!.id);
    expect(testerTask?.dependencies).toContain(backendTask!.id);

    await coordinator.completeTask(workflowId, frontendTask!.id, {
      artifacts: [{ id: randomUUID(), name: "ui" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    expect(findPendingTask(workflow, AgentType.TESTER)?.status).toBe(
      TaskStatus.PENDING
    );

    await coordinator.completeTask(workflowId, backendTask!.id, {
      artifacts: [{ id: randomUUID(), name: "api" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const activeTester = findPendingTask(workflow, AgentType.TESTER);
    expect(activeTester?.status).toBe(TaskStatus.ACTIVE);

    expect(workflow?.completedTasks).toHaveLength(4);
    expect(workflow?.completedTasks.map((t) => t.assignedAgent).sort()).toEqual(
      [
        AgentType.PROJECT_MANAGER,
        AgentType.DESIGNER,
        AgentType.FRONTEND,
        AgentType.BACKEND,
      ].sort()
    );
  });

  it("handles parallel task timeouts independently", async () => {
    const params: CreateWorkflowParams = {
      description: "System with parallel frontend and backend microservices",
      requirements: [
        "Build auth frontend service",
        "Build payment backend service",
        "Test services",
      ],
    };

    const workflowId = await coordinator.createWorkflow(params);
    await coordinator.resumeWorkflow(workflowId);

    let workflow = await coordinator.getWorkflow(workflowId);
    const pmTask = findPendingTask(workflow, AgentType.PROJECT_MANAGER);

    await coordinator.completeTask(workflowId, pmTask!.id, {
      artifacts: [{ id: randomUUID(), name: "microservices-spec" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const frontendTask = findPendingTask(workflow, AgentType.FRONTEND);
    const backendTask = findPendingTask(workflow, AgentType.BACKEND);

    expect(frontendTask?.status).toBe(TaskStatus.ACTIVE);
    expect(backendTask?.status).toBe(TaskStatus.ACTIVE);

    expect(frontendTask?.timeoutMs).toBeGreaterThan(0);
    expect(backendTask?.timeoutMs).toBeGreaterThan(0);
    expect(frontendTask?.startedAt).toBeInstanceOf(Date);
    expect(backendTask?.startedAt).toBeInstanceOf(Date);

    await coordinator.failTask(
      workflowId,
      frontendTask!.id,
      new Error("Task timeout exceeded")
    );

    workflow = await coordinator.getWorkflow(workflowId);
    expect(workflow?.status).toBe(WorkflowStatus.PAUSED);

    const failedFrontend = workflow?.taskQueue.find(
      (task) => task.id === frontendTask!.id
    );
    expect(failedFrontend?.status).toBe(TaskStatus.FAILED);

    const remainingBackend = workflow?.taskQueue.find(
      (task) => task.id === backendTask!.id
    );
    expect(remainingBackend).toBeDefined();

    expect(workflow?.history.at(-1)?.success).toBe(false);
    expect(workflow?.history.at(-1)?.context).toContain("timeout exceeded");
  });

  it("emits correct events during parallel execution", async () => {
    const params: CreateWorkflowParams = {
      description: "Build frontend and backend simultaneously",
      requirements: ["Frontend implementation", "Backend implementation"],
    };

    const workflowId = await coordinator.createWorkflow(params);
    eventBus.subscribe(workflowId, (event) => events.push(event));
    await coordinator.resumeWorkflow(workflowId);

    let workflow = await coordinator.getWorkflow(workflowId);
    const pmTask = findPendingTask(workflow, AgentType.PROJECT_MANAGER);

    await coordinator.completeTask(workflowId, pmTask!.id, {
      artifacts: [{ id: randomUUID(), name: "plan" }],
    });

    const agentChangedEvents = events.filter(
      (event) => event.type === "agent_changed"
    );
    expect(agentChangedEvents.length).toBeGreaterThanOrEqual(2);

    const frontendEvent = agentChangedEvents.find(
      (event) => event.data?.toAgent === AgentType.FRONTEND
    );
    const backendEvent = agentChangedEvents.find(
      (event) => event.data?.toAgent === AgentType.BACKEND
    );

    expect(frontendEvent).toBeDefined();
    expect(backendEvent).toBeDefined();
    expect(frontendEvent?.data?.fromAgent).toBeNull();
    expect(backendEvent?.data?.fromAgent).toBeNull();

    workflow = await coordinator.getWorkflow(workflowId);
    const frontendTask = findPendingTask(workflow, AgentType.FRONTEND);
    const backendTask = findPendingTask(workflow, AgentType.BACKEND);

    await coordinator.completeTask(workflowId, frontendTask!.id, {
      artifacts: [{ id: randomUUID(), name: "frontend" }],
    });
    await coordinator.completeTask(workflowId, backendTask!.id, {
      artifacts: [{ id: randomUUID(), name: "backend" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const testerTask = findPendingTask(workflow, AgentType.TESTER);

    await coordinator.completeTask(workflowId, testerTask!.id, {
      artifacts: [{ id: randomUUID(), name: "tests" }],
    });

    const completedEvents = events.filter(
      (event) => event.type === "task_completed"
    );
    expect(completedEvents).toHaveLength(4);

    const workflowCompleted = events.filter(
      (event) => event.type === "completed"
    );
    expect(workflowCompleted).toHaveLength(1);
  });

  it("persists parallel task state correctly", async () => {
    const params: CreateWorkflowParams = {
      description: "Dual implementation project with frontend and backend API",
      requirements: [
        "Build frontend components",
        "Build backend API",
        "Integrate",
      ],
    };

    const workflowId = await coordinator.createWorkflow(params);
    await coordinator.resumeWorkflow(workflowId);

    let workflow = await coordinator.getWorkflow(workflowId);
    const pmTask = findPendingTask(workflow, AgentType.PROJECT_MANAGER);

    await coordinator.completeTask(workflowId, pmTask!.id, {
      artifacts: [{ id: randomUUID(), name: "requirements" }],
    });

    const persistedData = JSON.parse(
      await readFile(join(persistenceDir, `${workflowId}.json`), "utf8")
    );

    const activeTasks = persistedData.taskQueue.filter(
      (task: { status: string }) => task.status === TaskStatus.ACTIVE
    );
    expect(activeTasks.length).toBeGreaterThanOrEqual(1);

    const activeAgentsSet = new Set(
      activeTasks.map((task: { assignedAgent: string }) => task.assignedAgent)
    );

    if (activeTasks.length === 2) {
      expect(activeAgentsSet.has(AgentType.FRONTEND)).toBe(true);
      expect(activeAgentsSet.has(AgentType.BACKEND)).toBe(true);
    }

    expect(persistedData.completedTasks).toHaveLength(1);
    expect(persistedData.completedTasks[0].assignedAgent).toBe(
      AgentType.PROJECT_MANAGER
    );

    expect(persistedData.currentAgent).toBeNull();

    workflow = await coordinator.getWorkflow(workflowId);
    expect(workflow?.currentAgent).toBeNull();
    const activeInMemory = workflow?.taskQueue.filter(
      (task) => task.status === TaskStatus.ACTIVE
    );
    expect(activeInMemory!.length).toBeGreaterThanOrEqual(1);
  });

  it("creates handoff records for parallel convergence", async () => {
    const params: CreateWorkflowParams = {
      description: "Converging parallel workflows with frontend and backend",
      requirements: [
        "Frontend UI work",
        "Backend API work",
        "Final validation",
      ],
    };

    const workflowId = await coordinator.createWorkflow(params);
    await coordinator.resumeWorkflow(workflowId);

    let workflow = await coordinator.getWorkflow(workflowId);
    const pmTask = findPendingTask(workflow, AgentType.PROJECT_MANAGER);

    await coordinator.completeTask(workflowId, pmTask!.id, {
      artifacts: [{ id: randomUUID(), name: "spec" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const frontendTask = findPendingTask(workflow, AgentType.FRONTEND);
    const backendTask = findPendingTask(workflow, AgentType.BACKEND);

    const artifactIds = {
      frontend: randomUUID(),
      backend: randomUUID(),
    };

    await coordinator.completeTask(workflowId, frontendTask!.id, {
      artifacts: [{ id: artifactIds.frontend, name: "ui" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const historyAfterFrontend = workflow?.history ?? [];
    const frontendHandoffs = historyAfterFrontend.filter(
      (h) => h.fromAgent === AgentType.FRONTEND
    );
    expect(frontendHandoffs.length).toBeGreaterThanOrEqual(0);

    await coordinator.completeTask(workflowId, backendTask!.id, {
      artifacts: [{ id: artifactIds.backend, name: "api" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const historyAfterBackend = workflow?.history ?? [];

    const testerHandoffs = historyAfterBackend.filter(
      (h) => h.toAgent === AgentType.TESTER
    );
    expect(testerHandoffs.length).toBeGreaterThanOrEqual(1);

    const latestHandoff = testerHandoffs[testerHandoffs.length - 1];
    expect(latestHandoff).toBeDefined();
    expect(latestHandoff?.success).toBe(true);
    expect(latestHandoff?.artifacts).toContain(artifactIds.frontend);
    expect(latestHandoff?.artifacts).toContain(artifactIds.backend);
  });
});
