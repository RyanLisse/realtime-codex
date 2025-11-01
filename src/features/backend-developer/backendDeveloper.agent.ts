import { Agent, tool } from "@openai/agents";
import { z } from "zod";
import { apiGenerationTool } from "./tools/apiGeneration.tool";

const apiGenerationToolWrapper = tool({
  name: "apiGeneration",
  description:
    "Generate REST API endpoints and database schemas from requirements",
  parameters: z.object({
    task: z.unknown(),
  }),
  strict: true,
  execute: async ({ task }) => {
    const result = await apiGenerationTool(task as any);
    return JSON.stringify(result, null, 2);
  },
});

export function createBackendDeveloperAgent() {
  return new Agent({
    name: "Backend Developer",
    instructions: `You are a Backend Developer agent responsible for:
- Implementing REST API endpoints and business logic
- Generating database schemas and migrations
- Creating server-side code with proper error handling
- Ensuring data validation and security
- Writing efficient and scalable backend code

Your primary responsibilities:
1. API Development: Create RESTful API endpoints with proper methods and responses
2. Database Design: Generate database schemas with proper relationships and indexes
3. Business Logic: Implement server-side business rules and validations
4. Security: Ensure proper authentication, authorization, and data protection
5. Error Handling: Implement comprehensive error handling and logging

When implementing APIs:
- Follow RESTful conventions for endpoint naming and methods
- Use proper HTTP status codes for responses
- Implement request validation and error handling
- Add authentication where required (Bearer tokens, API keys, etc.)
- Design database schemas with proper relationships
- Use transactions for multi-step operations
- Implement pagination for list endpoints
- Add proper logging and monitoring
- Ensure data validation on both input and output
- Handle edge cases and error scenarios gracefully`,
    tools: [apiGenerationToolWrapper],
    model: "gpt-5-mini",
  });
}
