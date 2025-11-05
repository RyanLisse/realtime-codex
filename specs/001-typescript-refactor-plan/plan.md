# Implementation Plan: TypeScript Monorepo Refactor

**Branch**: `001-typescript-refactor-plan` | **Date**: 2025-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification + Monorepo Refactor & Integration Plan

## Summary

Combine big-3-super-agent (Python-based) and realtime-codex into a unified TypeScript monorepo powered by Bun. The refactor will modularize code into clear packages/services, apply functional programming (FP) principles, and use strict TypeScript + Zod schemas for runtime safety. The structure enables shared types and tools while keeping each agent (voice orchestrator, code agent, browser agent, codex agent) isolated. We leverage Bun's workspace feature for package linking and its high-performance runtime for maximum speed and developer ergonomics.

**GPT-5 Integration (2025)**: The refactor leverages GPT-5's enhanced capabilities:
- **97% Tool Calling Accuracy**: Critical for reliable agent orchestration and tool execution
- **400K Context Window**: Enables working with larger codebases in single conversations
- **GPT-5 Codex**: Specialized code generation model (`gpt-5-codex`) for all code-related agents
- **Unified Router System**: Automatically selects between fast responses and deep reasoning
- **Reduced Hallucinations**: ~45% reduction in factual errors for more reliable outputs

**Code-Related Agents**: All agents primarily focused on code generation, debugging, or refactoring use `gpt-5-codex` model:
- **Codex agent**: Primary code generation and file operations
- **Backend developer agent**: API and backend code generation
- **Frontend developer agent**: React component and frontend code generation
- **Tester agent**: Test code generation (unit, integration, E2E tests)
- Any other agent with primary code generation responsibilities

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode, noImplicitAny), Python 3.x (source)  
**Runtime**: Bun (primary runtime), Node.js/Bun/Deno compatible patterns  
**Primary Dependencies**: 
- `ai` - Vercel AI SDK (unified interface for LLM agents and tool orchestration)
- `@ai-sdk/openai` - AI SDK OpenAI provider (supports GPT-5 models)
- `@ai-sdk/anthropic` - AI SDK Anthropic provider (if available, else @anthropic-ai/sdk)
- `openai-realtime-api` (transitive-bullshit/openai-realtime-api) - TypeScript client for OpenAI Realtime voice API (GPT-5 Realtime)
- `zod` - Runtime type validation (used with AI SDK tools)
- `playwright` or `puppeteer` - Browser automation
- FP utilities (optional): `fp-ts` or `ramda` for functional composition

**Model Versions (2025)**:
- **GPT-5 Codex** (`gpt-5-codex`): Primary model for all code-related agents (code generation, debugging, refactoring)
- **GPT-5**: General orchestrator and coordination (unified system with router)
- **GPT-5 Pro**: Extended reasoning for complex tasks
- **GPT-5 Mini**: Cost-effective for simpler operations
- **GPT-5 Realtime**: Voice/interactive features (if available)

**Storage**: JSON files (session state, registries), file system persistence, in-memory state  
**Testing**: Bun's built-in `bun test`, maintain compatibility with existing Python test coverage  
**Target Platform**: Bun (primary), runtime-agnostic patterns where needed  
**Project Type**: Bun monorepo with workspace packages  
**Architecture Pattern**: Functional Programming (FP) - "functional core, imperative shell"  
**Type Safety**: Strict TypeScript + Zod runtime validation  
**Performance Goals**: Leverage Bun's speed for fast startup, module loading, and parallel API calls  
**Constraints**: Complete rewrite approach, maintain functional parity with Python, FP principles throughout  
**Scale/Scope**: Unified monorepo combining big-3-super-agent and realtime-codex; all Python components migrated to TypeScript packages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Planning Gates:**
- ✅ Specification complete and clarified
- ✅ Technical stack decisions made (Bun, FP, strict TS, Zod)
- ✅ Scope defined (unified monorepo structure)
- ✅ Architecture pattern selected (functional programming)

**Post-Design Gates (to verify after Phase 1):**
- Monorepo structure defined with clear package boundaries
- FP principles documented (pure functions, immutability, side effect isolation)
- Zod validation schemas designed for all package boundaries
- Package dependencies and workspace configuration specified

