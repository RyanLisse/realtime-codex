# Research: TypeScript Refactoring Plan

**Date**: 2025-01-15  
**Feature**: TypeScript Refactoring Plan  
**Purpose**: Consolidate research findings for migration strategies from Python to TypeScript

## Research Decisions

### 1. Bun Monorepo Architecture

**Decision**: Use Bun as the primary runtime with workspace-based monorepo structure

**Rationale**:
- Bun provides exceptional performance (fastest JavaScript runtime)
- Native TypeScript support without compilation step
- Built-in workspace support via package.json workspaces
- Excellent developer ergonomics (single tool: bun install, bun test, bun run)
- ESM-first, compatible with modern TypeScript patterns
- Superior for CLI tools and agent orchestration (low latency, fast startup)

**Monorepo Structure**:
- Root package.json with `"workspaces": ["packages/*"]`
- Each package is ESM module (`"type": "module"`)
- Workspace dependencies: `"@repo/shared": "workspace:*"`
- Bun automatically hoists and links packages

**Package Organization**:
- `packages/shared`: Common types, Zod schemas, tool interfaces
- `packages/orchestrator`: Voice orchestrator (main coordination logic)
- `packages/agent-claude-code`: Claude agent implementation
- `packages/agent-gemini-browser`: Gemini browser agent
- `packages/agent-codex`: Codex agent implementation
- `packages/orchestrator-cli`: CLI entrypoint

**Sources**:
- Bun documentation: https://bun.sh/docs
- Bun workspaces: https://bun.sh/docs/cli/install#workspaces

---

### 2. Functional Programming Architecture

**Decision**: Apply functional programming principles with "functional core, imperative shell" pattern

**Rationale**:
- Improves testability (pure functions are easily testable)
- Reduces bugs (immutability prevents accidental state mutations)
- Enhances composability (functions compose naturally)
- Isolates side effects (API calls, file I/O at boundaries only)
- Matches modern TypeScript best practices

**Key Principles**:
- **Pure Functions**: Business logic in pure functions (no side effects)
- **Immutability**: No mutations, return new objects instead
- **Side Effect Isolation**: API calls, file I/O isolated to thin wrapper functions
- **Function Composition**: Use closures, map/reduce, optional FP libraries (fp-ts, Ramda)

**Implementation Pattern**:
```typescript
// Functional core (pure)
function createAgent(state: AgentState, type: AgentType, name: string): AgentState {
  const newAgent = { id: generateId(), type, name, status: 'active' };
  return { ...state, agents: [...state.agents, newAgent] };
}

// Imperative shell (side effects isolated)
async function createAgentWithSDK(state: AgentState, type: AgentType, name: string): Promise<AgentState> {
  // Side effect: API call
  await initializeAgentSDK(type, name);
  // Pure function call
  return createAgent(state, type, name);
}
```

**Alternatives Considered**:
- **Object-Oriented**: Would mix state and behavior, harder to test
- **Procedural**: Would scatter side effects throughout codebase

---

### 3. Strict TypeScript + Zod Runtime Validation

**Decision**: Use strict TypeScript (strict mode, noImplicitAny, noUncheckedIndexedAccess) + Zod for runtime validation

**Rationale**:
- TypeScript provides compile-time safety
- Zod provides runtime safety (validates external data, API responses, env vars)
- Parse/Either pattern catches errors early
- Validates data at package boundaries
- Prevents runtime type errors from external sources

**TypeScript Configuration**:
```json
{
  "strict": true,
  "noImplicitAny": true,
  "noUncheckedIndexedAccess": true,
  "module": "ESNext",
  "target": "ES2023"
}
```

**Zod Usage Patterns**:
- Environment variables: `EnvSchema.parse(process.env)` at startup
- API responses: `ApiResponseSchema.parse(response)` after fetch
- Tool parameters: `ToolParamsSchema.parse(params)` before handler
- File data: `RegistrySchema.parse(jsonContent)` when reading files

