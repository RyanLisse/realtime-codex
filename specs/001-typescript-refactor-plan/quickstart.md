# Quick Start: TypeScript Monorepo Refactor

**Feature**: TypeScript Monorepo Refactor  
**Date**: 2025-01-15

## Overview

This guide provides a quick reference for the Bun monorepo refactoring plan. The plan combines big-3-super-agent (Python) and realtime-codex into a unified TypeScript monorepo powered by Bun, using functional programming principles and strict TypeScript + Zod validation.

## Monorepo Structure

```
packages/
├── shared/              # Common types, Zod schemas, tool interfaces
├── orchestrator/        # Voice orchestrator (main coordination)
├── agent-claude-code/   # Claude agent implementation
├── agent-gemini-browser/ # Gemini browser agent
├── agent-codex/         # Codex agent implementation
└── orchestrator-cli/    # CLI entrypoint (optional)
```

## Key Decisions

### Architecture
- **Runtime**: Bun (primary, high-performance)
- **Pattern**: Functional Programming (functional core, imperative shell)
- **Type Safety**: Strict TypeScript + Zod runtime validation
- **Structure**: Bun monorepo with workspace packages

### Technology Stack
- **Agent Framework**: Vercel AI SDK (`ai` package) - unified interface for agents
- **Voice Agent**: openai-realtime-api with GPT-5 Realtime (for voice-specific features)
- **Claude Agent**: AI SDK Agent with Anthropic provider
- **Gemini Agent**: @google/genai + Playwright (may need custom AI SDK integration)
- **Code-Related Agents**: AI SDK Agent with GPT-5 Codex (`gpt-5-codex`) - specialized code generation model
  - Codex agent (primary code generation)
  - Backend developer agent (API, schemas, server code)
  - Frontend developer agent (React components, TypeScript)
  - Tester agent (test code generation)
- **Tool System**: AI SDK tools with Zod schemas (leverages GPT-5's 97% tool calling accuracy)
- **Validation**: Zod schemas at all package boundaries

### GPT-5 Model Advantages (2025)
- **Tool Calling**: 97% accuracy (critical for agent orchestration)
- **Context Window**: 400K tokens (double GPT-4, enables larger codebases)
- **Unified System**: Smart router for fast vs deep reasoning
- **Reliability**: ~45% reduction in hallucinations

### GPT-5 Codex for Code-Related Agents
- **Specialized for Code**: Optimized specifically for code generation, debugging, refactoring
- **Coding Performance**: Superior performance on coding benchmarks, excels at front-end generation
- **Code Understanding**: Better comprehension of codebase structure and dependencies
- **All Code Agents**: Use `gpt-5-codex` for any agent primarily generating or modifying code

### Scope
- **Repositories**: big-3-super-agent + realtime-codex → unified monorepo
- **Components**: All Python code migrated to TypeScript packages
- **Approach**: Complete rewrite with FP principles

## Using This Plan

### For Project Managers
1. Review **Implementation Roadmap** section for phase breakdown and timeline
2. Check **Risk Assessment** section for blockers and mitigation plans
3. Use **Component Inventory** to estimate resource allocation

### For Developers
1. Start with **Technology Mapping** to understand tool replacements
2. Review **Migration Strategies** for your component category
3. Follow **Implementation Roadmap** phase order
4. Reference **Testing Strategy** for verification approaches

### For Architects
1. Review **Migration Strategies** for architectural decisions
2. Validate **Technology Mapping** against project constraints
3. Assess **Risk Assessment** for technical feasibility

## Quick Reference

### Package Dependencies

| Package | Dependencies | Purpose |
|---------|--------------|---------|
| shared | zod | Common types, schemas, tool interfaces |
| orchestrator | shared, ai, @ai-sdk/openai, openai-realtime-api | Voice orchestrator, AI SDK Agent (gpt-5) for tool coordination |
| agent-claude-code | shared, ai, @ai-sdk/anthropic | Claude agent (AI SDK Agent) - reasoning tasks |
| agent-gemini-browser | shared, ai, @google/genai, playwright | Gemini browser agent |
| agent-codex | shared, ai, @ai-sdk/openai | Codex agent (AI SDK Agent with gpt-5-codex) |
| agent-backend-dev | shared, ai, @ai-sdk/openai | Backend developer (gpt-5-codex) - API, schemas, server code |
| agent-frontend-dev | shared, ai, @ai-sdk/openai | Frontend developer (gpt-5-codex) - React, TypeScript, UI |
| agent-tester | shared, ai, @ai-sdk/openai | Tester (gpt-5-codex) - test code generation |
| orchestrator-cli | orchestrator, all agent packages | CLI entrypoint |

### Migration Phases

1. **Phase 1**: Initialize Bun monorepo, create packages/shared (types, Zod schemas)
2. **Phase 2**: Migrate agent SDKs (Claude, Gemini, Codex packages)
3. **Phase 3**: Refactor orchestrator (break down Python file into tools)
4. **Phase 4**: Integrate RealtimeClient, wire up tool handlers
5. **Phase 5**: CLI entrypoint, testing, validation

### Critical Risks

1. **3000+ Line Python File**: Large orchestrator needs careful decomposition (mitigation: FP extraction)
2. **State Management**: Python global state → FP immutable patterns (mitigation: state passing)
3. **SDK Compatibility**: Ensure TypeScript SDKs match Python feature parity (mitigation: testing)
4. **GPT-5 Codex Availability**: Verify GPT-5 Codex model is available via @ai-sdk/openai (mitigation: fallback to gpt-5 or gpt-4o-code if needed)

## Next Steps

1. Generate complete **Component Inventory** from both repositories
2. Finalize **Migration Strategies** with detailed steps
3. Create **Implementation Roadmap** with time estimates
4. Complete **Risk Assessment** with mitigation plans
5. Document **Testing Strategy** with validation approaches

## Related Documents

- **Specification**: [spec.md](./spec.md)
- **Implementation Plan**: [plan.md](./plan.md)
- **Research Findings**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)

