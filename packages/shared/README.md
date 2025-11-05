# @repo/shared

Shared types, schemas, and utilities used across all monorepo packages.

## Exports

### Types

- `AgentType` - Agent type enumeration
- `AgentStatus` - Agent status enumeration
- `AgentSession` - Agent session interface
- `Tool` - Tool interface contract
- `ToolParams` - Tool parameters type helper
- `ToolResult` - Tool result type helper

### Schemas

- `EnvSchema` - Environment variable validation schema
- `ToolParamsSchema` - Tool parameter validation schema
- `ToolResponseSchema` - Tool response validation schema
- `AgentSessionSchema` - Agent session validation schema

### Config

- `parseEnv()` - Parse and validate environment variables
- `validateEnv()` - Validate environment variables

## Usage

```typescript
import { parseEnv, type AgentType, AgentSessionSchema } from "@repo/shared";

// Validate environment
const env = parseEnv(process.env);

// Use types
const agentType: AgentType = "codex";

// Validate session
const session = AgentSessionSchema.parse(sessionData);
```

