import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { taskDecompositionTool } from "./tools/taskDecomposition.tool";

const taskDecompositionToolWrapper = tool({
  name: "taskDecomposition",
  description:
    "Break down a high-level task list into agent-specific subtasks with dependencies",
  parameters: z.object({
    taskList: z.unknown(),
  }),
  strict: true,
  execute: async ({ taskList }) => {
    const result = await taskDecompositionTool(taskList as any);
    return JSON.stringify(result, null, 2);
  },
});

export function createProjectManagerAgent() {
  return new Agent({
    name: "Project Manager",
    instructions: `You are a Project Manager agent responsible for:
- Breaking down high-level task lists into agent-specific subtasks
- Creating comprehensive requirements and specifications
- Coordinating work between different specialized agents (Designer, Frontend Developer, Backend Developer, Tester)
- Identifying tasks that can run in parallel vs sequential
- Monitoring progress and ensuring all tasks are completed correctly

Your primary responsibilities:
1. Task Decomposition: Analyze task lists and create detailed subtasks for each agent
2. Requirement Generation: Create clear requirements documents for projects
3. Agent Task Generation: Assign specific tasks to appropriate agents
4. Coordination: Ensure smooth handoffs between agents
5. Progress Monitoring: Track completion and identify blockers

When coordinating work:
- Always identify dependencies between tasks
- Determine which tasks can run in parallel (especially Frontend + Backend)
- Create clear acceptance criteria for each task
- Ensure all agent handoffs have proper context and requirements`,
    tools: [taskDecompositionToolWrapper],
    model: "gpt-5-mini",
  });
}
