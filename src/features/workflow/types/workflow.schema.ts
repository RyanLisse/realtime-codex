import { z } from "zod";
import {
  AgentExecutionStatus,
  AgentType,
  TaskStatus,
  WorkflowStatus,
} from "./workflow.types";

// Enum schemas
export const WorkflowStatusSchema = z.nativeEnum(WorkflowStatus);
export const TaskStatusSchema = z.nativeEnum(TaskStatus);
export const AgentTypeSchema = z.nativeEnum(AgentType);
export const AgentExecutionStatusSchema = z.nativeEnum(AgentExecutionStatus);

// ID schemas
export const WorkflowIdSchema = z.string().uuid();
export const TaskIdSchema = z.string().uuid();
export const ArtifactIdSchema = z.string().uuid();

// Workflow schema
export const WorkflowSchema = z.object({
  id: WorkflowIdSchema,
  description: z.string().min(1),
  status: WorkflowStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  currentAgent: AgentTypeSchema.nullable(),
  taskQueue: z.array(z.lazy(() => TaskSchema)),
  completedTasks: z.array(z.lazy(() => TaskSchema)),
  artifacts: z.array(ArtifactIdSchema),
  history: z.array(z.lazy(() => HandoffRecordSchema)),
});

// Task schema
export const TaskSchema = z.object({
  id: TaskIdSchema,
  description: z.string().min(1),
  assignedAgent: AgentTypeSchema,
  status: TaskStatusSchema,
  dependencies: z.array(TaskIdSchema),
  result: z.unknown().optional(),
  createdAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  timeoutMs: z.number().positive(),
});

// Handoff record schema
export const HandoffRecordSchema = z.object({
  id: z.string().uuid(),
  workflowId: WorkflowIdSchema,
  fromAgent: AgentTypeSchema,
  toAgent: AgentTypeSchema,
  context: z.string().min(1),
  artifacts: z.array(ArtifactIdSchema),
  timestamp: z.date(),
  success: z.boolean(),
});

// Agent status schema
export const AgentStatusSchema = z.object({
  agentType: AgentTypeSchema,
  status: AgentExecutionStatusSchema,
  currentTask: TaskIdSchema.nullable(),
  progress: z.number().min(0).max(100),
  lastActivity: z.date(),
  errorMessage: z.string().optional(),
});

// Workflow creation parameters schema
export const CreateWorkflowParamsSchema = z.object({
  description: z.string().min(1),
  requirements: z.array(z.string()).optional(),
});

// Workflow event schema
export const WorkflowEventTypeSchema = z.enum([
  "created",
  "started",
  "agent_changed",
  "task_completed",
  "task_failed",
  "paused",
  "resumed",
  "completed",
  "failed",
]);

export const WorkflowEventSchema = z.object({
  type: WorkflowEventTypeSchema,
  workflowId: WorkflowIdSchema,
  timestamp: z.date(),
  data: z.record(z.unknown()).optional(),
});

// Type inference helpers
export type WorkflowStatusType = z.infer<typeof WorkflowStatusSchema>;
export type TaskStatusType = z.infer<typeof TaskStatusSchema>;
export type AgentTypeEnum = z.infer<typeof AgentTypeSchema>;
export type AgentExecutionStatusType = z.infer<
  typeof AgentExecutionStatusSchema
>;
export type WorkflowType = z.infer<typeof WorkflowSchema>;
export type TaskType = z.infer<typeof TaskSchema>;
export type HandoffRecordType = z.infer<typeof HandoffRecordSchema>;
export type AgentStatusType = z.infer<typeof AgentStatusSchema>;
export type CreateWorkflowParamsType = z.infer<
  typeof CreateWorkflowParamsSchema
>;
export type WorkflowEventType = z.infer<typeof WorkflowEventSchema>;
