"use server";

import { nanoid } from "nanoid";
import { ArtifactManager } from "@/features/shared/services/artifactManager";
import type { Artifact } from "@/features/shared/types/artifact.types";
import {
  type AgentStatus,
  type AgentType,
  type TaskList,
  TaskListSchema,
  type WorkflowId,
  type WorkflowState,
} from "@/features/shared/types/workflow.types";

export type ArtifactManagerLike = Pick<ArtifactManager, "create">;

export type WorkflowHandlersDependencies = {
  artifactManager?: ArtifactManagerLike;
  idGenerator?: () => WorkflowId;
  dateFactory?: () => Date;
  workflowStore?: Map<WorkflowId, WorkflowState>;
};

const defaultWorkflowStore = new Map<WorkflowId, WorkflowState>();

const agentOrder: AgentType[] = [
  "ProjectManager",
  "Designer",
  "FrontendDeveloper",
  "BackendDeveloper",
  "Tester",
];

export function createProjectManagerWorkflowHandlers(
  dependencies: WorkflowHandlersDependencies = {}
) {
  const artifactManager = dependencies.artifactManager ?? new ArtifactManager();
  const idGenerator = dependencies.idGenerator ?? (() => nanoid());
  const dateFactory = dependencies.dateFactory ?? (() => new Date());
  const workflowStore = dependencies.workflowStore ?? defaultWorkflowStore;

  const initializeWorkflow = async (
    taskListInput: string
  ): Promise<WorkflowId> => {
    const taskList = parseTaskList(taskListInput);
    const workflowId = idGenerator();
    const now = dateFactory();

    const agentStatuses = createInitialAgentStatuses(taskList, now);

    const state: WorkflowState = {
      workflowId,
      status: "running",
      currentPhase: "planning",
      agents: agentStatuses,
      createdAt: now,
      updatedAt: now,
      startedAt: now,
    };

    workflowStore.set(workflowId, state);

    await artifactManager.create(
      createInitialRequirementArtifact(taskList, workflowId, now)
    );

    return workflowId;
  };

  const getWorkflowStatus = async (
    workflowId: WorkflowId
  ): Promise<WorkflowState> => {
    const state = workflowStore.get(workflowId);
    if (!state) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    return state;
  };

  return { initializeWorkflow, getWorkflowStatus };
}

function parseTaskList(input: string): TaskList {
  try {
    const parsed = JSON.parse(input);
    return TaskListSchema.parse(parsed);
  } catch (error) {
    throw new Error("Invalid task list input");
  }
}

function createInitialAgentStatuses(
  taskList: TaskList,
  now: Date
): Record<AgentType, AgentStatus> {
  const totalTasks = taskList.tasks.length;

  return agentOrder.reduce<Record<AgentType, AgentStatus>>(
    (acc, agentType) => {
      const baseStatus: AgentStatus = {
        agentType,
        state: agentType === "ProjectManager" ? "active" : "idle",
        progress: 0,
        completedTasks: 0,
        totalTasks: agentType === "ProjectManager" ? totalTasks : 0,
        startedAt: agentType === "ProjectManager" ? now : undefined,
      };

      acc[agentType] = baseStatus;
      return acc;
    },
    {} as Record<AgentType, AgentStatus>
  );
}

function createInitialRequirementArtifact(
  taskList: TaskList,
  workflowId: WorkflowId,
  now: Date
): Artifact {
  return {
    id: `${workflowId}-requirements`,
    title: taskList.title,
    description: taskList.description ?? "",
    priority: "must-have",
    status: "draft",
    acceptanceCriteria: taskList.tasks.map((task) => task.description),
    relatedTasks: taskList.tasks.map((task) => task.id),
    metadata: {
      id: `${workflowId}-requirements`,
      type: "requirement",
      workflowId,
      agentType: "ProjectManager",
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
  };
}

const defaultHandlers = createProjectManagerWorkflowHandlers();

export const initializeWorkflow = defaultHandlers.initializeWorkflow;
export const getWorkflowStatus = defaultHandlers.getWorkflowStatus;