**Sources**:
- Zod documentation: https://zod.dev
- TypeScript strict mode: https://www.typescriptlang.org/tsconfig#strict

---

### 4. Vercel AI SDK for Agent Orchestration

**Decision**: Use Vercel AI SDK (`ai` package) as the primary agent framework

**Rationale**:
- Unified interface for multiple LLM providers (OpenAI, Anthropic, etc.)
- Built-in Agent class handles LLM loops, context management, stopping conditions
- Native tool calling with Zod schema validation
- Reduces boilerplate (manages loops, message arrays automatically)
- Streaming support with `streamText`
- TypeScript-first with excellent type safety
- Bun-compatible

**Key Components**:
- `Agent` class: Handles LLM + tools + loop orchestration
- `tool()` function: Define tools with Zod schemas
- `streamText()`: Streaming text generation
- Providers: `@ai-sdk/openai`, `@ai-sdk/anthropic` (if available)

**Usage Pattern**:
```typescript
import { Experimental_Agent as Agent, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const agent = new Agent({
  model: openai('gpt-5'), // Use GPT-5 for enhanced capabilities
  tools: {
    createAgent: tool({
      description: 'Create a new agent',
      inputSchema: z.object({
        type: z.enum(['claude', 'gemini', 'codex']),
        name: z.string(),
      }),
      execute: async ({ type, name }) => {
        // Pure function implementation
        return { id: generateId(), type, name };
      },
    }),
  },
  stopWhen: stepCountIs(20),
});
```

