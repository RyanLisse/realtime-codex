# Tasks: TypeScript Monorepo Refactor

**Input**: Design documents from `/specs/001-typescript-refactor-plan/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/migration-contract.md, quickstart.md

**Organization**: Tasks are organized by implementation phases to enable systematic migration from Python to TypeScript monorepo structure.

## Format: `[ID] [P?] [Story?] Description`

## Phase 1: Setup (Monorepo Infrastructure)

**Purpose**: Initialize Bun monorepo structure and workspace configuration.

- [x] T001 Create root package.json with Bun workspaces configuration in package.json (workspaces: ["packages/*"])
- [x] T002 [P] Create root tsconfig.json with strict TypeScript settings (strict, noImplicitAny, noUncheckedIndexedAccess) in tsconfig.json
- [x] T003 [P] Create .env.example file with required environment variables in .env.example
- [x] T004 [P] Initialize Bun lockfile by running `bun install` to generate bun.lockb
- [x] T005 Create packages directory structure in packages/

---

## Phase 2: Foundational (Shared Package)

**Purpose**: Create shared package with common types, schemas, and tool interfaces that all other packages depend on.

- [x] T006 Create packages/shared/package.json with name "@repo/shared", type "module" in packages/shared/package.json
- [x] T007 [P] Create packages/shared/tsconfig.json with TypeScript configuration extending root in packages/shared/tsconfig.json
- [x] T008 [P] Create packages/shared/src/types/ directory structure in packages/shared/src/types/
- [x] T009 [P] [US1] Define shared TypeScript interfaces (Tool, AgentSession, AgentType) in packages/shared/src/types/index.ts
- [x] T010 [P] Create packages/shared/src/schemas/ directory structure in packages/shared/src/schemas/
- [x] T011 [P] [US1] Create Zod environment validation schema (EnvSchema) in packages/shared/src/schemas/env.ts
- [x] T012 [P] [US1] Create Zod schemas for tool parameters and responses in packages/shared/src/schemas/tools.ts
- [x] T013 [P] [US1] Create Zod schemas for agent session data in packages/shared/src/schemas/session.ts
- [x] T014 [P] Create packages/shared/src/tools/ directory for shared tool interfaces in packages/shared/src/tools/
- [x] T015 [US1] Define Tool interface contract matching migration-contract.md in packages/shared/src/tools/index.ts
- [x] T016 [P] Create packages/shared/src/config.ts with environment validation using EnvSchema in packages/shared/src/config.ts
- [x] T017 [P] Create packages/shared/src/prompts/ directory for shared prompts in packages/shared/src/prompts/
- [x] T018 [US1] Create packages/shared/src/index.ts barrel export for all shared types, schemas, and tools in packages/shared/src/index.ts

**Checkpoint**: Shared package complete. All agent packages can now depend on @repo/shared.

---

## Phase 3: User Story 1 - Core Orchestrator Package (Priority: P1) 🎯 MVP

**Goal**: Migrate Python orchestrator (big_three_realtime_agents.py) to TypeScript orchestrator package with AI SDK integration.

**Independent Test**: Create orchestrator instance, verify it can initialize with GPT-5 model, and execute basic tool calls (listAgents, createAgent).

### Implementation for User Story 1

- [x] T019 Create packages/orchestrator/package.json with dependencies (@repo/shared, ai, @ai-sdk/openai, openai-realtime-api) in packages/orchestrator/package.json
- [x] T020 [P] Create packages/orchestrator/tsconfig.json extending root config in packages/orchestrator/tsconfig.json
- [x] T021 [P] [US1] Create packages/orchestrator/src/tools/ directory structure in packages/orchestrator/src/tools/
- [x] T022 [P] [US1] Implement listAgents tool with Zod schema in packages/orchestrator/src/tools/listAgents.ts
- [x] T023 [P] [US1] Implement createAgent tool with Zod schema in packages/orchestrator/src/tools/createAgent.ts
- [x] T024 [P] [US1] Implement commandAgent tool with Zod schema in packages/orchestrator/src/tools/commandAgent.ts
- [x] T025 [US1] Create AgentManager class for agent lifecycle management in packages/orchestrator/src/AgentManager.ts
- [x] T026 [US1] Create AgentOrchestrator class using AI SDK Agent with GPT-5 model in packages/orchestrator/src/AgentOrchestrator.ts
- [x] T027 [US1] Create VoiceOrchestrator class using openai-realtime-api with GPT-5 Realtime in packages/orchestrator/src/VoiceOrchestrator.ts
- [x] T028 [US1] Create packages/orchestrator/src/index.ts exporting orchestrator classes and tools in packages/orchestrator/src/index.ts
- [x] T029 [US1] Implement functional core (pure functions) for agent state management in packages/orchestrator/src/core/agentState.ts
- [x] T030 [US1] Isolate side effects (API calls, file I/O) in imperative shell functions in packages/orchestrator/src/shell/sideEffects.ts

---

## Phase 4: User Story 2 - Agent Packages Migration (Priority: P2)

**Goal**: Migrate individual agent implementations (Claude, Gemini, Codex) to separate TypeScript packages with AI SDK integration.

**Independent Test**: Create each agent package, verify it can initialize with appropriate model, and execute agent-specific operations.

### Codex Agent (US2)

- [x] T031 Create packages/agent-codex/package.json with dependencies (@repo/shared, ai, @ai-sdk/openai) in packages/agent-codex/package.json
- [x] T032 [P] Create packages/agent-codex/tsconfig.json in packages/agent-codex/tsconfig.json
- [x] T033 [P] [US2] Create CodexAgent class using AI SDK Agent with GPT-5 Codex model in packages/agent-codex/src/CodexAgent.ts
- [x] T034 [P] [US2] Create readFile tool with Zod schema for file reading in packages/agent-codex/src/tools/readFile.ts
- [x] T035 [P] [US2] Create writeFile tool with Zod schema for file writing in packages/agent-codex/src/tools/writeFile.ts
- [x] T036 [US2] Implement file operations wrapper (fileOps.ts) with side effect isolation in packages/agent-codex/src/fileOps.ts
- [x] T037 [US2] Implement session management for codex agent in packages/agent-codex/src/session.ts
- [x] T038 [US2] Create packages/agent-codex/src/index.ts exporting CodexAgent and tools in packages/agent-codex/src/index.ts

### Claude Agent (US2)

- [x] T039 Create packages/agent-claude-code/package.json with dependencies (@repo/shared, ai, @ai-sdk/anthropic) in packages/agent-claude-code/package.json
- [x] T040 [P] Create packages/agent-claude-code/tsconfig.json in packages/agent-claude-code/tsconfig.json
- [x] T041 [P] [US2] Create ClaudeAgent class using AI SDK Agent with Anthropic provider in packages/agent-claude-code/src/ClaudeAgent.ts
- [x] T042 [US2] Implement session management for claude agent in packages/agent-claude-code/src/session.ts
- [x] T043 [US2] Create packages/agent-claude-code/src/index.ts exporting ClaudeAgent in packages/agent-claude-code/src/index.ts

### Gemini Browser Agent (US2)

- [x] T044 Create packages/agent-gemini-browser/package.json with dependencies (@repo/shared, ai, @google/genai, playwright) in packages/agent-gemini-browser/package.json
- [x] T045 [P] Create packages/agent-gemini-browser/tsconfig.json in packages/agent-gemini-browser/tsconfig.json
- [x] T046 [P] [US2] Create GeminiAgent class using AI SDK or custom Gemini integration in packages/agent-gemini-browser/src/GeminiAgent.ts
- [x] T047 [P] [US2] Create navigate tool with Zod schema for browser navigation in packages/agent-gemini-browser/src/tools/navigate.ts
- [x] T048 [P] [US2] Create click tool with Zod schema for browser clicking in packages/agent-gemini-browser/src/tools/click.ts
- [x] T049 [US2] Implement browser.ts with Playwright integration (side effects isolated) in packages/agent-gemini-browser/src/browser.ts
- [x] T050 [US2] Implement planning.ts with pure function for Gemini planning in packages/agent-gemini-browser/src/planning.ts
- [x] T051 [US2] Implement execution.ts with side effect isolation for Playwright calls in packages/agent-gemini-browser/src/execution.ts
- [x] T052 [US2] Create packages/agent-gemini-browser/src/index.ts exporting GeminiAgent and tools in packages/agent-gemini-browser/src/index.ts

### Code Generation Agents (US2)

- [x] T053 Create packages/agent-backend-dev/package.json with dependencies (@repo/shared, ai, @ai-sdk/openai) in packages/agent-backend-dev/package.json
- [x] T054 [P] Create packages/agent-backend-dev/tsconfig.json in packages/agent-backend-dev/tsconfig.json
- [x] T055 [P] [US2] Create BackendDeveloperAgent class using AI SDK Agent with GPT-5 Codex in packages/agent-backend-dev/src/BackendDeveloperAgent.ts
- [x] T056 [US2] Create API generation tools in packages/agent-backend-dev/src/tools/ directory
- [x] T057 [US2] Create packages/agent-backend-dev/src/index.ts exporting BackendDeveloperAgent in packages/agent-backend-dev/src/index.ts

- [x] T058 Create packages/agent-frontend-dev/package.json with dependencies (@repo/shared, ai, @ai-sdk/openai) in packages/agent-frontend-dev/package.json
- [x] T059 [P] Create packages/agent-frontend-dev/tsconfig.json in packages/agent-frontend-dev/tsconfig.json
- [x] T060 [P] [US2] Create FrontendDeveloperAgent class using AI SDK Agent with GPT-5 Codex in packages/agent-frontend-dev/src/FrontendDeveloperAgent.ts
- [x] T061 [US2] Create component generation tools in packages/agent-frontend-dev/src/tools/ directory
- [x] T062 [US2] Create packages/agent-frontend-dev/src/index.ts exporting FrontendDeveloperAgent in packages/agent-frontend-dev/src/index.ts

- [x] T063 Create packages/agent-tester/package.json with dependencies (@repo/shared, ai, @ai-sdk/openai) in packages/agent-tester/package.json
- [x] T064 [P] Create packages/agent-tester/tsconfig.json in packages/agent-tester/tsconfig.json
- [x] T065 [P] [US2] Create TesterAgent class using AI SDK Agent with GPT-5 Codex in packages/agent-tester/src/TesterAgent.ts
- [x] T066 [US2] Create test generation tools (unit, integration, E2E) in packages/agent-tester/src/tools/ directory
- [x] T067 [US2] Create packages/agent-tester/src/index.ts exporting TesterAgent in packages/agent-tester/src/index.ts

---

## Phase 5: User Story 3 - CLI Entrypoint & Integration (Priority: P3)

**Goal**: Create CLI entrypoint for orchestrator and validate complete monorepo integration.

**Independent Test**: Run CLI command, verify it can initialize orchestrator and coordinate agents.

- [x] T068 Create packages/orchestrator-cli/package.json with dependencies (all agent packages, orchestrator) in packages/orchestrator-cli/package.json
- [x] T069 [P] Create packages/orchestrator-cli/tsconfig.json in packages/orchestrator-cli/tsconfig.json
- [x] T070 [US3] Create main CLI script in packages/orchestrator-cli/src/index.ts
- [x] T071 [US3] Implement CLI command handlers in packages/orchestrator-cli/src/commands/ directory
- [x] T072 [US3] Add CLI binary entrypoint in packages/orchestrator-cli/package.json (bin field)
- [x] T073 [US3] Create integration test validating orchestrator → agent coordination in packages/orchestrator-cli/src/__tests__/integration.test.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize migration, add testing, documentation, and validation.

### Testing & Validation

- [x] T074 [P] Create unit tests for shared package schemas and types in packages/shared/src/__tests__/
- [x] T075 [P] Create unit tests for orchestrator tools in packages/orchestrator/src/tools/__tests__/
- [x] T076 [P] Create unit tests for each agent package in their respective __tests__/ directories
- [x] T077 Create integration tests for orchestrator → agent coordination in packages/orchestrator/src/__tests__/integration.test.ts
- [x] T078 Create contract tests validating Python → TypeScript migration parity per migration-contract.md in packages/__tests__/contracts/

### Documentation

- [x] T079 Create README.md in packages/shared/ documenting shared types and schemas
- [x] T080 Create README.md in packages/orchestrator/ documenting orchestrator usage
- [x] T081 Create README.md in each agent package documenting agent-specific usage
- [x] T082 Create migration guide documenting Python → TypeScript patterns in docs/MIGRATION_GUIDE.md
- [x] T083 Update root README.md with monorepo structure and package overview

### Performance & Validation

- [x] T084 [P] Implement performance benchmarks comparing Python vs TypeScript implementations in packages/__tests__/performance/
- [x] T085 Validate all packages use strict TypeScript configuration (noImplicitAny, strict mode)
- [x] T086 Validate all environment variables are validated via Zod schemas at startup
- [x] T087 Validate functional programming principles (pure functions, side effect isolation) across all packages
- [x] T088 Verify all packages have proper workspace dependencies configured
- [x] T089 Run bun install to verify all workspace dependencies resolve correctly

### Migration Completion

- [x] T090 Create component inventory documenting all migrated components in docs/COMPONENT_INVENTORY.md
- [x] T091 Validate migration contract requirements (functional parity, API compatibility) per contracts/migration-contract.md
- [x] T092 Create migration validation checklist marking completed components in docs/MIGRATION_CHECKLIST.md
- [x] T093 Verify all GPT-5 Codex model assignments are correct for code-related agents per model-assignment.md

---

## Dependencies

### Story Completion Order

1. **Phase 1 (Setup)** → Must complete before all other phases
2. **Phase 2 (Foundational)** → Must complete before Phase 3+ (all packages depend on @repo/shared)
3. **Phase 3 (US1 - Orchestrator)** → Can start after Phase 2, enables agent coordination
4. **Phase 4 (US2 - Agent Packages)** → Can start after Phase 2, can proceed in parallel, depends on shared package
5. **Phase 5 (US3 - CLI)** → Must complete after Phase 3 and Phase 4 (depends on orchestrator and agents)
6. **Phase 6 (Polish)** → Must complete after all implementation phases

### Parallel Execution Opportunities

**Within Phase 2 (Foundational)**:
- T007-T018 can be parallelized (different files/directories)

**Within Phase 3 (US1 - Orchestrator)**:
- T021-T024 can be parallelized (different tool files)
- T029-T030 can be parallelized (different core/shell files)

**Within Phase 4 (US2 - Agent Packages)**:
- Agent packages (Codex, Claude, Gemini, Backend, Frontend, Tester) can be developed in parallel
- Tool implementations within each agent can be parallelized

**Within Phase 6 (Polish)**:
- T074-T077 can be parallelized (different test files)
- T079-T081 can be parallelized (different README files)
- T084-T088 can be parallelized (validation tasks)

---

## Implementation Strategy

### MVP Scope (Phase 1-3)

**Minimum viable product**: Setup monorepo, create shared package, implement core orchestrator.

**Deliverables**:
- Bun monorepo structure initialized
- Shared package with types, schemas, and tool interfaces
- Orchestrator package with basic tool coordination (listAgents, createAgent, commandAgent)
- AgentOrchestrator using AI SDK with GPT-5

**Success Criteria**:
- Can initialize orchestrator
- Can execute basic tool calls
- All packages follow FP principles
- All packages use strict TypeScript + Zod validation

### Incremental Delivery

**Phase 1-2**: Foundation (Monorepo + Shared)
**Phase 3**: Core orchestration capability
**Phase 4**: Individual agent implementations (can be delivered incrementally)
**Phase 5**: CLI integration for end-to-end usage
**Phase 6**: Polish, testing, documentation

### Risk Mitigation

- **Large Python file decomposition**: Break down 3000+ line orchestrator into modular TypeScript packages (Phase 3)
- **SDK compatibility**: Validate TypeScript SDKs match Python feature parity during agent package development (Phase 4)
- **Functional parity**: Contract tests validate Python → TypeScript equivalence (Phase 6)
- **Performance**: Benchmark TypeScript vs Python implementations (Phase 6)

---

## Summary

**Total Tasks**: 93
**Tasks by Phase**:
- Phase 1 (Setup): 5 tasks
- Phase 2 (Foundational): 13 tasks
- Phase 3 (US1 - Orchestrator): 12 tasks
- Phase 4 (US2 - Agent Packages): 49 tasks
- Phase 5 (US3 - CLI): 6 tasks
- Phase 6 (Polish): 8 tasks

**Parallel Opportunities**: 40+ tasks can be executed in parallel across different packages/files

**Independent Test Criteria**:
- **US1**: Orchestrator can initialize and execute basic tool calls
- **US2**: Each agent package can initialize with appropriate model and execute operations
- **US3**: CLI can coordinate orchestrator and agents end-to-end

**MVP Scope**: Phase 1-3 (Setup + Foundational + Orchestrator) = 30 tasks

**Format Validation**: ✅ All tasks follow required checklist format with checkbox, ID, optional [P] marker, optional [Story] label, and file paths.

