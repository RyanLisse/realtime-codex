# Workflow State Machine

## Overview

The multi-agent workflow orchestration system manages state transitions across five specialized agents. Each workflow progresses through distinct phases with corresponding agent states.

## Workflow States

```
running → completed
   ↓
 failed
```

- **running**: Active workflow in progress
- **completed**: All tasks successfully finished
- **failed**: Workflow terminated due to error

## Workflow Phases

```
planning → design → implementation → testing → deployment
```

1. **planning**: Project Manager decomposes requirements into tasks
2. **design**: Designer creates UI/UX specifications
3. **implementation**: Frontend/Backend developers build features
4. **testing**: Tester validates functionality
5. **deployment**: Final validation and release

## Agent States

Each agent transitions through these states:

```
idle → pending → active → completed
         ↓
       failed
```

- **idle**: Agent not yet involved in workflow
- **pending**: Waiting for handoff from previous agent
- **active**: Currently executing tasks
- **completed**: All assigned tasks finished
- **failed**: Agent encountered unrecoverable error

## State Transitions

### ProjectManager → Designer

**Trigger**: Task decomposition complete
**Precondition**: `ProjectManager.state === "completed"`
**Action**:
- Set `Designer.state = "pending"`
- Create design artifact with requirements
- Update `workflow.currentPhase = "design"`

### Designer → FrontendDeveloper / BackendDeveloper

**Trigger**: Design specifications approved
**Precondition**: `Designer.state === "completed"`
**Action**:
- Set `FrontendDeveloper.state = "pending"`
- Set `BackendDeveloper.state = "pending"`
- Create component/API artifacts
- Update `workflow.currentPhase = "implementation"`

**Note**: Frontend and Backend developers work in parallel

### FrontendDeveloper + BackendDeveloper → Tester

**Trigger**: Both implementations complete
**Precondition**:
- `FrontendDeveloper.state === "completed"`
- `BackendDeveloper.state === "completed"`
**Action**:
- Set `Tester.state = "pending"`
- Create test plan artifact
- Update `workflow.currentPhase = "testing"`

### Tester → Deployment

**Trigger**: All tests pass
**Precondition**: `Tester.state === "completed"`
**Action**:
- Update `workflow.currentPhase = "deployment"`
- Update `workflow.status = "completed"`
- Set `workflow.completedAt = now()`

## Agent Progress Tracking

Each `AgentStatus` tracks:

```typescript
{
  agentType: AgentType;
  state: "idle" | "pending" | "active" | "completed" | "failed";
  progress: number; // 0-100
  completedTasks: number;
  totalTasks: number;
  currentTask?: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}
```

**Progress Calculation**:
```typescript
progress = (completedTasks / totalTasks) * 100
```

## Workflow Lifecycle Management

### Creation

```typescript
initializeWorkflow(taskListInput: string) → WorkflowId
```

1. Parse and validate task list
2. Cleanup stale workflows (TTL > 24h)
3. Enforce max workflow limit (100)
4. Generate workflow ID
5. Initialize agent statuses
6. Create requirement artifact
7. Store workflow state

### Retrieval

```typescript
getWorkflowStatus(workflowId: WorkflowId) → WorkflowState
```

Returns current state or throws detailed error if workflow not found (may have been cleaned up).

### Cleanup

**Automatic cleanup on `initializeWorkflow()`**:

1. **TTL-based**: Remove workflows older than 24 hours
2. **Capacity-based**: If store >= 100 workflows, remove oldest by `updatedAt`

**Cleanup Formula**:
```typescript
if (now - workflow.updatedAt > 24h) delete workflow
if (store.size >= 100) delete oldest
```

## Memory Management

### Current: In-Memory Store

```typescript
const workflowStore = new Map<WorkflowId, WorkflowState>();
```

**Limitations**:
- Lost on server restart
- Limited by RAM
- No cross-instance sharing

### Future: Persistence Layer

**Recommended Options**:

1. **Redis** (sessions, caching)
   - TTL built-in
   - Fast reads/writes
   - Pub/sub for real-time updates

2. **PostgreSQL** (long-term storage)
   - ACID guarantees
   - Complex queries
   - Historical analysis

3. **Hybrid** (optimal)
   - Redis for active workflows
   - PostgreSQL for completed/archived
   - Automatic promotion/demotion

**Migration Path**:
```typescript
interface WorkflowStore {
  set(id: WorkflowId, state: WorkflowState): Promise<void>;
  get(id: WorkflowId): Promise<WorkflowState | undefined>;
  delete(id: WorkflowId): Promise<void>;
  entries(): AsyncIterableIterator<[WorkflowId, WorkflowState]>;
}
```

## Error Recovery

### Agent Failure

When `agent.state === "failed"`:
1. Store error message in `agent.error`
2. Set `workflow.status = "failed"`
3. Preserve workflow for debugging
4. Emit failure event for monitoring

### Workflow Recovery

**Manual Retry**:
```typescript
// Reset failed agent
agent.state = "pending";
agent.error = undefined;

// Resume from checkpoint
workflow.status = "running";
```

**Automatic Retry** (future):
- Exponential backoff
- Max retry limit (3)
- Idempotent operations

## Monitoring & Observability

**Key Metrics**:
- Workflow completion rate
- Average phase duration
- Agent utilization
- Cleanup frequency
- Store capacity

**Events to Track**:
- `workflow.created`
- `workflow.phase_changed`
- `agent.state_changed`
- `workflow.completed`
- `workflow.failed`
- `workflow.cleaned_up`

## Example Flow

```
1. User submits task list
2. ProjectManager breaks into 5 tasks
   → state: active, progress: 0%
3. ProjectManager completes decomposition
   → state: completed, progress: 100%
4. Designer receives handoff
   → state: pending → active
5. Designer creates mockups
   → progress: 50%
6. Designer completes specs
   → state: completed, progress: 100%
7. Frontend & Backend start parallel
   → both state: active
8. Frontend completes
   → state: completed
9. Backend completes
   → state: completed
10. Tester starts validation
    → state: active
11. Tests pass
    → state: completed, workflow.status: completed
```

## Configuration

```typescript
const MAX_WORKFLOWS = 100;        // Capacity limit
const WORKFLOW_TTL_MS = 86400000; // 24 hours in ms
```

**Tuning Guidelines**:
- Increase `MAX_WORKFLOWS` if workflows complete slowly
- Decrease `WORKFLOW_TTL_MS` for faster cleanup
- Monitor memory usage and adjust accordingly
