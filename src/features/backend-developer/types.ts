import { z } from "zod";
import { AgentType } from "../shared/types/workflow.types";

// Backend task
export const BackendTaskSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  requirements: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["pending", "in_progress", "review", "completed", "failed"]),
  assignedTo: z.array(AgentType),
  dependencies: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export type BackendTask = z.infer<typeof BackendTaskSchema>;

// API spec
export const APISpecSchema = z.object({
  id: z.string(),
  endpoint: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  description: z.string(),
  parameters: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
        location: z.enum(["path", "query", "body", "header"]),
        description: z.string().optional(),
      })
    )
    .default([]),
  requestBody: z
    .object({
      type: z.string(),
      schema: z.any().optional(),
    })
    .optional(),
  responses: z
    .array(
      z.object({
        statusCode: z.number(),
        description: z.string(),
        schema: z.any().optional(),
      })
    )
    .default([]),
  authentication: z
    .enum(["none", "bearer", "api_key", "oauth"])
    .default("none"),
});

export type APISpec = z.infer<typeof APISpecSchema>;

// Endpoint definition
export const EndpointDefinitionSchema = z.object({
  path: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  handler: z.string(), // Function name
  middleware: z.array(z.string()).default([]),
  validation: z
    .object({
      requestBody: z.any().optional(),
      queryParams: z.any().optional(),
      pathParams: z.any().optional(),
    })
    .optional(),
});

export type EndpointDefinition = z.infer<typeof EndpointDefinitionSchema>;

// Database schema
export const DatabaseSchemaSchema = z.object({
  id: z.string(),
  tableName: z.string(),
  columns: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      nullable: z.boolean().default(false),
      primaryKey: z.boolean().default(false),
      foreignKey: z
        .object({
          table: z.string(),
          column: z.string(),
        })
        .optional(),
      unique: z.boolean().default(false),
      default: z.string().optional(),
    })
  ),
  indexes: z
    .array(
      z.object({
        name: z.string(),
        columns: z.array(z.string()),
        unique: z.boolean().default(false),
      })
    )
    .default([]),
});

export type DatabaseSchema = z.infer<typeof DatabaseSchemaSchema>;

// Backend artifact
export const BackendArtifactSchema = z.object({
  id: z.string(),
  workflowTaskId: z.string(),
  apis: z.array(APISpecSchema).default([]),
  endpoints: z.array(EndpointDefinitionSchema).default([]),
  databaseSchemas: z.array(DatabaseSchemaSchema).default([]),
  code: z
    .array(
      z.object({
        id: z.string(),
        fileName: z.string(),
        filePath: z.string(),
        code: z.string(),
        language: z
          .enum(["typescript", "javascript", "python"])
          .default("typescript"),
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

export type BackendArtifact = z.infer<typeof BackendArtifactSchema>;