## Project Structure

### Documentation (this feature)

```text
specs/001-typescript-refactor-plan/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── contracts/          # Phase 1 output (/speckit.plan command)
```

### Monorepo Source Structure

**Root Configuration**:
```
package.json              # Bun workspaces: ["packages/*"]
tsconfig.json            # Strict TypeScript config (strict, noImplicitAny, noUncheckedIndexedAccess)
.env                     # Environment variables (validated via Zod)
bun.lockb                # Bun lockfile
```

**Package Structure**:
```
packages/
├── shared/              # Common code (types, interfaces, constants, Zod schemas)
│   ├── package.json     # name: "@repo/shared", type: "module"
│   ├── src/
│   │   ├── types/       # Shared TypeScript interfaces
│   │   ├── schemas/     # Zod validation schemas
│   │   ├── tools/       # Shared tool interfaces
│   │   ├── config.ts    # Environment validation (Zod EnvSchema)
│   │   └── prompts/     # Shared prompts (from Python apps/realtime-poc/prompts/)
│   └── tsconfig.json
│
├── orchestrator/        # Voice Orchestrator (formerly big_three_realtime_agents.py)
│   ├── package.json     # name: "@repo/orchestrator", depends: "@repo/shared": "workspace:*", "ai": "*", "@ai-sdk/openai": "*"
│   ├── src/
│   │   ├── VoiceOrchestrator.ts    # Main orchestrator class (uses openai-realtime-api with GPT-5 Realtime)
│   │   ├── AgentOrchestrator.ts    # AI SDK Agent with GPT-5 for tool coordination (97% tool accuracy)
│   │   ├── tools/                  # Tool implementations (listAgents, createAgent, commandAgent, etc.)
│   │   │   ├── listAgents.ts      # AI SDK tool with Zod schema (leverages GPT-5 tool calling)
│   │   │   ├── createAgent.ts     # AI SDK tool with Zod schema
│   │   │   ├── commandAgent.ts    # AI SDK tool with Zod schema
│   │   │   └── ...
│   │   ├── AgentManager.ts        # Agent lifecycle management
│   │   └── index.ts
│   └── tsconfig.json
│
├── agent-claude-code/   # Claude Code Agent (if code-focused, otherwise use GPT-5 Codex)
│   ├── package.json     # name: "@repo/agent-claude-code", depends: "@repo/shared": "workspace:*", "ai": "*", "@ai-sdk/anthropic": "*"
│   ├── src/
│   │   ├── ClaudeAgent.ts         # AI SDK Agent with Anthropic provider (or GPT-5 Codex if code-focused)
│   │   ├── tools/                 # Agent-specific tools (if any)
│   │   ├── session.ts             # Session management (memory/disk)
│   │   └── index.ts
│   └── tsconfig.json
│
├── agent-gemini-browser/  # Gemini Browser Agent
│   ├── package.json     # name: "@repo/agent-gemini-browser", depends: "@repo/shared": "workspace:*", "ai": "*", "@google/genai": "*", "playwright": "*"
│   ├── src/
│   │   ├── GeminiAgent.ts        # AI SDK Agent (or custom Gemini integration if AI SDK doesn't support)
│   │   ├── browser.ts             # Playwright/Puppeteer integration
│   │   ├── tools/                 # Browser automation tools (as AI SDK tools)
│   │   │   ├── navigate.ts        # AI SDK tool for navigation
│   │   │   ├── click.ts           # AI SDK tool for clicking
│   │   │   └── ...
│   │   ├── planning.ts            # Pure function for Gemini planning
│   │   ├── execution.ts           # Side effect isolation (Playwright calls)
│   │   └── index.ts
│   └── tsconfig.json
│
├── agent-codex/         # Codex/Realtime-Codex Agent
│   ├── package.json     # name: "@repo/agent-codex", depends: "@repo/shared": "workspace:*", "ai": "*", "@ai-sdk/openai": "*"
│   ├── src/
│   │   ├── CodexAgent.ts          # AI SDK Agent with GPT-5 Codex (specialized code generation model)
│   │   ├── tools/                 # Code generation tools (as AI SDK tools, 97% tool accuracy)
│   │   │   ├── readFile.ts        # AI SDK tool for reading files (400K context window support)
│   │   │   ├── writeFile.ts       # AI SDK tool for writing files
│   │   │   └── ...
│   │   ├── session.ts             # Session management
│   │   ├── fileOps.ts             # File operations (read/write code)
│   │   └── index.ts
│   └── tsconfig.json
│
├── agent-backend-dev/   # Backend Developer Agent (code generation)
│   ├── package.json     # name: "@repo/agent-backend-dev", depends: "@repo/shared": "workspace:*", "ai": "*", "@ai-sdk/openai": "*"
│   ├── src/
│   │   ├── BackendDeveloperAgent.ts  # AI SDK Agent with GPT-5 Codex
│   │   ├── tools/                    # API generation tools
│   │   └── index.ts
│   └── tsconfig.json
│
├── agent-frontend-dev/  # Frontend Developer Agent (code generation)
│   ├── package.json     # name: "@repo/agent-frontend-dev", depends: "@repo/shared": "workspace:*", "ai": "*", "@ai-sdk/openai": "*"
│   ├── src/
│   │   ├── FrontendDeveloperAgent.ts # AI SDK Agent with GPT-5 Codex
│   │   ├── tools/                    # Component generation tools
│   │   └── index.ts
│   └── tsconfig.json
│
├── agent-tester/        # Tester Agent (test code generation)
│   ├── package.json     # name: "@repo/agent-tester", depends: "@repo/shared": "workspace:*", "ai": "*", "@ai-sdk/openai": "*"
│   ├── src/
│   │   ├── TesterAgent.ts           # AI SDK Agent with GPT-5 Codex
│   │   ├── tools/                    # Test generation tools
│   │   └── index.ts
│   └── tsconfig.json
│
└── orchestrator-cli/   # CLI entrypoint (optional)
    ├── package.json     # name: "@repo/orchestrator-cli", depends: all agent packages
    ├── src/
    │   ├── index.ts     # Main CLI script (reads voice/text flags)
    │   └── commands/    # CLI command handlers
    └── tsconfig.json
```

