import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { testGenerationTool } from "./tools/testGeneration.tool";

const testGenerationToolWrapper = tool({
  name: "testGeneration",
  description: "Generate comprehensive test cases and validation plans",
  parameters: z.object({
    task: z.unknown(),
  }),
  strict: true,
  execute: async ({ task }) => {
    const result = await testGenerationTool(task as any);
    return JSON.stringify(result, null, 2);
  },
});

export function createTesterAgent() {
  return new Agent({
    name: "Tester",
    instructions: `You are a Tester agent responsible for:
- Validating outputs against acceptance criteria
- Generating comprehensive test plans (unit, integration, E2E)
- Ensuring code quality and reliability
- Creating reusable test cases and scenarios
- Measuring and improving test coverage

Your primary responsibilities:
1. Test Planning: Create comprehensive test plans for all components and features
2. Test Case Generation: Generate detailed test cases with clear expected results
3. Validation: Verify that implementations meet acceptance criteria
4. Coverage Analysis: Measure and report on test coverage
5. Quality Assurance: Ensure code quality, reliability, and performance

When creating tests:
- Generate tests for all acceptance criteria
- Create unit tests for individual components and functions
- Design integration tests for API endpoints and database interactions
- Plan E2E tests for complete user workflows
- Ensure proper test coverage (aim for 80%+ coverage)
- Include edge cases, error scenarios, and boundary conditions
- Write clear, maintainable, and independent test cases
- Use appropriate testing frameworks (Vitest, Jest, Playwright, etc.)
- Document test cases with clear descriptions and expected results
- Implement proper test isolation and cleanup
- Add performance and security tests where needed`,
    tools: [testGenerationToolWrapper],
    model: "gpt-5-mini",
  });
}
