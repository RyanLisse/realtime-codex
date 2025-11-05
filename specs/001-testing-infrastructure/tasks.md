# Tasks: Testing Infrastructure Setup

**Input**: Design documents from `/specs/001-testing-infrastructure/`
**Prerequisites**: plan.md, spec.md

**Tests**: Testing infrastructure tasks focus on configuration, utilities, and verification rather than test code itself.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify and enhance existing test infrastructure setup.

- [x] T001 Verify Vitest configuration in vitest.config.ts (coverage provider, test patterns, environment)
- [x] T002 Verify Playwright configuration in playwright.config.ts (browsers, retries, parallel execution)
- [x] T003 [P] Verify test utilities in src/test-utils/setup.ts (global mocks, jest-dom matchers)
- [x] T004 [P] Verify test utilities in src/test-utils/test-utils.tsx (render wrapper, userEvent exports)
- [x] T005 Verify test scripts in package.json (test, test:ui, test:coverage, test:e2e commands)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core test infrastructure that MUST be complete before user story work can begin.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Install and configure Vitest coverage provider (v8) with HTML reporter in vitest.config.ts
- [x] T007 [P] Configure Playwright trace and screenshot capture on failure in playwright.config.ts
- [x] T008 [P] Create mocking utilities for external dependencies in src/test-utils/mocks.ts (API, file system, database)
- [x] T009 Configure test timeout and retry settings for flaky test handling in vitest.config.ts and playwright.config.ts
- [x] T010 [P] Create accessibility testing utilities in src/test-utils/a11y.ts (ARIA label checks, keyboard navigation helpers)

**Checkpoint**: Foundational infrastructure complete. User stories may proceed.

---

## Phase 3: User Story 1 - Run Unit Tests for Agent Logic (Priority: P1) 🎯 MVP

**Goal**: Enable developers to run unit tests that execute quickly, show clear results, and generate coverage reports.

**Independent Test**: Create a simple agent tool function, write a unit test for it, run `bun test`. Verify test executes in under 1 second, shows pass/fail result, and generates coverage report showing tested lines.

### Implementation for User Story 1

- [x] T011 [US1] Verify unit test pattern matching `**/*.spec.{ts,tsx}` in vitest.config.ts
- [x] T012 [US1] Configure Vitest for fast execution (<10s for 100+ tests) in vitest.config.ts (threads, isolate)
- [x] T013 [US1] Enable coverage reporting with line, branch, function, and statement coverage in vitest.config.ts
- [x] T014 [US1] Create example unit test demonstrating pass/fail output in src/features/workflow/services/__tests__/example.spec.ts
- [x] T015 [US1] Verify coverage report generation with HTML output in coverage/ directory
- [x] T016 [US1] Configure clear test failure messages with expected vs actual values in vitest.config.ts

**Checkpoint**: User Story 1 fully functional - developers can run unit tests with coverage reports.

---

## Phase 4: User Story 2 - Test UI Components with User Interactions (Priority: P1)

**Goal**: Enable developers to test UI components with user interactions in simulated browser environment.

**Independent Test**: Create a button component with click handler, write component test that renders button and simulates click, verify handler is called. Test should execute quickly and provide clear feedback.

### Implementation for User Story 2

- [x] T017 [US2] Verify jsdom environment configuration for component testing in vitest.config.ts
- [x] T018 [US2] Enhance test-utils.tsx with accessibility query helpers (getByRole, getByLabelText examples)
- [x] T019 [US2] Create example component test with user interactions in src/components/__tests__/example.spec.tsx
- [x] T020 [US2] Verify form input simulation and validation testing in test-utils.tsx
- [x] T021 [US2] Add accessibility testing assertions using jest-dom matchers in src/test-utils/a11y.ts
- [x] T022 [US2] Document component testing patterns in docs/TESTING.md

**Checkpoint**: User Stories 1 & 2 operate independently - unit and component testing functional.

---

## Phase 5: User Story 3 - Run End-to-End Workflow Tests (Priority: P2)

**Goal**: Enable developers to run E2E tests that launch real browsers, execute workflows, and capture failure artifacts.

**Independent Test**: Write E2E test that opens workflow page, submits task, waits for completion, and verifies artifacts. Run test and verify it executes in real browser, provides screenshots on failure, and shows detailed execution trace.

### Implementation for User Story 3

- [x] T023 [P] [US3] Verify Playwright browser installation (chromium, firefox, webkit) in playwright.config.ts
- [x] T024 [US3] Configure Playwright screenshot capture on failure in playwright.config.ts
- [x] T025 [US3] Configure Playwright video recording on failure in playwright.config.ts
- [x] T026 [US3] Configure Playwright trace capture for debugging in playwright.config.ts
- [x] T027 [US3] Create example E2E test for workflow submission in src/app/__tests__/workflow.e2e.spec.ts
- [x] T028 [US3] Configure network request interception and mocking in playwright.config.ts or test utilities
- [x] T029 [US3] Verify parallel E2E test execution with resource isolation in playwright.config.ts
- [x] T030 [US3] Configure test retries for flaky E2E tests (2 retries in CI) in playwright.config.ts

**Checkpoint**: User Stories 1, 2 & 3 operate independently - E2E testing with artifact capture functional.

