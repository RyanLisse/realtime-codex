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

const MAX_WORKFLOWS = 100;
const WORKFLOW_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * In-memory workflow store with TTL-based cleanup.
 *
 * PRODUCTION CONSIDERATIONS:
 * - Current: Map-based in-memory storage (lost on restart)
 * - Recommended: Hybrid persistence strategy
 *   1. Redis for active workflows (TTL support, real-time)
 *   2. PostgreSQL for completed/archived workflows (historical analysis)
 * - Migration: Implement WorkflowStore interface for pluggable backends
 * - See docs/WORKFLOW_STATE_MACHINE.md for detailed persistence design
 */
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

  const cleanupStaleWorkflows = () => {
    const now = dateFactory();
    const staleWorkflows: WorkflowId[] = [];

    for (const [id, state] of workflowStore) {
      const age = now.getTime() - state.updatedAt.getTime();
      if (age > WORKFLOW_TTL_MS) {
        staleWorkflows.push(id);
      }
    }

    for (const id of staleWorkflows) {
      workflowStore.delete(id);
    }

    return staleWorkflows.length;
  };

  const enforceMaxWorkflows = () => {
    if (workflowStore.size >= MAX_WORKFLOWS) {
      const entries = Array.from(workflowStore.entries());
      entries.sort(
        (a, b) => a[1].updatedAt.getTime() - b[1].updatedAt.getTime()
      );
      const toRemove = entries.slice(0, workflowStore.size - MAX_WORKFLOWS + 1);

      for (const [id] of toRemove) {
        workflowStore.delete(id);
      }
    }
  };

  const initializeWorkflow = async (
    taskListInput: string
  ): Promise<WorkflowId> => {
    cleanupStaleWorkflows();
    enforceMaxWorkflows();

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
      throw new Error(
        `Workflow ${workflowId} not found. It may have been cleaned up due to TTL (${WORKFLOW_TTL_MS / 1000 / 60 / 60}h) or store capacity limit (${MAX_WORKFLOWS} workflows).`
      );
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
    const errorMessage =
      error instanceof Error ? error.message : "Unknown parsing error";
    throw new Error(
      `Invalid task list input: ${errorMessage}. Expected JSON with structure: { title: string, description?: string, tasks: Array<{ id: string, description: string, dependencies: string[], priority: "high" | "medium" | "low" }> }`
    );
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
