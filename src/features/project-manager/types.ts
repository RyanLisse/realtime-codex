import { z } from "zod";
import { AgentType } from "../shared/types/workflow.types";

// Task decomposition result
export const TaskDecompositionSchema = z.object({
  originalTask: z.string(),
  subtasks: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      assignedAgent: AgentType,
      priority: z.enum(["low", "medium", "high"]),
      estimatedDuration: z.number().optional(),
      dependencies: z.array(z.string()).default([]),
    })
  ),
  dependencies: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        type: z.enum(["blocking", "informational"]),
      })
    )
    .default([]),
  canRunInParallel: z.array(z.array(AgentType)).default([]),
});

export type TaskDecomposition = z.infer<typeof TaskDecompositionSchema>;

// Requirement specification
export const RequirementSpecSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["must-have", "should-have", "nice-to-have"]),
  userStories: z
    .array(
      z.object({
        as: z.string(),
        want: z.string(),
        soThat: z.string(),
      })
    )
    .default([]),
  technicalRequirements: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
  relatedTasks: z.array(z.string()).default([]),
});

export type RequirementSpec = z.infer<typeof RequirementSpecSchema>;

// Coordination plan
export const CoordinationPlanSchema = z.object({
  workflowId: z.string(),
  totalTasks: z.number(),
  parallelGroups: z
    .array(
      z.object({
        groupId: z.string(),
        agents: z.array(AgentType),
        tasks: z.array(z.string()),
        canStart: z.boolean(),
        started: z.boolean(),
      })
    )
    .default([]),
  sequentialTasks: z.array(z.string()).default([]),
  estimatedCompletionTime: z.number().optional(),
  milestones: z
    .array(
      z.object({
        name: z.string(),
        tasksRequired: z.array(z.string()),
        status: z.enum(["pending", "in_progress", "completed"]),
      })
    )
    .default([]),
});

export type CoordinationPlan = z.infer<typeof CoordinationPlanSchema>;

// Project Manager task
export const ProjectManagerTaskSchema = z.object({
  id: z.string(),
  type: z.enum([
    "decompose_tasks",
    "create_requirements",
    "coordinate_handoff",
    "monitor_progress",
  ]),
  input: z.any(),
  output: z.any().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  assignedTo: z.array(AgentType),
  dependencies: z.array(z.string()).default([]),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
});

export type ProjectManagerTask = z.infer<typeof ProjectManagerTaskSchema>;