---

## Phase 6: User Story 4 - View Test Coverage Reports (Priority: P3)

**Goal**: Enable developers to view coverage reports showing percentages, uncovered lines, and branch coverage.

**Independent Test**: Run tests with coverage flag, verify HTML report generates showing file-by-file coverage with highlighted uncovered lines. Open report in browser and navigate through files.

### Implementation for User Story 4

- [x] T031 [US4] Configure Vitest coverage to include line, branch, function, and statement coverage in vitest.config.ts
- [x] T032 [US4] Verify HTML coverage report generation with file navigation in coverage/index.html
- [x] T033 [US4] Configure coverage thresholds (80%+ for critical paths) in vitest.config.ts
- [x] T034 [US4] Add coverage exclusion patterns for test files and generated code in vitest.config.ts
- [x] T035 [US4] Create coverage report viewing documentation in docs/TESTING.md
- [x] T036 [US4] Verify branch coverage visualization in HTML report (if/else paths highlighted)

**Checkpoint**: All user stories complete - comprehensive testing infrastructure ready.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: CI/CD integration, documentation, and final polish.

- [x] T037 [P] Create GitHub Actions workflow for running tests in CI in .github/workflows/test.yml
- [x] T038 [P] Configure CI to block merges on test failures in .github/workflows/test.yml
- [x] T039 [P] Add test execution reporting (pass/fail counts, duration) in CI workflow
- [x] T040 Verify watch mode functionality (auto re-run on file changes) in vitest.config.ts
- [x] T041 [P] Create testing documentation in docs/TESTING.md (unit, component, E2E patterns)
- [x] T042 [P] Create example test files demonstrating all test types in src/test-utils/examples/
- [x] T043 Verify parallel test execution reduces runtime by 50%+ compared to sequential
- [x] T044 [P] Add test timeout handling for slow async operations in vitest.config.ts and playwright.config.ts
- [x] T045 [P] Document test utilities and mocking patterns in docs/TESTING.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User Stories 1 & 2 (both P1) can proceed in parallel after Foundational
  - User Story 3 (P2) can start after Foundational (may benefit from US1/US2 examples)
  - User Story 4 (P3) can start after Foundational (depends on coverage setup)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent, can run parallel with US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Independent, may use examples from US1/US2
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Requires coverage setup from US1

### Within Each User Story

- Configuration tasks before example/test tasks
- Core functionality before documentation
- Verification before moving to next story

### Parallel Opportunities

- Setup tasks (T003, T004) can run in parallel
- Foundational tasks (T007, T008, T010) can run in parallel
- User Stories 1 & 2 (both P1) can be worked on in parallel after Foundational
- CI/CD tasks (T037, T038, T039) can run in parallel
- Documentation tasks (T041, T042, T045) can run in parallel

---

## Parallel Example: User Story 3

```bash
# Launch all Playwright configuration tasks together:
Task: "Verify Playwright browser installation in playwright.config.ts"
Task: "Configure Playwright screenshot capture in playwright.config.ts"
Task: "Configure Playwright video recording in playwright.config.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 - Both P1)

1. Complete Phase 1: Setup (verify existing infrastructure)
2. Complete Phase 2: Foundational (coverage, mocking, utilities)
3. Complete Phase 3: User Story 1 (unit tests)
4. Complete Phase 4: User Story 2 (component tests)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Unit Testing MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Component Testing MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (E2E Testing!)
5. Add User Story 4 → Test independently → Deploy/Demo (Coverage Reporting!)
6. Add Polish → CI/CD integration → Production Ready!

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Unit Tests)
   - Developer B: User Story 2 (Component Tests)
3. Next iteration:
   - Developer A: User Story 3 (E2E Tests)
   - Developer B: User Story 4 (Coverage Reports)
4. Final: Polish phase together

---

## Independent Test Criteria

- **US1**: Create simple agent tool function, write unit test, run `bun test`. Verify test executes <1s, shows pass/fail, generates coverage report.
- **US2**: Create button component with click handler, write component test, simulate click. Verify handler called, test executes quickly.
- **US3**: Write E2E test opening workflow page, submit task, wait for completion. Verify browser launches, screenshots on failure, trace captured.
- **US4**: Run tests with coverage, verify HTML report generates. Open report, verify file navigation, highlighted uncovered lines, branch coverage.

## MVP Scope

- Complete through **Phase 4 (US1 & US2)** to deliver unit and component testing capabilities. Subsequent phases add E2E testing and coverage reporting but are not required for MVP shipment.

## Summary

- **Total Tasks**: 45
- **Task Distribution**:
  - Phase 1 Setup: 5
  - Phase 2 Foundational: 5
  - US1: 6
  - US2: 6
  - US3: 8
  - US4: 6
  - Polish: 9
- **Parallel-Eligible Tasks**: 14 (marked `[P]`)
- **Parallel Story Opportunities**: US1 & US2 can proceed concurrently once Foundational completes

## Notes

- Most testing infrastructure already exists - tasks focus on verification, enhancement, and missing features
- Configuration tasks verify existing setup meets requirements
- Example tests demonstrate proper usage patterns
- CI/CD integration ensures tests run automatically
- Documentation helps developers use testing infrastructure effectively

