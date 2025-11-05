import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { WorkflowCoordinator } from "@/features/workflow/services/workflowCoordinator";
import { FileWorkflowPersistence } from "@/features/workflow/services/workflowPersistence";
import { WorkflowEventBus } from "@/features/workflow/services/workflowEventBus";
import { TaskRouter } from "@/features/workflow/services/taskRouter";

type AgentConfig = {
  name: string;
  instructions: string;
  tools: ReturnType<typeof tool>[];
  model: string;
};

export function createAgent(config: AgentConfig): Agent {
  return new Agent({
    name: config.name,
    instructions: config.instructions,
    tools: config.tools,
    model: config.model,
  });
}

export function createToolWrapper<T, R = unknown>(
  toolFunction: (input: T) => Promise<R>,
  name: string,
  description: string,
  schema?: z.ZodSchema
) {
  return tool({
    name,
    description,
    parameters: schema || z.object({ task: z.unknown() }),
    strict: true,
    execute: async (params: { task: T }) => {
      const result = await toolFunction(params.task);
      return JSON.stringify(result, null, 2);
    },
  });
}

// Workflow feature entry points

export type WorkflowServiceFactory = () => {
  createWorkflow: (task: string) => Promise<string>;
  getWorkflowStatus: (id: string) => Promise<unknown>;
};

export function createWorkflowServiceFactory(): WorkflowServiceFactory {
  const persistence = new FileWorkflowPersistence("./workflows");
  const eventBus = new WorkflowEventBus();
  const taskRouter = new TaskRouter();
  
  const coordinator = new WorkflowCoordinator({
    persistence,
    eventBus,
    taskRouter,
  });

  return {
    createWorkflow: async (task: string) => {
      const workflowId = await coordinator.createWorkflow({
        description: task,
        requirements: [],
      });
      return workflowId;
    },
    getWorkflowStatus: async (id: string) => {
      const workflow = await coordinator.getWorkflow(id);
      return workflow
        ? {
            id: workflow.id,
            status: workflow.status,
            currentAgent: workflow.currentAgent,
            progress:
              workflow.completedTasks.length /
              (workflow.taskQueue.length + workflow.completedTasks.length),
            artifacts: workflow.artifacts,
          }
        : null;
    },
  };
}