**GPT-5 Model Capabilities (2025)**:
- **Enhanced Tool Calling**: 97% accuracy on tool calling tasks (significant improvement over previous models)
- **Large Context Window**: 400K tokens (double GPT-4's 200K, enables working with larger codebases)
- **Unified System**: Smart router automatically selects between fast responses and deep reasoning models
- **Improved Coding**: 74.9% on coding benchmarks, excels at front-end generation and debugging larger codebases
- **Reduced Hallucinations**: ~45% reduction in factual errors
- **Better Code Generation**: Can generate responsive websites, apps, games with minimal prompting
- **Design Understanding**: Demonstrates understanding of design aesthetics in code generation

**Model Selection Strategy**:
- `gpt-5-codex`: Specialized code generation model for all code-related agents (primary for code tasks)
- `gpt-5`: General purpose, unified system with router (orchestrator, coordination)
- `gpt-5-pro`: Extended reasoning capabilities for complex tasks
- `gpt-5-mini`: Faster, cost-effective for simpler operations
- `gpt-realtime` or `gpt-5-realtime`: Voice/interactive features via Realtime API

**Migration Pattern**:
- Python tool loop → AI SDK Agent with tools
- Python message handling → AI SDK context management
- Python custom routing → AI SDK tool orchestration (enhanced by GPT-5's 97% tool accuracy)
- Manual tool calling → AI SDK automatic tool selection and execution
- Leverage GPT-5's 400K context window for larger codebases and conversations

**Sources**:
- AI SDK documentation: https://ai-sdk.dev/docs/agents/overview
- AI SDK getting started: https://ai-sdk.dev/docs/getting-started/nextjs-app-router
- GPT-5 Announcement: https://openai.com/index/introducing-gpt-5

---

### 5. Anthropic Claude Agent via AI SDK

**Decision**: Use AI SDK with Anthropic provider (or @anthropic-ai/sdk directly if AI SDK provider not available)

**Rationale**:
- AI SDK provides unified interface across providers
- If @ai-sdk/anthropic exists, use it for consistency
- Otherwise, @anthropic-ai/sdk can be wrapped to match AI SDK patterns
- Maintains consistency with other agents using AI SDK

**Migration Pattern**:
```typescript
// Option 1: AI SDK with Anthropic provider (if available)
import { Experimental_Agent as Agent } from 'ai';
import { anthropic } from '@ai-sdk/anthropic'; // If exists

const claudeAgent = new Agent({
  model: anthropic('claude-3-5-sonnet-20241022'), // Use latest Claude model
  tools: { /* ... */ },
});

// Option 2: Wrap @anthropic-ai/sdk to match AI SDK Agent pattern
// (Create custom provider or use direct SDK)
```

**Note**: For code generation tasks, use GPT-5 Codex (`gpt-5-codex`) as primary for all code-related agents. Claude remains alternative for specialized reasoning tasks that aren't primarily code-focused.

**Key Features**:
- Streaming support via AI SDK
- Tool calling with Zod validation
- Consistent API with other agents
- Built-in type definitions

**Sources**:
- AI SDK Anthropic provider: https://ai-sdk.dev/docs/providers (check if available)
- Anthropic SDK: https://github.com/anthropics/anthropic-sdk-typescript

---

### 6. Google Gemini SDK Migration

**Decision**: Use @google/genai for Gemini browser agent (may need custom AI SDK integration if provider not available)

**Rationale**:
- Official Google SDK for Node.js
- Supports Gemini Text, Vision, and Computer Use models
- TypeScript support with built-in types
- Can integrate with Playwright/Puppeteer for browser control

**Implementation Pattern**:
- Planning: Pure function using Gemini to decide actions
- Execution: Side effect isolation (Playwright calls in separate function)
- Schema validation: Zod schemas for element selectors, URLs, commands

**Migration Pattern**:
```typescript
import { GoogleGenerativeAI } from '@google/genai';
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Computer Use or Vision model
const model = client.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
const result = await model.generateContent(prompt);
```

**Browser Integration**:
- Gemini for vision/planning (what to do)
- Playwright for execution (how to do it)
- Separation keeps planning pure, execution isolated

**Sources**:
- Google GenAI SDK: https://github.com/google/generative-ai-node

---

### 7. Codex Agent via AI SDK

**Decision**: Use AI SDK Agent with OpenAI provider and GPT-5 Codex (`gpt-5-codex`) for all code-related agents

**Rationale**:
- Unified interface with other agents
- Native tool calling for file operations
- Streaming support for code generation
- Consistent with orchestrator using AI SDK
- GPT-5 Codex is specialized for code generation tasks
- GPT-5 Codex offers superior coding capabilities optimized for code tasks

**Implementation Pattern**:
```typescript
import { Experimental_Agent as Agent, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { readFile, writeFile } from 'fs/promises';

const codexAgent = new Agent({
  model: openai('gpt-5-codex'), // Specialized code generation model
  tools: {
    readFile: tool({
      description: 'Read a code file',
      inputSchema: z.object({
        path: z.string().describe('File path to read'),
      }),
      execute: async ({ path }) => {
        const content = await readFile(path, 'utf-8');
        return { content };
      },
    }),
    writeFile: tool({
      description: 'Write code to a file',
      inputSchema: z.object({
        path: z.string(),
        content: z.string(),
      }),
      execute: async ({ path, content }) => {
        await writeFile(path, content, 'utf-8');
        return { success: true };
      },
    }),
  },
});
```

**GPT-5 Codex Advantages for Code-Related Agents**:
- **Specialized for Code**: Optimized specifically for code generation, debugging, and refactoring
- **Enhanced Coding**: Superior performance on coding benchmarks, excels at debugging larger codebases
- **Front-end Generation**: Can create responsive websites, apps, games with minimal prompting
- **Tool Accuracy**: 97% accuracy on tool calling tasks (critical for file operations)
- **Large Context**: 400K context window enables working with larger codebases in single conversation
- **Design Understanding**: Demonstrates understanding of design aesthetics in code generation
- **Better Debugging**: Improved ability to debug complex applications and larger repositories
- **Code Understanding**: Better comprehension of codebase structure and dependencies

**Code-Related Agents Using GPT-5 Codex**:
- **Codex agent**: Primary code generation, file operations, refactoring
- **Backend developer agent**: API endpoints, database schemas, server-side code
- **Frontend developer agent**: React components, TypeScript interfaces, UI code
- **Tester agent**: Test code generation (unit tests, integration tests, E2E tests)
- Any agent primarily focused on generating, modifying, or debugging code

**Non-Code Agents** (use GPT-5 general):
- **Project Manager agent**: Coordination, task decomposition (planning/orchestration)
- **Designer agent**: Design specs, wireframes, color palettes (non-code artifacts)

**File Operations**:
- Read/write code files as AI SDK tools (Zod validated)
- Sandboxed manner (validate paths, avoid directory traversal)
- All file operations are tools, enabling agent to use them in loops
- Leverage 400K context window for larger file operations

**Sources**:
- AI SDK OpenAI provider: https://ai-sdk.dev/docs/providers/openai
- GPT-5 Announcement: https://openai.com/index/introducing-gpt-5

---

### 8. Breaking Down Monolithic Python Orchestrator

**Decision**: Refactor 3000+ line Python file into modular TypeScript packages

**Rationale**:
- Original project notes: "break up large single agent" for maintainability
- Modular structure enables independent testing and versioning
- FP principles require small, focused functions
- Package isolation prevents coupling

**Decomposition Strategy**:
1. Extract tool functions → `packages/orchestrator/src/tools/` (one file per tool)
2. Extract agent management → `packages/orchestrator/src/AgentManager.ts`
3. Extract voice orchestrator logic → `packages/orchestrator/src/VoiceOrchestrator.ts`
4. Move agent implementations → separate packages (agent-claude-code, etc.)
5. Extract shared types → `packages/shared/src/types/`
6. Extract schemas → `packages/shared/src/schemas/`

**File Size Discipline**:
- Each module <300 lines (target), max 500 lines
- Pure functions: typically 10-50 lines each
- Tool handlers: one file per tool (50-100 lines)
- Main orchestrator: composition of small functions

---

### 9. Hono Framework for Backend Migration (Updated - Optional)

**Note**: Original plan included Hono, but monorepo refactor focuses on agent orchestration rather than traditional backend API. Hono may still be needed if exposing HTTP endpoints, but primary focus is on orchestrator/agent packages.

**Decision**: Hono framework available if backend HTTP API needed

**Rationale**:
- Fast, TypeScript-first
- Bun-compatible
- Similar patterns to FastAPI
- Can be added as separate package if needed

**Migration Patterns**:
- FastAPI routes → Hono route handlers
- FastAPI middleware → Hono middleware chains
- FastAPI WebSocket → Hono WebSocket (or use native WebSocket for agents)

**Sources**:
- Hono official documentation: https://hono.dev

---

### 10. OpenAI Realtime API for Voice Agent

**Decision**: Use openai-realtime-api with GPT-5 Realtime for voice-specific features, while using AI SDK for other agent interactions

**Rationale**:
- Realtime API has specific voice/audio features not covered by standard AI SDK
- GPT-5 Realtime provides enhanced voice capabilities with improved tool calling
- Can be used alongside AI SDK for voice orchestrator
- AI SDK handles standard LLM interactions, RealtimeClient handles voice-specific features

**GPT-5 Realtime Features**:
- Enhanced tool calling accuracy (97%) for voice-activated tools
- Better understanding of voice commands and intent
- Improved real-time response quality
- Lower latency with unified router system

**Migration Pattern**:
- Python WebSocket voice server → RealtimeClient with `gpt-realtime` or `gpt-5-realtime` model
- Standard agent interactions → AI SDK Agent class with GPT-5 models
- Hybrid approach: RealtimeClient for voice, AI SDK for tool orchestration
- Leverage GPT-5's tool calling accuracy for voice-activated tool execution

**Model Selection**:
- `gpt-realtime`: Standard realtime model
- `gpt-5-realtime`: Enhanced GPT-5 realtime model (if available in 2025)

**Sources**:
- openai-realtime-api: https://github.com/transitive-bullshit/openai-realtime-api
- GPT-5 Announcement: https://openai.com/index/introducing-gpt-5

---

### 11. Bun-First with Runtime Compatibility

**Decision**: Primary runtime is Bun, but use Web Standard APIs for runtime compatibility where needed

**Rationale**:
- Bun is primary runtime (best performance, native TS)
- Use Web Standards (fetch, WebSocket, FileSystem API) for compatibility
- Most code runs in Bun; compatibility layer only where necessary
- Leverages Bun's speed for CLI tools and agent orchestration

**Key APIs**:
- File System: Bun.file() or Node fs/promises (both work in Bun)
- HTTP: fetch (Web Standard, works everywhere)
- WebSocket: Bun-native or Web Standard
- Environment: Bun.env or process.env (Bun supports both)
- Streams: Web Streams API where possible

---

### 12. Complete Rewrite Strategy

**Decision**: Complete rewrite approach (all components in one phase)

**Rationale**:
- Clean slate avoids technical debt from hybrid approaches
- Consistent type system throughout codebase
- No interoperability complexity between Python and TypeScript
- Enables modern patterns from the start

**Best Practices for Complete Rewrite**:
- **Validation Checkpoints**: Automated tests at each component boundary
- **Parallel Development**: Build TypeScript version alongside Python (when possible)
- **Feature Parity Testing**: Comprehensive test suite mapping Python → TypeScript
- **Incremental Validation**: Validate each component category before proceeding
- **Rollback Plan**: Keep Python version running until TypeScript version validated

**Risk Mitigation Strategies**:
- **Comprehensive Testing**: Unit tests for each migrated component
- **Integration Testing**: End-to-end tests for complete workflows
- **Performance Benchmarking**: Compare Python vs TypeScript performance
- **Staged Rollout**: Deploy TypeScript version with feature flags
- **Monitoring**: Extensive logging and observability during transition

**Testing Strategy**:
- **Contract Testing**: Verify API contracts match between versions
- **Behavioral Testing**: Ensure business logic produces identical results
- **Load Testing**: Validate performance meets or exceeds Python version
- **Regression Testing**: Ensure no features lost in translation

---

### 13. Component Categories & Migration Priorities

**Component Inventory Structure**:

1. **Orchestrator System** (Priority: High)
   - Voice orchestrator (GPT-5 Realtime)
   - Agent orchestration (GPT-5 with 97% tool accuracy)
   - Tool coordination (AI SDK)
   - Session management

2. **Agent Packages** (Priority: High)
   - Claude agent (via AI SDK)
   - Gemini browser agent (@google/genai + Playwright)
   - Codex agent (GPT-5 with enhanced coding)

3. **Lifecycle Hooks & CLI Tools** (Priority: Medium)
   - Pre/post hooks
   - Command-line scripts
   - File generation utilities
   - Development tooling

4. **Data Persistence** (Priority: Medium)
   - JSON file management
   - Session registry
   - Artifact storage
   - State management

5. **External Service Integration** (Priority: High)
   - OpenAI SDK integration (GPT-5)
   - Anthropic SDK integration
   - Gemini SDK integration
   - Playwright automation

**Migration Order**:
1. Data models and types (foundation)
2. External service integrations (isolated, testable)
3. Agent packages (leverage GPT-5 capabilities)
4. Orchestrator system (depends on agents)
5. CLI tools and hooks (final cleanup)

---

## Unresolved Technical Decisions

All technical decisions resolved during clarification phase. GPT-5 models selected as primary choice for 2025 implementation.

---

## Next Steps

Proceed to Phase 1: Design & Contracts to create:
- Data model documentation
- Migration strategy per component category
- Implementation roadmap
- Risk assessment matrix

**Key Advantages of GPT-5 (2025)**:
- 97% tool calling accuracy enables reliable agent orchestration
- 400K context window supports larger codebases
- 74.9% coding benchmarks for superior code generation
- ~45% reduction in hallucinations for more reliable outputs
