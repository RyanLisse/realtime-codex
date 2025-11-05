import { useCallback, useEffect, useState } from "react";
import { getWorkflow } from "../actions/workflow.actions";
import type {
  BranchProgressMetrics,
  ParallelExecutionMetrics,
  Workflow,
  WorkflowEvent,
  WorkflowEventBus,
  WorkflowId,
} from "../types/workflow.types";

export interface UseWorkflowReturn {
  workflow: Workflow | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  // Parallel execution features
  parallelMetrics: ParallelExecutionMetrics | null;
  branchProgress: BranchProgressMetrics[];
  bottlenecks: string[];
}

export function useWorkflow(workflowId: WorkflowId): UseWorkflowReturn {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [parallelMetrics, setParallelMetrics] =
    useState<ParallelExecutionMetrics | null>(null);
  const [branchProgress, setBranchProgress] = useState<BranchProgressMetrics[]>(
    []
  );
  const [bottlenecks, setBottlenecks] = useState<string[]>([]);

  const fetchWorkflow = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkflow(workflowId);
      setWorkflow(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch workflow")
      );
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

  // Subscribe to workflow events for real-time updates
  useEffect(() => {
    if (!workflowId) return;

    let eventBus: WorkflowEventBus | null = null;

    const initEventBus = async () => {
      try {
        // Import event bus dynamically to avoid SSR issues
        const { WorkflowEventBus } = await import(
          "../services/workflowEventBus"
        );
        eventBus = new WorkflowEventBus();

        // Subscribe to workflow-specific events
        const unsubscribeWorkflow = eventBus.subscribe(
          workflowId,
          (event: WorkflowEvent) => {
            if (
              event.type === "task_completed" ||
              event.type === "agent_changed" ||
              event.type === "task_failed"
            ) {
              refetch();
            }
          }
        );

        // Subscribe to parallel execution metrics
        const unsubscribeParallel = eventBus.subscribe(
          workflowId,
          (event: WorkflowEvent) => {
            if (event.type === "parallel_execution_update") {
              const metrics = event.data as unknown as ParallelExecutionMetrics;
              setParallelMetrics(metrics);
              setBottlenecks(
                metrics.bottlenecks?.map((agent) => agent.toString()) || []
              );
            }

            if (event.type === "branch_progress") {
              const branchMetrics =
                event.data as unknown as BranchProgressMetrics;
              setBranchProgress((prev) => {
                const existing = prev.findIndex(
                  (b) => b.branchId === branchMetrics.branchId
                );
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = branchMetrics;
                  return updated;
                }
                return [...prev, branchMetrics];
              });
            }
          }
        );

        // Cleanup function
        return () => {
          unsubscribeWorkflow();
          unsubscribeParallel();
        };
      } catch (error) {
        console.warn("Failed to initialize workflow event bus:", error);
      }
    };

    const cleanup = initEventBus();

    return () => {
      cleanup?.then((cleanupFn) => cleanupFn?.());
    };
  }, [workflowId, refetch]);

  return {
    workflow,
    loading,
    error,
    refetch,
    parallelMetrics,
    branchProgress,
    bottlenecks,
  };
}

// Hook for workflow actions
export interface UseWorkflowActionsReturn {
  createWorkflow: (
    description: string,
    requirements?: string[]
  ) => Promise<string>;
  startWorkflow: (workflowId: string) => Promise<void>;
  pauseWorkflow: (workflowId: string) => Promise<void>;
  resumeWorkflow: (workflowId: string) => Promise<void>;
  cancelWorkflow: (workflowId: string) => Promise<void>;
  completeTask: (
    workflowId: string,
    taskId: string,
    result: unknown
  ) => Promise<void>;
  failTask: (workflowId: string, taskId: string, error: Error) => Promise<void>;
}

export function useWorkflowActions(): UseWorkflowActionsReturn {
  // Import actions dynamically to avoid server/client issues
  const createWorkflowAction = useCallback(
    async (description: string, requirements?: string[]) => {
      const { createWorkflow } = await import("../actions/workflow.actions");
      return createWorkflow({ description, requirements });
    },
    []
  );

  const startWorkflowAction = useCallback(async (workflowId: string) => {
    const { startWorkflow } = await import("../actions/workflow.actions");
    return startWorkflow(workflowId);
  }, []);

  const pauseWorkflowAction = useCallback(async (workflowId: string) => {
    const { pauseWorkflow } = await import("../actions/workflow.actions");
    return pauseWorkflow(workflowId);
  }, []);

  const resumeWorkflowAction = useCallback(async (workflowId: string) => {
    const { resumeWorkflow } = await import("../actions/workflow.actions");
    return resumeWorkflow(workflowId);
  }, []);

  const cancelWorkflowAction = useCallback(async (workflowId: string) => {
    const { cancelWorkflow } = await import("../actions/workflow.actions");
    return cancelWorkflow(workflowId);
  }, []);

  const completeTaskAction = useCallback(
    async (workflowId: string, taskId: string, result: unknown) => {
      const { completeTask } = await import("../actions/workflow.actions");
      return completeTask(workflowId, taskId, result);
    },
    []
  );

  const failTaskAction = useCallback(
    async (workflowId: string, taskId: string, error: Error) => {
      const { failTask } = await import("../actions/workflow.actions");
      return failTask(workflowId, taskId, error);
    },
    []
  );

  return {
    createWorkflow: createWorkflowAction,
    startWorkflow: startWorkflowAction,
    pauseWorkflow: pauseWorkflowAction,
    resumeWorkflow: resumeWorkflowAction,
    cancelWorkflow: cancelWorkflowAction,
    completeTask: completeTaskAction,
    failTask: failTaskAction,
  };
}