**Structure Decision**: Bun monorepo with workspace packages. Each package is an ESM module with its own package.json. Workspace dependencies use `"workspace:*"` references. Shared code lives in `packages/shared`, agents are isolated in separate packages, and the orchestrator coordinates everything.

## Complexity Tracking

> **Justified Complexity**: Monorepo structure

| Complexity | Why Needed | Simpler Alternative Rejected Because |
|------------|------------|-------------------------------------|
| Multiple packages | Clear separation of concerns (orchestrator vs agents), enables independent versioning and testing | Single package would mix orchestration with agent logic, violating FP principles |
| Workspace dependencies | Type-safe package linking, shared types/tools | Copying shared code would create duplication and sync issues |
| FP abstraction layer | Isolates side effects (API calls, file I/O) from pure business logic | Direct side effects throughout codebase would reduce testability and composability |

## Phase 0: Outline & Research

### Research Tasks

1. **Bun Monorepo Setup & Workspaces**
   - Research: Bun workspace configuration, package.json workspace syntax
   - Find: Best practices for Bun monorepo structure, dependency hoisting
   - Document: Workspace setup patterns, package linking strategies

2. **Functional Programming Patterns in TypeScript**
   - Research: FP patterns suitable for TypeScript (pure functions, immutability)
   - Find: Functional core, imperative shell pattern implementation
   - Document: Side effect isolation strategies, function composition patterns

3. **Zod Schema Design for Runtime Safety**
   - Research: Zod schema patterns for environment variables, API responses, tool parameters
   - Find: Best practices for Zod validation at package boundaries
   - Document: Parse/Either pattern, error handling with Zod

4. **OpenAI Realtime API TypeScript Client**
   - Research: transitive-bullshit/openai-realtime-api library
   - Find: Event-driven patterns, tool integration, WebSocket handling
   - Document: Migration from Python WebSocket to TypeScript client

5. **Agent SDK Migration**
   - Research: @anthropic-ai/sdk, @google/genai TypeScript clients
   - Find: Streaming support, tool use patterns, session management
   - Document: Python SDK → TypeScript SDK migration patterns

