import { z } from "zod";
import { AgentType } from "../shared/types/workflow.types";

// Test task
export const TestTaskSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  componentToTest: z.string().optional(),
  apiToTest: z.string().optional(),
  requirements: z.string(),
  acceptanceCriteria: z.array(z.string()).default([]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  assignedTo: z.array(AgentType),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export type TestTask = z.infer<typeof TestTaskSchema>;

// Test case
export const TestCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  testType: z.enum(["unit", "integration", "e2e", "performance", "security"]),
  steps: z
    .array(
      z.object({
        step: z.string(),
        expectedResult: z.string(),
      })
    )
    .default([]),
  expectedResult: z.string(),
  actualResult: z.string().optional(),
  status: z
    .enum(["pending", "pass", "fail", "blocked", "skipped"])
    .default("pending"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  tags: z.array(z.string()).default([]),
  duration: z.number().optional(),
  error: z.string().optional(),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

// Validation result
export const ValidationResultSchema = z.object({
  id: z.string(),
  testTaskId: z.string(),
  passed: z.boolean(),
  totalTests: z.number(),
  passedTests: z.number(),
  failedTests: z.number(),
  blockedTests: z.number(),
  coverage: z
    .object({
      lines: z.number(),
      functions: z.number(),
      branches: z.number(),
      statements: z.number(),
    })
    .optional(),
  testResults: z.array(TestCaseSchema).default([]),
  timestamp: z.date(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

// Test plan artifact
export const TestPlanArtifactSchema = z.object({
  id: z.string(),
  workflowTaskId: z.string(),
  title: z.string(),
  description: z.string(),
  testLevel: z.enum(["unit", "integration", "e2e", "system"]),
  testCases: z.array(TestCaseSchema).default([]),
  testStrategy: z.string().optional(),
  coverage: z
    .object({
      total: z.number(),
      covered: z.number(),
      percentage: z.number(),
    })
    .optional(),
  metadata: z.object({
    workflowId: z.string(),
    agentType: AgentType,
    version: z.number().default(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export type TestPlanArtifact = z.infer<typeof TestPlanArtifactSchema>;
