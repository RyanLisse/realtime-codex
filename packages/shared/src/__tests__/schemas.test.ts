/**
 * Unit tests for shared package schemas
 */

import { describe, expect, it } from "bun:test";
import { parseEnv } from "../schemas/env.js";
import { AgentSessionSchema } from "../schemas/session.js";
import { ToolParamsSchema } from "../schemas/tools.js";

describe("EnvSchema", () => {
  it("should validate required OPENAI_API_KEY", () => {
    const validEnv = {
      OPENAI_API_KEY: "sk-test-key",
      NODE_ENV: "development",
    };
    const result = parseEnv(validEnv);
    expect(result.OPENAI_API_KEY).toBe("sk-test-key");
  });

  it("should reject missing OPENAI_API_KEY", () => {
    const invalidEnv = {
      NODE_ENV: "development",
    };
    expect(() => parseEnv(invalidEnv)).toThrow();
  });

  it("should accept optional ANTHROPIC_API_KEY", () => {
    const env = {
      OPENAI_API_KEY: "sk-test",
      ANTHROPIC_API_KEY: "sk-ant-test",
      NODE_ENV: "development",
    };
    const result = parseEnv(env);
    expect(result.ANTHROPIC_API_KEY).toBe("sk-ant-test");
  });
});

describe("ToolParamsSchema", () => {
  it("should validate tool parameters", () => {
    const params = {
      agentId: "agent-123",
      sessionId: "session-456",
    };
    const result = ToolParamsSchema.parse(params);
    expect(result.agentId).toBe("agent-123");
  });

  it("should allow additional fields", () => {
    const params = {
      agentId: "agent-123",
      customField: "value",
    };
    const result = ToolParamsSchema.parse(params);
    expect(result.customField).toBe("value");
  });
});

describe("AgentSessionSchema", () => {
  it("should validate agent session", () => {
    const session = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      type: "codex",
      status: "idle",
      messages: [],
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = AgentSessionSchema.parse(session);
    expect(result.id).toBe(session.id);
    expect(result.type).toBe("codex");
  });
});
