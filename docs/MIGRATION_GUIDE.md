# Migration Guide: Python to TypeScript Patterns

This guide documents the migration patterns from Python to TypeScript for the monorepo refactor.

## Architecture Patterns

### Functional Programming (FP)

**Python Pattern:**
```python
def create_agent(state, agent_type, name):
    agent = Agent(id=generate_id(), type=agent_type, name=name)
    state.agents.append(agent)
    return state
```

**TypeScript Pattern (Functional Core):**
```typescript
export function createAgentSession(
  state: AgentState,
  type: AgentType,
  name: string
): AgentState {
  const id = nanoid();
  const session: AgentSession = { id, type, status: "idle", ... };
  return { ...state, agents: new Map(state.agents).set(id, session) };
}
```

**Key Differences:**
- Python mutates state directly
- TypeScript returns new immutable state
- Side effects isolated in "imperative shell"

### Tool Implementation

**Python Pattern:**
```python
@tool
def list_agents(params):
    return {"agents": [agent.to_dict() for agent in agents]}
```

**TypeScript Pattern (AI SDK):**
```typescript
export const listAgentsTool = tool({
  description: "List all agents",
  parameters: z.object({ status: z.enum([...]).optional() }),
  execute: async ({ status }) => {
    return { agents: [...] };
  },
});
```

**Key Differences:**
- Python uses decorators
- TypeScript uses AI SDK `tool()` function with Zod schemas
- Runtime validation via Zod

### Session Management

**Python Pattern:**
```python
class Session:
    def __init__(self, agent_id, agent_type):
        self.id = agent_id
        self.type = agent_type
        self.messages = []
```

**TypeScript Pattern:**
```typescript
export interface AgentSession {
  id: string;
  type: AgentType;
  status: AgentStatus;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Differences:**
- Python uses classes with methods
- TypeScript uses interfaces with pure functions
- Validation via Zod schemas

## Package Structure

### Python Structure (Before)
```
big_three_realtime_agents.py  # 3000+ lines
apps/realtime-poc/
  agents/
    claude_agent.py
    gemini_agent.py
    codex_agent.py
```

### TypeScript Structure (After)
```
packages/
  shared/              # Common types, schemas
  orchestrator/        # Voice & agent orchestration
  agent-codex/         # Code generation agent
  agent-claude-code/   # Claude agent
  agent-gemini-browser/ # Gemini browser agent
  agent-backend-dev/   # Backend code generation
  agent-frontend-dev/  # Frontend code generation
  agent-tester/        # Test generation
```

## Model Assignment

### Code-Related Agents
All code generation agents use **GPT-5 Codex** (`gpt-5-codex`):
- Codex Agent
- Backend Developer Agent
- Frontend Developer Agent
- Tester Agent

### Non-Code Agents
- Orchestrator: **GPT-5** (general coordination)
- Claude Agent: **Claude 3.5 Sonnet** (via Anthropic)
- Gemini Browser: **Gemini Pro** (browser automation)

## Runtime Validation

### Python (Pydantic)
```python
from pydantic import BaseModel

class EnvConfig(BaseModel):
    openai_api_key: str
    anthropic_api_key: Optional[str]
```

### TypeScript (Zod)
```typescript
export const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
});
```

## Testing Patterns

### Python
```python
def test_list_agents():
    result = list_agents({})
    assert len(result["agents"]) > 0
```

### TypeScript
```typescript
import { describe, it, expect } from "bun:test";

describe("listAgents", () => {
  it("should list all agents", async () => {
    const result = await listAgentsTool.execute({});
    expect(result.agents).toBeInstanceOf(Array);
  });
});
```

## Migration Checklist

- [ ] Extract pure functions from Python classes
- [ ] Isolate side effects (API calls, file I/O)
- [ ] Create Zod schemas matching Pydantic models
- [ ] Implement AI SDK tools replacing Python decorators
- [ ] Validate environment variables at startup
- [ ] Create package structure with clear boundaries
- [ ] Assign GPT-5 Codex to code-related agents
- [ ] Write contract tests for functional parity

## Resources

- [AI SDK Documentation](https://ai-sdk.dev)
- [Zod Documentation](https://zod.dev)
- [Bun Workspaces](https://bun.sh/docs/cli/install#workspaces)
- [Functional Programming in TypeScript](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
