import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AgentType,
  type CreateWorkflowParams,
  TaskStatus,
  type WorkflowEvent,
  WorkflowStatus,
} from "../../types/workflow.types";
import { TaskRouter } from "../taskRouter";
import { WorkflowCoordinator } from "../workflowCoordinator";
import { WorkflowEventBus } from "../workflowEventBus";
import { FileWorkflowPersistence } from "../workflowPersistence";

describe("WorkflowCoordinator - Sequential Agent Handoff", () => {
  let coordinator: WorkflowCoordinator;
  let persistenceDir: string;
  let eventBus: WorkflowEventBus;
  let events: WorkflowEvent[];

  beforeEach(async () => {
    persistenceDir = await mkdtemp(join(tmpdir(), "workflow-seq-"));
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

  it("executes sequential handoffs and aggregates artifacts", async () => {
    const params: CreateWorkflowParams = {
      description: "Build a login form with design and frontend implementation",
      requirements: [
        "Create UI design for login form",
        "Implement responsive login form component",
        "Add form validation and error handling",
      ],
    };

    const workflowId = await coordinator.createWorkflow(params);
    await coordinator.resumeWorkflow(workflowId);
    eventBus.subscribe(workflowId, (event) => events.push(event));

    let workflow = await coordinator.getWorkflow(workflowId);
    expect(workflow).not.toBeNull();
    expect(workflow?.status).toBe(WorkflowStatus.IN_PROGRESS);
    const initialAssignment = workflow!.taskQueue.map((task) => [
      task.assignedAgent,
      task.description,
    ]);
    expect(initialAssignment).toEqual([
      [
        AgentType.PROJECT_MANAGER,
        expect.stringContaining("Analyze and decompose"),
      ],
      [AgentType.DESIGNER, expect.stringContaining("Create design")],
      [AgentType.FRONTEND, expect.stringContaining("Implement frontend")],
      [AgentType.TESTER, expect.stringContaining("Test and validate")],
    ]);
    expect(
      workflow?.taskQueue.map((task) => ({
        description: task.description,
        agent: task.assignedAgent,
      }))
    ).toMatchInlineSnapshot(`
      [
        {
          "agent": "ProjectManager",
          "description": "Analyze and decompose: Build a login form with design and frontend implementation",
        },
        {
          "agent": "Designer",
          "description": "Create design specifications for: Build a login form with design and frontend implementation",
        },
        {
          "agent": "Frontend",
          "description": "Implement frontend components for: Build a login form with design and frontend implementation",
        },
        {
          "agent": "Tester",
          "description": "Test and validate implementation for: Build a login form with design and frontend implementation",
        },
      ]
    `);

    const getTask = (agent: AgentType) =>
      workflow?.taskQueue.find((task) => task.assignedAgent === agent);

    const projectManagerTask = getTask(AgentType.PROJECT_MANAGER);
    const projectManagerId = projectManagerTask?.id;
    expect(projectManagerId).toBeDefined();
    expect(projectManagerTask?.status).toBe(TaskStatus.ACTIVE);

    const artifactIds = {
      pm: randomUUID(),
      designer: randomUUID(),
      frontend: randomUUID(),
      tester: randomUUID(),
    };

    await coordinator.completeTask(workflowId, projectManagerTask!.id, {
      artifacts: [{ id: artifactIds.pm, name: "requirements" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    expect(
      workflow?.completedTasks.map((task) => task.assignedAgent)
    ).toContain(AgentType.PROJECT_MANAGER);
    expect(
      workflow?.completedTasks.map((task) => ({
        agent: task.assignedAgent,
        id: task.id,
      }))
    ).toEqual(
      expect.arrayContaining([
        { agent: AgentType.PROJECT_MANAGER, id: projectManagerId },
      ])
    );
    expect(workflow?.taskQueue.map((task) => task.assignedAgent)).toContain(
      AgentType.DESIGNER
    );

    const persistedAfterPm = JSON.parse(
      await readFile(join(persistenceDir, `${workflowId}.json`), "utf8")
    );
    const persistedDesigner = persistedAfterPm.taskQueue.find(
      (task: { assignedAgent: string }) =>
        task.assignedAgent === AgentType.DESIGNER
    );

    expect(persistedAfterPm.taskQueue.length).toBeGreaterThan(0);
    expect(persistedDesigner?.status).toBe(TaskStatus.ACTIVE);

    expect(
      persistedAfterPm.completedTasks.map(
        (task: { assignedAgent: string; id: string; status: string }) => ({
          agent: task.assignedAgent,
          id: task.id,
          status: task.status,
        })
      )
    ).toEqual(
      expect.arrayContaining([
        {
          agent: AgentType.PROJECT_MANAGER,
          id: projectManagerId,
          status: TaskStatus.COMPLETED,
        },
      ])
    );
    expect(persistedDesigner?.dependencies).toEqual([projectManagerId]);

    expect(
      persistedAfterPm.taskQueue
        .map((task: { assignedAgent: string }) => task.assignedAgent)
        .sort()
    ).toEqual(
      [AgentType.DESIGNER, AgentType.FRONTEND, AgentType.TESTER].sort()
    );

    expect(
      workflow!.taskQueue.map((task) => task.assignedAgent).sort()
    ).toEqual(
      [AgentType.DESIGNER, AgentType.FRONTEND, AgentType.TESTER].sort()
    );

    const designerTask = getTask(AgentType.DESIGNER);
    expect(designerTask?.status).toBe(TaskStatus.ACTIVE);
    expect(designerTask?.dependencies).toEqual([projectManagerId]);

    await coordinator.completeTask(workflowId, designerTask!.id, {
      artifacts: [{ id: artifactIds.designer, name: "ui-spec" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const frontendTask = getTask(AgentType.FRONTEND);
    expect(frontendTask?.status).toBe(TaskStatus.ACTIVE);

    await coordinator.completeTask(workflowId, frontendTask!.id, {
      artifacts: [{ id: artifactIds.frontend, name: "login-form" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    const testerTask = getTask(AgentType.TESTER);
    expect(testerTask?.status).toBe(TaskStatus.ACTIVE);

    await coordinator.completeTask(workflowId, testerTask!.id, {
      artifacts: [{ id: artifactIds.tester, name: "test-report" }],
    });

    workflow = await coordinator.getWorkflow(workflowId);
    expect(workflow?.status).toBe(WorkflowStatus.COMPLETED);
    expect(workflow?.completedTasks).toHaveLength(4);
    expect(workflow?.artifacts.sort()).toEqual(
      [
        artifactIds.pm,
        artifactIds.designer,
        artifactIds.frontend,
        artifactIds.tester,
      ].sort()
    );

    expect(workflow?.history).toHaveLength(3);
    const finalArtifacts = workflow?.artifacts ?? [];
    workflow?.history.forEach((record) => {
      expect(record.success).toBe(true);
      record.artifacts.forEach((artifact) => {
        expect(finalArtifacts).toContain(artifact);
      });
    });

    const eventTypes = events.map((event) => event.type);
    expect(eventTypes).toContain("task_completed");
    expect(eventTypes.at(-1)).toBe("completed");
  });
});
