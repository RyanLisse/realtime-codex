import { Agent, tool } from "@openai/agents";
import { z } from "zod";

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
  return {
    createWorkflow: async (task: string) => {
      // TODO: Implement workflow creation via WorkflowCoordinator
      throw new Error("Workflow service not yet implemented");
    },
    getWorkflowStatus: async (_id: string) => {
      // TODO: Implement workflow status retrieval
      throw new Error("Workflow status retrieval not yet implemented");
    },
  };
}
