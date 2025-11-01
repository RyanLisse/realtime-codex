import { z } from "zod";
import { AgentType } from "../shared/types/workflow.types";

// Frontend task
export const FrontendTaskSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  designSpec: z.any().optional(), // DesignArtifact
  requirements: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["pending", "in_progress", "review", "completed", "failed"]),
  assignedTo: z.array(AgentType),
  dependencies: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export type FrontendTask = z.infer<typeof FrontendTaskSchema>;

// Component code
export const ComponentCodeSchema = z.object({
  id: z.string(),
  componentName: z.string(),
  filePath: z.string(),
  code: z.string(),
  language: z.enum(["typescript", "javascript", "tsx", "jsx"]).default("tsx"),
  imports: z
    .array(
      z.object({
        module: z.string(),
        named: z.array(z.string()).default([]),
        default: z.string().optional(),
      })
    )
    .default([]),
  exports: z
    .array(
      z.object({
        type: z.enum(["default", "named"]),
        name: z.string(),
      })
    )
    .default([]),
  dependencies: z.array(z.string()).default([]),
  metadata: z.object({
    workflowId: z.string(),
    agentType: AgentType,
    version: z.number().default(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export type ComponentCode = z.infer<typeof ComponentCodeSchema>;

// Frontend artifact
export const FrontendArtifactSchema = z.object({
  id: z.string(),
  workflowTaskId: z.string(),
  components: z.array(ComponentCodeSchema).default([]),
  stylesheets: z
    .array(
      z.object({
        id: z.string(),
        type: z.enum(["css", "scss", "styled-components", "tailwind"]),
        content: z.string(),
      })
    )
    .default([]),
  tests: z
    .array(
      z.object({
        id: z.string(),
        componentName: z.string(),
        testCode: z.string(),
        coverage: z.number().optional(),
      })
    )
    .default([]),
  metadata: z.object({
    workflowId: z.string(),
    agentType: AgentType,
    version: z.number().default(1),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

export type FrontendArtifact = z.infer<typeof FrontendArtifactSchema>;