6. **Code Refactoring Strategy**
   - Research: Breaking down 3000+ line Python orchestrator into modular TS packages
   - Find: FP decomposition strategies, pure function extraction
   - Document: Migration steps from monolithic Python to modular TypeScript

## Phase 1: Design & Contracts

### Data Model

**Entities for Monorepo Refactor:**

1. **Package Definition**
   - Fields: name, type (package), workspace_path, dependencies, exports
   - Relationships: Package → Dependencies (workspace packages)

2. **Tool Interface** (from packages/shared)
   - Fields: name, description, handler (pure function), inputSchema (Zod), outputSchema (Zod)
   - Relationships: Tool → Packages (packages using tool)

3. **Agent Session**
   - Fields: id, type (AgentType), status, messages, metadata
   - Relationships: Session → Agent Package (claude/gemini/codex)

4. **Environment Schema** (Zod validation)
   - Fields: OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, etc.
   - Validation: All required keys must be present at startup

### Contracts

**Package Boundary Contracts** (defined in packages/shared):

1. **Tool Interface Contract**
   ```typescript
   interface Tool {
     name: string;
     description: string;
     handler: (params: ToolParams) => Promise<ToolResult>;
     inputSchema: ZodSchema;
     outputSchema: ZodSchema;
   }
   ```

2. **Agent Session Contract**
   - All agent packages implement consistent session interface
   - Session data validated via Zod schemas
   - Session registry format standardized

3. **Environment Validation Contract**
   - All packages use shared EnvSchema from packages/shared
   - Missing required keys fail fast at startup
   - Zod parsing ensures runtime type safety

4. **Functional Purity Contract**
   - Core business logic functions are pure (no side effects)
   - Side effects isolated to "imperative shell" (thin wrappers)
   - API calls, file I/O, network operations in isolated functions

---

## Phase 2: Implementation Tasks

*This phase is executed by `/speckit.tasks` command, not `/speckit.plan`*

**Next Command**: `/speckit.tasks` to generate detailed implementation tasks.

---

## Plan Completion Summary

**Status**: ✅ Phase 0 and Phase 1 complete
- ✅ Research complete (GPT-5 Codex integration, Bun monorepo, FP patterns)
- ✅ Data model documented (package structure, FP patterns)
- ✅ Contracts defined (package boundaries, tool interfaces, FP purity)
- ✅ Model assignment strategy documented
- ✅ All code-related agents assigned to GPT-5 Codex

### Updated Artifacts

1. **research.md**: ✅ Complete - Bun monorepo patterns, FP principles, Zod validation, GPT-5 Codex integration
2. **data-model.md**: ✅ Complete - Package structure and FP patterns
3. **quickstart.md**: ✅ Complete - Bun monorepo setup and usage, model assignments
4. **model-assignment.md**: ✅ New - Detailed GPT-5 Codex assignment strategy for code agents
5. **contracts/migration-contract.md**: ✅ Complete - Package boundary contracts, tool interfaces, FP purity contracts

### Key Architectural Decisions

- **Runtime**: Bun (primary) with runtime-agnostic patterns where needed
- **Architecture**: Functional Programming (functional core, imperative shell)
- **Type Safety**: Strict TypeScript + Zod runtime validation
- **Structure**: Bun monorepo with workspace packages
- **Package Isolation**: Each agent in separate package, shared code in packages/shared
- **Tool System**: AI SDK tools with Zod validation (leveraging GPT-5's 97% tool accuracy)
- **Model Selection**: GPT-5 Codex (`gpt-5-codex`) for all code-related agents; GPT-5 for orchestrator and coordination
- **Agent Framework**: Vercel AI SDK for unified agent orchestration

### Next Steps

Run `/speckit.tasks` to generate:
- Monorepo initialization tasks (Bun setup, workspace configuration)
- Package creation tasks (shared, orchestrator, agent packages including code agents)
- FP refactoring tasks (pure function extraction, side effect isolation)
- Zod schema generation tasks (environment, tool parameters, API responses)
- Migration tasks (Python orchestrator → TypeScript packages)
- Model assignment tasks (GPT-5 Codex for code agents, GPT-5 for coordination)
- AI SDK integration tasks (Agent class setup, tool definitions)
