import { z } from "zod";
import { AgentType } from "./workflow.types";

// Base artifact metadata
export const ArtifactMetadataSchema = z.object({
  id: z.string(),
  type: z.string(),
  workflowId: z.string(),
  agentType: AgentType.optional(),
  version: z.number().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ArtifactMetadata = z.infer<typeof ArtifactMetadataSchema>;

// Requirement artifact
export const RequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["must-have", "should-have", "nice-to-have"]),
  status: z.enum(["draft", "approved", "rejected"]),
  acceptanceCriteria: z.array(z.string()).default([]),
  relatedTasks: z.array(z.string()).default([]),
  metadata: ArtifactMetadataSchema,
});

export type Requirement = z.infer<typeof RequirementSchema>;

// Agent task artifact
export const AgentTaskSchema = z.object({
  id: z.string(),
  workflowTaskId: z.string(),
  agentType: AgentType,
  description: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "blocked", "failed"]),
  assignedTo: z.array(AgentType),
  dependencies: z.array(z.string()).default([]),
  estimatedDuration: z.number().optional(),
  actualDuration: z.number().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  notes: z.string().optional(),
  metadata: ArtifactMetadataSchema,
});

export type AgentTask = z.infer<typeof AgentTaskSchema>;

// Test plan artifact
export const TestPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  testLevel: z.enum(["unit", "integration", "e2e", "system"]),
  testCases: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      expectedResult: z.string(),
      actualResult: z.string().optional(),
      status: z.enum(["pending", "pass", "fail", "blocked"]),
      priority: z.enum(["low", "medium", "high", "critical"]),
    })
  ),
  coverage: z
    .object({
      total: z.number(),
      covered: z.number(),
      percentage: z.number(),
    })
    .optional(),
  metadata: ArtifactMetadataSchema,
});

export type TestPlan = z.infer<typeof TestPlanSchema>;

// Design specification artifact
export const DesignSpecSchema = z.object({
  id: z.string(),
  componentName: z.string(),
  description: z.string(),
  props: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
        description: z.string().optional(),
        defaultValue: z.string().optional(),
      })
    )
    .default([]),
  states: z.array(z.string()).default([]),
  colorPalette: z
    .object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      neutral: z.string(),
    })
    .optional(),
  typography: z
    .object({
      fontFamily: z.string(),
      fontSize: z.string(),
      fontWeight: z.string(),
    })
    .optional(),
  metadata: ArtifactMetadataSchema,
});

export type DesignSpec = z.infer<typeof DesignSpecSchema>;

// Artifact type union
export type Artifact = Requirement | AgentTask | TestPlan | DesignSpec;

// Artifact export formats
export const ArtifactExportFormat = z.enum(["markdown", "json", "html"]);

export type ArtifactExportFormat = z.infer<typeof ArtifactExportFormat>;
