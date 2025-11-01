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
        dateFactory: () => new Date("2024-01-01T00:00:00.000Z"),
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
      "Workflow missing not found"
    );
  });
});
