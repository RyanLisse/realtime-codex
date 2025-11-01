import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Artifact } from "../shared/types/artifact.types";
import type { TaskList } from "../shared/types/workflow.types";
import { createProjectManagerWorkflowHandlers } from "./projectManager.action";

describe("projectManager actions", () => {
  const taskList: TaskList = {
    title: "Sample Project",
    description: "Build a demo feature",
    tasks: [
      {
        id: "task-1",
        description: "Design the UI",
        dependencies: [],
        priority: "high",
      },
      {
        id: "task-2",
        description: "Implement the frontend",
        dependencies: ["task-1"],
        priority: "high",
      },
    ],
  };

  let createdArtifacts: Artifact[];

  beforeEach(() => {
    createdArtifacts = [];
  });

  const createHandlers = () => {
    const artifactManager = {
      create: vi.fn(async (artifact: Artifact) => {
        createdArtifacts.push(artifact);
        return artifact.id;
      }),
    };

    const { initializeWorkflow, getWorkflowStatus } =
      createProjectManagerWorkflowHandlers({
        artifactManager,
        idGenerator: () => "workflow-123",
        dateFactory: () => new Date("2025-01-01T00:00:00.000Z"),
      });

    return { initializeWorkflow, getWorkflowStatus, artifactManager };
  };

  it("initializes a workflow from a valid task list", async () => {
    const { initializeWorkflow, getWorkflowStatus } = createHandlers();

    const workflowId = await initializeWorkflow(JSON.stringify(taskList));
    const state = await getWorkflowStatus(workflowId);

    expect(workflowId).toBe("workflow-123");
    expect(state.workflowId).toBe("workflow-123");
    expect(state.status).toBe("running");
    expect(state.agents.ProjectManager.state).toBe("active");
    expect(state.agents.ProjectManager.totalTasks).toBe(taskList.tasks.length);
  });

  it("stores the initial task list as an artifact", async () => {
    const { initializeWorkflow, artifactManager } = createHandlers();

    await initializeWorkflow(JSON.stringify(taskList));

    expect(artifactManager.create).toHaveBeenCalledTimes(1);
    expect(createdArtifacts[0].metadata.workflowId).toBe("workflow-123");
    expect(createdArtifacts[0].metadata.type).toBe("requirement");
  });

  it("rejects invalid task lists", async () => {
    const { initializeWorkflow } = createHandlers();

    await expect(initializeWorkflow("not-json")).rejects.toThrowError(
      "Invalid task list input"
    );
  });

  it("throws when a workflow is not found", async () => {
    const { getWorkflowStatus } = createHandlers();

    await expect(getWorkflowStatus("missing")).rejects.toThrowError(
      /Workflow missing not found/
    );
  });

  it("cleans up workflows older than TTL", async () => {
    let currentTime = new Date("2025-01-01T00:00:00.000Z");
    const workflowStore = new Map();

    const artifactManager = {
      create: vi.fn(async (artifact: Artifact) => artifact.id),
    };

    const { initializeWorkflow, getWorkflowStatus } =
      createProjectManagerWorkflowHandlers({
        artifactManager,
        idGenerator: () => "workflow-old",
        dateFactory: () => currentTime,
        workflowStore,
      });

    await initializeWorkflow(JSON.stringify(taskList));
    expect(workflowStore.size).toBe(1);

    currentTime = new Date("2025-01-02T00:00:01.000Z");

    const { initializeWorkflow: initNew } =
      createProjectManagerWorkflowHandlers({
        artifactManager,
        idGenerator: () => "workflow-new",
        dateFactory: () => currentTime,
        workflowStore,
      });

    await initNew(JSON.stringify(taskList));

    expect(workflowStore.size).toBe(1);
    expect(workflowStore.has("workflow-new")).toBe(true);
    expect(workflowStore.has("workflow-old")).toBe(false);
  });

  it("enforces maximum workflow limit", async () => {
    const workflowStore = new Map();
    const artifactManager = {
      create: vi.fn(async (artifact: Artifact) => artifact.id),
    };

    let idCounter = 0;

    for (let i = 0; i < 101; i++) {
      const currentTime = new Date(
        `2025-01-01T00:${String(i).padStart(2, "0")}:00.000Z`
      );
      const { initializeWorkflow } = createProjectManagerWorkflowHandlers({
        artifactManager,
        idGenerator: () => `workflow-${idCounter++}`,
        dateFactory: () => currentTime,
        workflowStore,
      });

      await initializeWorkflow(JSON.stringify(taskList));
    }

    expect(workflowStore.size).toBe(100);
    expect(workflowStore.has("workflow-0")).toBe(false);
    expect(workflowStore.has("workflow-100")).toBe(true);
  });

  it("provides detailed error message for invalid task list", async () => {
    const { initializeWorkflow } = createHandlers();

    await expect(initializeWorkflow("not-json")).rejects.toThrowError(
      /Invalid task list input.*Expected JSON with structure/
    );
  });
});
