/**
 * Unit tests for shared package schemas
 */

import { describe, it, expect } from "vitest";
import { EnvSchema } from "../schemas/env.js";
import { ToolParamsSchema, ToolResponseSchema } from "../schemas/tools.js";
import { AgentSessionSchema } from "../schemas/session.js";

describe("EnvSchema", () => {
  it("should validate required environment variables", () => {
    const valid = {
      OPENAI_API_KEY: "test-key",
    };
    const result = EnvSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid environment variables", () => {
    const invalid = {};
    const result = EnvSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("ToolParamsSchema", () => {
  it("should validate tool parameters", () => {
    const valid = {
      agentId: "test-agent",
    };
    const result = ToolParamsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should allow additional fields", () => {
    const valid = {
      agentId: "test-agent",
      customField: "value",
    };
    const result = ToolParamsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe("ToolResponseSchema", () => {
  it("should validate tool response", () => {
    const valid = {
      success: true,
      data: {},
    };
    const result = ToolResponseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate error response", () => {
    const valid = {
      success: false,
      error: "Error message",
    };
    const result = ToolResponseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe("AgentSessionSchema", () => {
  it("should validate agent session", () => {
    const valid = {
      id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
      type: "codex",
      status: "idle",
      messages: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = AgentSessionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate session with messages", () => {
    const valid = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "codex",
      status: "active",
      messages: [
        {
          role: "user" as const,
          content: "Test message",
          timestamp: new Date(),
        },
      ],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = AgentSessionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

