import { z } from "zod";

// Workflow ID type
export type WorkflowId = string;

// Agent types in the system
export const AgentType = z.enum([
  "ProjectManager",
  "Designer",
  "FrontendDeveloper",
  "BackendDeveloper",
  "Tester",
]);

export type AgentType = z.infer<typeof AgentType>;

// Agent status states
export const AgentStatusState = z.enum([
  "idle",
  "pending",
  "active",
  "completed",
  "failed",
]);

export type AgentStatusState = z.infer<typeof AgentStatusState>;

// Agent status
export const AgentStatusSchema = z.object({
  agentType: AgentType,
  state: AgentStatusState,
  currentTask: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  completedTasks: z.number().default(0),
  totalTasks: z.number().default(0),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
});

export type AgentStatus = z.infer<typeof AgentStatusSchema>;

// Handoff request
export const HandoffRequestSchema = z.object({
  fromAgent: AgentType,
  toAgent: AgentType,
  reason: z.string(),
  data: z.record(z.unknown()).optional(),
});

export type HandoffRequest = z.infer<typeof HandoffRequestSchema>;

// Task list structure
export const TaskListItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  assignedTo: z.array(AgentType).optional(),
  dependencies: z.array(z.string()).default([]),
  estimatedDuration: z.number().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export type TaskListItem = z.infer<typeof TaskListItemSchema>;

export const TaskListSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  tasks: z.array(TaskListItemSchema),
  metadata: z
    .object({
      createdAt: z.date().default(() => new Date()),
      createdBy: z.string().optional(),
      tags: z.array(z.string()).default([]),
    })
    .optional(),
});

export type TaskList = z.infer<typeof TaskListSchema>;

// Workflow state
export const WorkflowStateSchema = z.object({
  workflowId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  currentPhase: z
    .enum(["planning", "execution", "testing", "completion"])
    .optional(),
  agents: z.record(AgentType, AgentStatusSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type WorkflowState = z.infer<typeof WorkflowStateSchema>;

// Parallel execution group
export const ParallelExecutionGroupSchema = z.object({
  agents: z.array(AgentType),
  canRunInParallel: z.boolean().default(true),
});

export type ParallelExecutionGroup = z.infer<
  typeof ParallelExecutionGroupSchema
>;
