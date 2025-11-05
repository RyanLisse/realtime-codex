// Core workflow types and enumerations
// Based on data-model.md specifications

export enum WorkflowStatus {
  IDLE = "idle",
  IN_PROGRESS = "in_progress",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum TaskStatus {
  PENDING = "pending",
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum AgentType {
  PROJECT_MANAGER = "ProjectManager",
  DESIGNER = "Designer",
  FRONTEND = "Frontend",
  BACKEND = "Backend",
  TESTER = "Tester",
}

export enum AgentExecutionStatus {
  IDLE = "idle",
  ACTIVE = "active",
  COMPLETED = "completed",
  ERROR = "error",
}

// Core entity types
export type WorkflowId = string;
export type TaskId = string;
export type ArtifactId = string;

// Workflow entity
export type Workflow = {
  id: WorkflowId;
  description: string;
  status: WorkflowStatus;
  createdAt: Date;
  updatedAt: Date;
  currentAgent: AgentType | null;
  taskQueue: Task[];
  completedTasks: Task[];
  artifacts: ArtifactId[];
  history: HandoffRecord[];
};

// Task entity
export type Task = {
  id: TaskId;
  description: string;
  assignedAgent: AgentType;
  status: TaskStatus;
  dependencies: TaskId[];
  result?: unknown;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeoutMs: number;
};

// Handoff record for agent transitions
export type HandoffRecord = {
  id: string;
  workflowId: WorkflowId;
  fromAgent: AgentType;
  toAgent: AgentType;
  context: string;
  artifacts: ArtifactId[];
  timestamp: Date;
  success: boolean;
};

// Agent status tracking
export type AgentStatus = {
  agentType: AgentType;
  status: AgentExecutionStatus;
  currentTask: TaskId | null;
  progress: number; // 0-100
  lastActivity: Date;
  errorMessage?: string;
};

// Workflow creation parameters
export type CreateWorkflowParams = {
  description: string;
  requirements?: string[];
};

// Workflow event types
export type WorkflowEventType =
  | "created"
  | "started"
  | "agent_changed"
  | "task_completed"
  | "task_failed"
  | "paused"
  | "resumed"
  | "completed"
  | "failed"
  | "parallel_execution_update"
  | "branch_progress";

export type WorkflowEvent = {
  type: WorkflowEventType;
  workflowId: WorkflowId;
  timestamp: Date;
  data?:
    | BranchProgressMetrics
    | ParallelExecutionMetrics
    | Record<string, unknown>;
};

// Service interfaces
export type WorkflowCoordinator = {
  createWorkflow(params: CreateWorkflowParams): Promise<WorkflowId>;
  getWorkflow(id: WorkflowId): Promise<Workflow | null>;
  pauseWorkflow(id: WorkflowId): Promise<void>;
  resumeWorkflow(id: WorkflowId): Promise<void>;
  cancelWorkflow(id: WorkflowId): Promise<void>;
};

export type TaskRouter = {
  routeTask(workflowId: WorkflowId, task: Task): Promise<AgentType>;
  getNextTasks(workflowId: WorkflowId): Promise<Task[]>;
  syncWorkflowTasks(workflowId: WorkflowId, tasks: Task[]): void;
  removeWorkflow(workflowId: WorkflowId): void;
};

export type WorkflowPersistence = {
  saveWorkflow(workflow: Workflow): Promise<void>;
  loadWorkflow(id: WorkflowId): Promise<Workflow | null>;
  listWorkflows(status?: WorkflowStatus): Promise<Workflow[]>;
  deleteWorkflow(id: WorkflowId): Promise<void>;
};

export type WorkflowEventBus = {
  emit(event: WorkflowEvent): void;
  subscribe(
    workflowId: WorkflowId,
    handler: (event: WorkflowEvent) => void
  ): () => void;
};

// Parallel execution metrics
export type BranchProgressMetrics = {
  workflowId: WorkflowId;
  branchId: string;
  agentType: AgentType;
  taskId: TaskId;
  progress: number;
  status: "pending" | "active" | "completed" | "failed";
  estimatedTimeRemaining?: number;
  startedAt?: Date;
  completedAt?: Date;
};

export type ParallelExecutionMetrics = {
  workflowId: WorkflowId;
  totalBranches: number;
  activeBranches: number;
  completedBranches: number;
  failedBranches: number;
  overallProgress: number;
  estimatedTimeRemaining?: number;
  bottlenecks?: AgentType[];
};
