# Tasks: Workflow Coordinator & Task Router

**Input**: Design documents from `/specs/001-workflow-coordinator/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Selected stories include explicit test tasks to uphold sequential/parallel orchestration guarantees and persistence safety.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish workflow feature skeleton and shared exports.

- [x] T001 Create workflow feature directory structure in src/features/workflow/ (services/, hooks/, types/, actions/, config/, __tests__/)
- [x] T002 Add feature export barrel in src/features/workflow/index.ts (Coordinator, TaskRouter, hooks, types)
- [x] T003 [P] Register workflow feature entry points in src/shared/agent.utils.ts (service wiring & factory)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before story work can begin.

- [x] T004 Define Workflow, Task, Agent enums in src/features/workflow/types/workflow.types.ts
- [x] T005 [P] Author Zod validation schemas in src/features/workflow/types/workflow.schema.ts
- [x] T006 Implement persistence adapter skeleton in src/features/workflow/services/workflowPersistence.ts
- [x] T007 [P] Create event bus wrapper emitting workflow events in src/features/workflow/services/workflowEventBus.ts
- [x] T008 Scaffold coordinator class with dependency injection hooks in src/features/workflow/services/workflowCoordinator.ts
- [x] T009 Expose create/pause/resume server actions in src/features/workflow/actions/workflow.actions.ts

**Checkpoint**: Foundational infrastructure complete. User stories may proceed.

---

## Phase 3: User Story 1 - Sequential Agent Handoff (Priority: P1) 🎯 MVP

**Goal**: Ensure tasks route through agents sequentially with artifact handoffs.

**Independent Test**: Submit design+frontend workflow; verify ProjectManager → Designer → Frontend → Tester completes with artifacts.

### Implementation for User Story 1

- [x] T010 [P] [US1] Write sequential orchestration integration test in src/features/workflow/services/__tests__/workflowCoordinator.sequential.spec.ts
- [x] T011 [P] [US1] Implement FIFO task queue helper in src/features/workflow/services/taskQueue.ts
- [x] T012 [US1] Add sequential handoff logic to src/features/workflow/services/workflowCoordinator.ts (depends on T011)
- [x] T013 [US1] Wire sequential transitions in src/features/workflow/actions/workflow.actions.ts (depends on T012)
- [x] T014 [US1] Expose sequential state updates via src/features/workflow/hooks/useWorkflow.ts
- [x] T015 [US1] Document sequential flow in docs/WORKFLOW_STATE_MACHINE.md

**Checkpoint**: User Story 1 fully functional and independently testable (MVP scope).

---

## Phase 4: User Story 2 - Parallel Task Execution (Priority: P2)

**Goal**: Allow independent frontend/backend agents to execute simultaneously.

**Independent Test**: Submit parallel task; confirm Frontend & Backend run concurrently before Tester starts.

### Implementation for User Story 2

- [x] T016 [P] [US2] Add parallel orchestration tests in src/features/workflow/services/__tests__/workflowCoordinator.parallel.spec.ts
- [x] T017 [P] [US2] Build dependency graph utility in src/features/workflow/services/dependencyGraph.ts
- [x] T018 [US2] Implement concurrent scheduling in src/features/workflow/services/taskRouter.ts
- [x] T019 [US2] Extend coordinator to manage parallel branches in src/features/workflow/services/workflowCoordinator.ts
- [x] T020 [US2] Emit branch progress metrics in src/features/workflow/services/workflowEventBus.ts
- [x] T021 [US2] Render parallel status updates in src/features/workflow/hooks/useWorkflow.ts

**Checkpoint**: User Stories 1 & 2 operate independently with sequential + parallel coverage.

---

## Phase 5: User Story 3 - Workflow State Recovery (Priority: P3)

**Goal**: Resume workflows from last checkpoint after failure or restart.

**Independent Test**: Interrupt mid-workflow; confirm resume continues from last completed agent without duplicating work.

### Implementation for User Story 3

- [x] T022 [P] [US3] Add persistence recovery test in src/features/workflow/services/__tests__/workflowPersistence.recovery.spec.ts
- [x] T023 [US3] Persist checkpoints and history snapshots in src/features/workflow/services/workflowPersistence.ts
- [x] T024 [US3] Implement resume/rollback logic in src/features/workflow/services/workflowCoordinator.ts
- [x] T025 [P] [US3] Extend server actions for pause/resume endpoints in src/features/workflow/actions/workflow.actions.ts
- [x] T026 [US3] Update recovery states in docs/WORKFLOW_STATE_MACHINE.md
- [x] T027 [US3] Support resume controls within src/features/workflow/hooks/useWorkflow.ts

**Checkpoint**: Workflow resumes reliably; recovery validated independently.

---

## Phase 6: User Story 4 - Dynamic Agent Routing (Priority: P2)

**Goal**: Route workflows intelligently based on task requirements, skipping unnecessary agents.

**Independent Test**: Simple bugfix routes directly to Frontend/Backend; complex tasks include Designer.

### Implementation for User Story 4

- [x] T028 [P] [US4] Write routing heuristics tests in src/features/workflow/services/__tests__/taskRouter.routing.spec.ts
- [x] T029 [US4] Implement capability-based routing rules in src/features/workflow/services/taskRouter.ts
- [x] T030 [US4] Define agent capability matrix in src/features/workflow/config/agent-capabilities.ts
- [x] T031 [US4] Integrate router decisions with coordinator pipeline in src/features/workflow/services/workflowCoordinator.ts
- [x] T032 [US4] Surface routing decisions in src/components/workflow/WorkflowStatusPanel.tsx

**Checkpoint**: Routing adapts per task type; story independently verifiable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Consolidate documentation, telemetry, and QA.

- [x] T033 Refresh quickstart guidance in specs/001-workflow-coordinator/quickstart.md
- [x] T034 [P] Add telemetry hooks & structured logging in src/features/workflow/services/workflowEventBus.ts
- [x] T035 Execute end-to-end validation script & update docs in docs/WORKFLOW_STATE_MACHINE.md

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2** (strict). Foundational (Phase 2) must complete before any user story.
- **User Stories** can begin once Phase 2 completes. Recommended order: US1 (MVP) → US2 → US3 → US4, though US2 & US4 can run in parallel with separate teams after US1 scaffolds coordinator interfaces.
- **Polish** begins after targeted user stories ship.

## Parallel Opportunities

- Tasks marked `[P]` operate on distinct files and can run concurrently.
- During Phase 2, T005, T007 may execute alongside T004/T006.
- User story test tasks (T010, T016, T022, T028) can run in parallel with corresponding implementation work once acceptance criteria defined.
- Different user stories can be staffed by different developers after foundational completion.

## Independent Test Criteria

- **US1**: Sequential artifact handoff verified via T010 flow.
- **US2**: Concurrent branch completion verified via T016 scenario.
- **US3**: Resume from checkpoint validated via T022 scenario.
- **US4**: Routing decision accuracy validated via T028 scenario.

## MVP Scope

- Complete through **Phase 3 (US1)** to deliver sequential handoffs with artifact availability. Subsequent phases expand capabilities but are not required for MVP shipment.

## Summary

- **Total Tasks**: 35
- **Task Distribution**:
  - Phase 1 Setup: 3
  - Phase 2 Foundational: 6
  - US1: 6
  - US2: 6
  - US3: 6
  - US4: 5
  - Polish: 3
- **Parallel-Eligible Tasks**: 12 (marked `[P]`)
- **Parallel Story Opportunities**: US2 & US4 can proceed concurrently once US1 stabilizes core coordinator APIs.

## Implementation Strategy

1. Execute Phases 1-2 to lay groundwork.
2. Deliver US1 as MVP, ensuring sequential orchestration and baseline documentation.
3. Layer in US2 parallelism, US3 recovery, and US4 dynamic routing based on priority and staffing.
4. Conclude with polish tasks to harden telemetry and documentation.
