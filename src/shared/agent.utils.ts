import { Agent, tool } from "@openai/agents";
import { z } from "zod";

interface AgentConfig {
  name: string;
  instructions: string;
  tools: ReturnType<typeof tool>[];
  model: string;
}

export function createAgent(config: AgentConfig): Agent {
  return new Agent({
    name: config.name,
    instructions: config.instructions,
    tools: config.tools,
    model: config.model,
  });
}

export function createToolWrapper<T>(
  toolFunction: (input: T) => Promise<any>,
  name: string,
  description: string,
  schema?: z.ZodSchema
) {
  return tool({
    name,
    description,
    parameters: schema || z.object({ task: z.unknown() }),
    strict: true,
    execute: async (params: any) => {
      const result = await toolFunction(params.task);
      return JSON.stringify(result, null, 2);
    },
  });
}
