# Barrel File Decision: packages/agent-codex/src/index.ts

## Decision

Barrel files (index.ts exporting from multiple modules) are used in this monorepo for package public APIs.

## Rationale

1. **Monorepo Pattern**: Standard practice for monorepo packages to expose a single entry point
2. **Developer Experience**: Simplifies imports: `import { CodexAgent } from "@repo/agent-codex"` instead of deep paths
3. **Package Boundaries**: Clear separation between internal implementation and public API
4. **Tree-Shaking**: Modern bundlers (Bun, esbuild, webpack) handle barrel files efficiently via tree-shaking

## Performance Impact

- **Minimal**: Modern bundlers tree-shake unused exports
- **Build Time**: Slight increase in initial parse, but acceptable for DX gains
- **Runtime**: No impact (exports are resolved at build time)

## Alternative Considered

Direct exports would require:
```typescript
import { CodexAgent } from "@repo/agent-codex/CodexAgent";
import { readFileTool } from "@repo/agent-codex/tools/readFile";
```
This reduces DX and breaks package encapsulation.

## Conclusion

Barrel files are **acceptable and recommended** for monorepo package exports in this project.

## Related

- Similar pattern used in `packages/orchestrator/src/index.ts`
- Similar pattern used in `packages/shared/src/index.ts`
- All agent packages follow this pattern for consistency

