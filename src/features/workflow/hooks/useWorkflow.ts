import { useState, useEffect, useCallback } from 'react';
import {
  Workflow,
  WorkflowId,
  WorkflowEvent,
  WorkflowEventBus
} from '../types/workflow.types';
import { getWorkflow } from '../actions/workflow.actions';

export interface UseWorkflowReturn {
  workflow: Workflow | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useWorkflow(workflowId: WorkflowId): UseWorkflowReturn {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkflow = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkflow(workflowId);
      setWorkflow(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch workflow'));
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  const refetch = useCallback(async () => {
    await fetchWorkflow();
  }, [fetchWorkflow]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // TODO: Subscribe to workflow events for real-time updates
  // useEffect(() => {
  //   const eventBus = getEventBus();
  //   const unsubscribe = eventBus.subscribe(workflowId, (event: WorkflowEvent) => {
  //     // Update workflow state based on events
  //     if (event.type === 'task_completed' || event.type === 'agent_changed') {
  //       refetch();
  //     }
  //   });
  //   return unsubscribe;
  // }, [workflowId, refetch]);

  return {
    workflow,
    loading,
    error,
    refetch
  };
}

// Hook for workflow actions
export interface UseWorkflowActionsReturn {
  createWorkflow: (description: string, requirements?: string[]) => Promise<string>;
  startWorkflow: (workflowId: string) => Promise<void>;
  pauseWorkflow: (workflowId: string) => Promise<void>;
  resumeWorkflow: (workflowId: string) => Promise<void>;
  cancelWorkflow: (workflowId: string) => Promise<void>;
  completeTask: (workflowId: string, taskId: string, result: unknown) => Promise<void>;
  failTask: (workflowId: string, taskId: string, error: Error) => Promise<void>;
}

export function useWorkflowActions(): UseWorkflowActionsReturn {
  // Import actions dynamically to avoid server/client issues
  const createWorkflowAction = useCallback(async (description: string, requirements?: string[]) => {
    const { createWorkflow } = await import('../actions/workflow.actions');
    return createWorkflow({ description, requirements });
  }, []);

  const startWorkflowAction = useCallback(async (workflowId: string) => {
    const { startWorkflow } = await import('../actions/workflow.actions');
    return startWorkflow(workflowId);
  }, []);

  const pauseWorkflowAction = useCallback(async (workflowId: string) => {
    const { pauseWorkflow } = await import('../actions/workflow.actions');
    return pauseWorkflow(workflowId);
  }, []);

  const resumeWorkflowAction = useCallback(async (workflowId: string) => {
    const { resumeWorkflow } = await import('../actions/workflow.actions');
    return resumeWorkflow(workflowId);
  }, []);

  const cancelWorkflowAction = useCallback(async (workflowId: string) => {
    const { cancelWorkflow } = await import('../actions/workflow.actions');
    return cancelWorkflow(workflowId);
  }, []);

  const completeTaskAction = useCallback(async (workflowId: string, taskId: string, result: unknown) => {
    const { completeTask } = await import('../actions/workflow.actions');
    return completeTask(workflowId, taskId, result);
  }, []);

  const failTaskAction = useCallback(async (workflowId: string, taskId: string, error: Error) => {
    const { failTask } = await import('../actions/workflow.actions');
    return failTask(workflowId, taskId, error);
  }, []);

  return {
    createWorkflow: createWorkflowAction,
    startWorkflow: startWorkflowAction,
    pauseWorkflow: pauseWorkflowAction,
    resumeWorkflow: resumeWorkflowAction,
    cancelWorkflow: cancelWorkflowAction,
    completeTask: completeTaskAction,
    failTask: failTaskAction
  };
}
