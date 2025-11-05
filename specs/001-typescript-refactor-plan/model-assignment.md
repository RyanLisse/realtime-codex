# Model Assignment Strategy: GPT-5 Codex for Code Agents

**Date**: 2025-01-15  
**Feature**: TypeScript Monorepo Refactor

## Model Selection Criteria

### GPT-5 Codex (`gpt-5-codex`)
**Use for**: All agents that primarily generate, modify, or debug code

**Rationale**:
- Specialized model optimized for code generation tasks
- Superior performance on coding benchmarks
- Better understanding of codebase structure and dependencies
- Enhanced debugging capabilities for larger repositories
- 97% tool calling accuracy for reliable file operations

### GPT-5 General (`gpt-5`)
**Use for**: Orchestration, coordination, planning, and non-code tasks

**Rationale**:
- Unified system with smart router (fast responses vs deep reasoning)
- Better suited for general coordination and planning
- Cost-effective for non-code generation tasks

## Agent-to-Model Mapping

### Code Generation Agents → GPT-5 Codex

| Agent | Primary Responsibility | Model | Rationale |
|-------|------------------------|-------|-----------|
| **Codex Agent** | Code generation, file operations, refactoring | `gpt-5-codex` | Primary code generation agent |
| **Backend Developer Agent** | API endpoints, database schemas, server code | `gpt-5-codex` | Generates backend code |
| **Frontend Developer Agent** | React components, TypeScript, UI code | `gpt-5-codex` | Generates frontend code |
| **Tester Agent** | Test code generation (unit, integration, E2E) | `gpt-5-codex` | Generates test code |

### Non-Code Agents → GPT-5 General

| Agent | Primary Responsibility | Model | Rationale |
|-------|------------------------|-------|-----------|
| **Project Manager Agent** | Task decomposition, coordination, planning | `gpt-5` | Coordination/planning, not code generation |
| **Designer Agent** | Design specs, wireframes, color palettes | `gpt-5` | Design artifacts, not code |
| **Orchestrator** | Agent coordination, tool routing | `gpt-5` | General orchestration |
| **Voice Orchestrator** | Voice interaction, realtime coordination | `gpt-5-realtime` or `gpt-realtime` | Voice-specific features |

## Implementation Examples

### Code Generation Agent (GPT-5 Codex)
```typescript
import { Experimental_Agent as Agent, tool } from 'ai';
import { openai } from '@ai-sdk/openai';

const frontendAgent = new Agent({
  model: openai('gpt-5-codex'), // Specialized code generation
  tools: {
    generateComponent: tool({ /* ... */ }),
    // ...
  },
});
```

### Coordination Agent (GPT-5 General)
```typescript
import { Experimental_Agent as Agent, tool } from 'ai';
import { openai } from '@ai-sdk/openai';

const projectManagerAgent = new Agent({
  model: openai('gpt-5'), // General purpose with router
  tools: {
    decomposeTask: tool({ /* ... */ }),
    // ...
  },
});
```

## Migration from Current Codebase

**Current State** (realtime-codex):
- Frontend Developer: `gpt-5-mini` → **Migrate to `gpt-5-codex`**
- Backend Developer: `gpt-5-mini` → **Migrate to `gpt-5-codex`**
- Tester: `gpt-5-mini` → **Migrate to `gpt-5-codex`**
- Project Manager: `gpt-5-mini` → **Migrate to `gpt-5`** (coordination, not code)

**Migration Steps**:
1. Identify all code-generating agents in both repositories
2. Update model assignments: code agents → `gpt-5-codex`
3. Update non-code agents → `gpt-5` (or appropriate variant)
4. Test tool calling accuracy improvements (97% expected)
5. Validate code generation quality improvements

## Performance Expectations

With GPT-5 Codex for code agents:
- **Enhanced code quality**: Better understanding of code patterns
- **Better debugging**: Improved ability to debug larger codebases
- **Tool reliability**: 97% accuracy on file operations
- **Context handling**: 400K context window for larger refactorings
- **Code comprehension**: Better understanding of dependencies and structure

## Fallback Strategy

If `gpt-5-codex` is not available:
1. Fallback to `gpt-5` for code generation
2. Monitor code quality metrics
3. Consider alternative specialized models if available
4. Document any quality differences



