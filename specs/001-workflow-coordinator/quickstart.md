# Quickstart: Workflow Coordinator & Task Router

## Overview

The Workflow Coordinator manages multi-agent task execution, handling sequential and parallel agent handoffs, state persistence, and real-time status tracking. This guide shows how to integrate workflow orchestration into your application.

## Prerequisites

- Node.js 18+ and TypeScript 5.x
- Existing agent framework (ProjectManager, Designer, Frontend, Backend, Tester)
- File system permissions for `/workflows/` directory

## Installation

The workflow coordinator is implemented as a feature module. Add it to your Next.js application:

```typescript
// src/features/workflow/index.ts
export { WorkflowCoordinator } from './services/workflowCoordinator';
export { TaskRouter } from './services/taskRouter';
export { useWorkflow } from './hooks/useWorkflow';
export * from './types/workflow.types';
```

## Basic Usage

### 1. Initialize Workflow Coordinator

```typescript
import { WorkflowCoordinator } from '@/features/workflow';

const coordinator = new WorkflowCoordinator({
  persistencePath: './workflows',
  maxConcurrentWorkflows: 10,
  defaultTimeoutMs: 300000, // 5 minutes
});
```

### 2. Create a Workflow

```typescript
// Server action or API route
const workflowId = await coordinator.createWorkflow({
  description: "Build a user authentication system with login and registration",
  requirements: [
    "Must support email/password authentication",
    "Should include password strength validation",
    "Must handle registration confirmation"
  ]
});

console.log(`Workflow created: ${workflowId}`);
```

### 3. Monitor Workflow Progress

```typescript
// React component
import { useWorkflow } from '@/features/workflow';

function WorkflowMonitor({ workflowId }: { workflowId: string }) {
  const { workflow, agents, artifacts, error } = useWorkflow(workflowId);

  if (error) return <div>Error: {error.message}</div>;
  if (!workflow) return <div>Loading...</div>;

  return (
    <div>
      <h2>Workflow Status: {workflow.status}</h2>
      <div>Progress: {workflow.progress}%</div>

      {agents.map(agent => (
        <div key={agent.agentType}>
          {agent.agentType}: {agent.status}
          {agent.currentTask && ` (${agent.progress}%)`}
        </div>
      ))}

      <h3>Artifacts ({artifacts.length})</h3>
      {artifacts.map(artifact => (
        <div key={artifact.id}>
          {artifact.name} - {artifact.type}
        </div>
      ))}
    </div>
  );
}
```

## Advanced Usage

### Custom Agent Integration

```typescript
// Extend existing agent with workflow awareness
import { RealtimeAgent } from '@/lib/realtime-agent';
import { WorkflowCoordinator } from '@/features/workflow';

class WorkflowAwareAgent extends RealtimeAgent {
  constructor(
    private coordinator: WorkflowCoordinator,
    private agentType: AgentType,
    config: AgentConfig
  ) {
    super(config);
  }

  async executeTask(task: Task): Promise<TaskResult> {
    // Update workflow status
    await this.coordinator.updateAgentStatus(this.agentType, 'active', task.id);

    try {
      // Execute task logic
      const result = await this.performTask(task);

      // Mark task complete and hand off if needed
      await this.coordinator.completeTask(task.id, result);
      await this.coordinator.handOffToNextAgent(this.agentType, result);

      return result;
    } catch (error) {
      // Handle task failure
      await this.coordinator.failTask(task.id, error);
      throw error;
    }
  }
}
```

### Parallel Task Execution

```typescript
// Coordinator automatically handles parallel execution
const workflowId = await coordinator.createWorkflow({
  description: "Build frontend dashboard and backend API simultaneously",
  requirements: [
    "Frontend: React dashboard with charts",
    "Backend: REST API for data endpoints",
    "Integration: API calls from frontend"
  ]
});

// Coordinator will:
// 1. Create separate tasks for Frontend and Backend
// 2. Start both agents simultaneously
// 3. Wait for both to complete
// 4. Route to Tester for integration testing
```

### Event-Driven Updates

```typescript
// Subscribe to workflow events
const unsubscribe = coordinator.subscribe(workflowId, (event) => {
  switch (event.type) {
    case 'agent_changed':
      console.log(`${event.fromAgent} → ${event.toAgent}`);
      break;
    case 'task_completed':
      console.log(`Task ${event.taskId} completed`);
      break;
    case 'workflow_completed':
      console.log('Workflow finished successfully');
      unsubscribe(); // Clean up
      break;
  }
});
```

## Configuration Options

```typescript
interface WorkflowCoordinatorConfig {
  persistencePath: string;        // Directory for workflow storage
  maxConcurrentWorkflows: number; // Maximum simultaneous workflows
  defaultTimeoutMs: number;       // Default agent timeout
  retryAttempts: number;         // Number of retry attempts
  retryDelayMs: number;          // Delay between retries
  enableEvents: boolean;         // Enable event emission
  cleanupIntervalMs: number;     // How often to clean old workflows
}
```

## Error Handling

```typescript
try {
  const workflowId = await coordinator.createWorkflow(taskDescription);
} catch (error) {
  if (error.code === 'MAX_CONCURRENT_WORKFLOWS') {
    console.log('Too many active workflows. Try again later.');
  } else if (error.code === 'INVALID_TASK_DESCRIPTION') {
    console.log('Task description is too vague or invalid.');
  } else {
    console.error('Workflow creation failed:', error);
  }
}
```

## Monitoring and Debugging

### Workflow Logs

```typescript
// Get detailed execution history
const history = await coordinator.getWorkflowHistory(workflowId);
history.forEach(record => {
  console.log(`${record.timestamp}: ${record.fromAgent} → ${record.toAgent}`);
  console.log(`Context: ${record.context}`);
});
```

### Performance Metrics

```typescript
// Get workflow statistics
const stats = await coordinator.getWorkflowStats();
console.log(`Active workflows: ${stats.active}`);
console.log(`Completed today: ${stats.completedToday}`);
console.log(`Average completion time: ${stats.averageDurationMs}ms`);
```

## Integration with Existing Agents

The workflow coordinator integrates seamlessly with existing agents by providing:

1. **Task Assignment**: Automatically routes tasks to appropriate agents
2. **State Management**: Maintains execution context across handoffs
3. **Error Recovery**: Handles agent failures and retries
4. **Progress Tracking**: Real-time status updates for UI
5. **Artifact Management**: Collects and organizes generated outputs

## Next Steps

1. **Implement the coordinator service** in `src/features/workflow/services/`
2. **Create UI components** for workflow visualization
3. **Add integration tests** for multi-agent handoffs
4. **Set up monitoring** for workflow performance
5. **Document agent handoff protocols** for team consistency

## Troubleshooting

### Common Issues

- **Workflow stuck in "in_progress"**: Check agent timeouts and error logs
- **Parallel tasks not executing**: Verify task dependencies are correctly defined
- **Missing artifacts**: Ensure agents are properly integrated with coordinator
- **Performance issues**: Check concurrent workflow limits and resource usage

### Debug Mode

```typescript
// Enable detailed logging
coordinator.enableDebugLogging();

// Inspect workflow state
const debugInfo = await coordinator.getDebugInfo(workflowId);
console.log(JSON.stringify(debugInfo, null, 2));
```
