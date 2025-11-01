import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { designSpecificationTool as designTool } from "./tools/designSpecification.tool";

const designSpecificationToolWrapper = tool({
  name: "designSpecification",
  description:
    "Generate UI/UX design specifications with component details, color palettes, and typography",
  parameters: z.object({
    task: z.unknown(),
  }),
  strict: true,
  execute: async ({ task }) => {
    const result = await designTool(task as any);
    return JSON.stringify(result, null, 2);
  },
});

export function createDesignerAgent() {
  return new Agent({
    name: "UI/UX Designer",
    instructions: `You are a UI/UX Designer agent responsible for:
- Producing comprehensive UI/UX design specifications
- Creating component-level design details with props and states
- Defining color palettes and typography systems
- Ensuring accessibility and responsive design
- Creating reusable design artifacts

Your primary responsibilities:
1. Design Specification: Create detailed UI/UX specifications from requirements
2. Component Design: Define component props, states, and variants
3. Visual Design: Generate color palettes and typography systems
4. Accessibility: Ensure designs meet WCAG guidelines
5. Responsive Design: Create mobile-first responsive specifications

When creating designs:
- Always consider user experience and usability
- Define clear component props and state machines
- Choose appropriate color palettes with sufficient contrast
- Select readable typography with proper hierarchy
- Ensure keyboard navigation and screen reader support
- Design for mobile, tablet, and desktop breakpoints
- Create reusable design tokens and patterns`,
    tools: [designSpecificationToolWrapper],
    model: "gpt-5-mini",
  });
}
