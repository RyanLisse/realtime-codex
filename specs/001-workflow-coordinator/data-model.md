# Data Model: Workflow Coordinator & Task Router

## Overview

The workflow coordinator manages multi-agent task execution through a hierarchical state machine with dependency resolution and parallel execution capabilities. Data persistence enables workflow recovery across system restarts.

## Core Entities

### Workflow
**Purpose**: Represents a complete multi-agent task execution lifecycle
**Attributes**:
- `id`: string (UUID) - Unique workflow identifier
- `description`: string - Human-readable task description
- `status`: WorkflowStatus - Current execution state (idle, in_progress, paused, completed, failed)
- `createdAt`: Date - Workflow creation timestamp
- `updatedAt`: Date - Last state change timestamp
- `currentAgent`: AgentType | null - Currently active agent
- `taskQueue`: Task[] - Pending tasks awaiting execution
- `completedTasks`: Task[] - Successfully completed tasks
- `artifacts`: string[] - IDs of generated artifacts
- `history`: HandoffRecord[] - Complete execution history

**Relationships**:
- 1:N with Task (contains multiple tasks)
- 1:N with HandoffRecord (maintains execution history)
- N:1 with Agent (references current agent)

**Validation Rules**:
- `id` must be valid UUID format
- `status` must be valid WorkflowStatus enum value
- `createdAt` <= `updatedAt`
- `currentAgent` must exist if status is "in_progress"
- No duplicate task IDs in taskQueue or completedTasks

### Task
**Purpose**: Individual unit of work assigned to specific agents
**Attributes**:
- `id`: string (UUID) - Unique task identifier
- `description`: string - Task description and requirements
- `assignedAgent`: AgentType - Agent responsible for execution
- `status`: TaskStatus - Execution state (pending, active, completed, failed)
- `dependencies`: string[] - Task IDs that must complete before this task
- `result`: any - Execution result or error details
- `createdAt`: Date - Task creation timestamp
- `startedAt`: Date | null - Execution start timestamp
- `completedAt`: Date | null - Completion timestamp
- `timeoutMs`: number - Maximum execution time in milliseconds

**Relationships**:
- N:1 with Workflow (belongs to workflow)
- N:N with Task (dependency relationships)

**Validation Rules**:
- `assignedAgent` must be valid AgentType enum
- `status` must be valid TaskStatus enum
- `dependencies` cannot contain self-references
- `startedAt` and `completedAt` must be set appropriately based on status
- `timeoutMs` must be positive integer

### HandoffRecord
**Purpose**: Records agent-to-agent transitions and context passing
**Attributes**:
- `id`: string (UUID) - Unique record identifier
- `workflowId`: string - Associated workflow ID
- `fromAgent`: AgentType - Source agent initiating handoff
- `toAgent`: AgentType - Target agent receiving handoff
- `context`: string - Context description and requirements
- `artifacts`: string[] - Artifact IDs passed during handoff
- `timestamp`: Date - Handoff execution timestamp
- `success`: boolean - Whether handoff completed successfully

**Relationships**:
- N:1 with Workflow (belongs to workflow)

**Validation Rules**:
- `fromAgent` and `toAgent` must be different
- `fromAgent` and `toAgent` must be valid AgentType enums
- `timestamp` must be valid Date
- `artifacts` must reference existing artifact IDs

### AgentStatus
**Purpose**: Tracks individual agent state within a workflow
**Attributes**:
- `agentType`: AgentType - Type of agent
- `status`: AgentExecutionStatus - Current execution state
- `currentTask`: string | null - Currently executing task ID
- `progress`: number - Completion percentage (0-100)
- `lastActivity`: Date - Timestamp of last state change
- `errorMessage`: string | null - Error details if failed

**Relationships**:
- N:1 with Workflow (belongs to workflow)

**Validation Rules**:
- `agentType` must be valid AgentType enum
- `status` must be valid AgentExecutionStatus enum
- `progress` must be between 0 and 100
- `errorMessage` required when status is "error"

## Enumeration Types

### WorkflowStatus
```typescript
enum WorkflowStatus {
  IDLE = 'idle',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### TaskStatus
```typescript
enum TaskStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### AgentType
```typescript
enum AgentType {
  PROJECT_MANAGER = 'ProjectManager',
  DESIGNER = 'Designer',
  FRONTEND = 'Frontend',
  BACKEND = 'Backend',
  TESTER = 'Tester'
}
```

### AgentExecutionStatus
```typescript
enum AgentExecutionStatus {
  IDLE = 'idle',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ERROR = 'error'
}
```

## Data Flow Patterns

### Workflow Creation
1. User submits task description
2. ProjectManager analyzes and decomposes into tasks
3. Tasks created with dependencies and agent assignments
4. Workflow enters "in_progress" state

### Sequential Execution
1. Coordinator identifies next executable task (dependencies met)
2. Routes task to assigned agent
3. Agent executes and reports completion
4. Coordinator updates task status and workflow progress
5. Process repeats until all tasks complete

### Parallel Execution
1. Coordinator identifies multiple independent tasks
2. Routes tasks simultaneously to different agents
3. Tracks progress of all parallel branches
4. Waits for all branches to complete before proceeding
5. Aggregates results from parallel execution

### Failure Recovery
1. Agent reports failure with error details
2. Coordinator marks task as failed
3. Workflow enters "paused" state
4. User can retry failed task or cancel workflow
5. On retry, workflow resumes from failed task

## Persistence Strategy

### File-Based Storage
- Workflows stored as JSON files in `/workflows/` directory
- File naming: `{workflowId}.json`
- Atomic writes prevent corruption during saves
- Backup files maintained for recovery

### State Serialization
- All dates serialized as ISO strings
- Complex objects (artifacts) stored as references
- Validation performed on deserialization
- Versioning supports future schema evolution

## Performance Considerations

### Query Optimization
- Workflow queries indexed by status and creation date
- Task lookups optimized for dependency resolution
- Artifact references cached to reduce I/O

### Memory Management
- Active workflows kept in memory for fast access
- Completed workflows archived to disk
- Event listeners cleaned up on workflow completion
- Garbage collection prevents memory leaks
