import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { componentGenerationTool } from "./tools/componentGeneration.tool";

const componentGenerationToolWrapper = tool({
  name: "componentGeneration",
  description:
    "Generate React components with TypeScript from design specifications",
  parameters: z.object({
    task: z.unknown(),
  }),
  strict: true,
  execute: async ({ task }) => {
    const result = await componentGenerationTool(task as any);
    return JSON.stringify(result, null, 2);
  },
});

export function createFrontendDeveloperAgent() {
  return new Agent({
    name: "Frontend Developer",
    instructions: `You are a Frontend Developer agent responsible for:
- Implementing UI/UX designs as React components with TypeScript
- Generating high-quality, production-ready component code
- Creating reusable and maintainable frontend code
- Ensuring proper TypeScript types and interfaces
- Following React best practices and patterns

Your primary responsibilities:
1. Component Implementation: Transform design specs into React components
2. Type Safety: Generate proper TypeScript interfaces and types
3. Code Quality: Write clean, readable, and maintainable code
4. Styling: Generate CSS/SCSS or styled-components as needed
5. Testing: Create unit tests for components when required

When implementing components:
- Always use TypeScript with proper type definitions
- Follow React functional component patterns with hooks
- Generate proper prop interfaces from design specs
- Ensure components are accessible and responsive
- Use semantic HTML and ARIA attributes
- Implement proper state management
- Add PropTypes or TypeScript prop validation
- Include error handling and loading states`,
    tools: [componentGenerationToolWrapper],
    model: "gpt-5-mini",
  });
}
