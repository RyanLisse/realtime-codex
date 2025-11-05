# Testing Guide

This document provides guidance on writing and running tests for the multi-agent workflow system.

## Test Types

### Unit Tests
Unit tests verify individual functions and modules in isolation.

**Location**: `src/**/*.spec.{ts,tsx}`  
**Runner**: Vitest  
**Pattern**: Tests matching `**/*.spec.{ts,tsx}`

**Example**:
```typescript
import { describe, expect, it } from "vitest";

describe("processTask", () => {
  it("should process valid task successfully", () => {
    const task = { id: "task-1", description: "Test task" };
    const result = processTask(task);
    expect(result.processed).toBe(true);
  });
});
```

**Running**:
```bash
bun test                    # Run all unit tests
bun test --run              # Run once (no watch)
bun test path/to/file.spec.ts  # Run specific test
```

### Component Tests
Component tests verify React components render correctly and handle user interactions.

**Location**: `src/components/__tests__/*.spec.tsx`  
**Runner**: Vitest with jsdom  
**Utilities**: `@/test-utils/test-utils.tsx`

**Example**:
```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  it("should render button correctly", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });
});
```

**Accessibility Testing**:
```typescript
import { expectAriaLabel, expectKeyboardAccessible } from "@/test-utils/a11y";

it("should be accessible", () => {
  const button = screen.getByRole("button");
  expectAriaLabel(button, "Accessible button");
  expectKeyboardAccessible(button);
});
```

### End-to-End Tests
E2E tests verify complete workflows in real browsers.

**Location**: `src/**/*.e2e.spec.{ts,tsx}`  
**Runner**: Playwright  
**Browsers**: Chromium, Firefox, WebKit

**Example**:
```typescript
import { test, expect } from "@playwright/test";

test("should submit workflow", async ({ page }) => {
  await page.goto("/");
  await page.fill('input[name="task"]', "Test task");
  await page.click('button[type="submit"]');
  await expect(page.locator(".success")).toBeVisible();
});
```

**Running**:
```bash
bun test:e2e              # Run all E2E tests
bun test:e2e:ui           # Run with UI mode
bun test:e2e:debug        # Run in debug mode
```

## Coverage Reports

### Generating Coverage
```bash
bun test:coverage         # Generate coverage report
```

### Viewing Coverage
Coverage reports are generated in the `coverage/` directory:
- **HTML Report**: `coverage/index.html` - Open in browser for interactive navigation
- **Text Report**: Displayed in terminal
- **JSON Report**: `coverage/coverage-final.json` - For CI/CD integration

### Coverage Thresholds
Current thresholds (configured in `vitest.config.ts`):
- **Lines**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Statements**: 80%

### Coverage Exclusions
The following are excluded from coverage:
- Test files (`**/*.spec.{ts,tsx}`, `**/*.e2e.spec.{ts,tsx}`)
- Test utilities (`**/test-utils/**`)
- Test directories (`**/__tests__/**`)
- Generated code (`**/.next/**`, `**/node_modules/**`)

### Branch Coverage
The HTML report highlights covered and uncovered branches:
- **Green**: Covered branches (executed)
- **Red**: Uncovered branches (not executed)
- **Yellow**: Partially covered branches

Navigate through files in the HTML report to see line-by-line and branch-by-branch coverage.

## Test Utilities

### Mocking Utilities
Location: `src/test-utils/mocks.ts`

**API Mocking**:
```typescript
import { createFetchMock } from "@/test-utils/mocks";

const mockFetch = createFetchMock({
  "/api/workflow": { status: 200, body: { id: "123" } },
  "*": { status: 404, body: { error: "Not found" } },
});
```

**File System Mocking**:
```typescript
import { mockFileSystem } from "@/test-utils/mocks";

mockFileSystem.readFile.mockResolvedValue("file content");
const content = await mockFileSystem.readFile("/path/to/file");
```

### Accessibility Utilities
Location: `src/test-utils/a11y.ts`

**Available Functions**:
- `expectAriaLabel(element, label)` - Verify ARIA label
- `expectLabeledInput(input)` - Verify input has label
- `expectKeyboardAccessible(element)` - Verify keyboard accessibility
- `expectValidAriaAttributes(element)` - Verify ARIA attributes are valid
- `expectScreenReaderCompatible(element)` - Verify screen reader compatibility

## Running Tests

### Watch Mode
```bash
bun test              # Watch mode (auto re-runs on file changes)
```

### Single Run
```bash
bun test --run        # Run once, exit
```

### Specific Tests
```bash
bun test path/to/file.spec.ts        # Run specific test file
bun test -t "test name"              # Run tests matching name
```

### Parallel Execution
Tests run in parallel by default (configured in `vitest.config.ts`):
- `threads: true` - Enable parallel execution
- `isolate: true` - Isolate each test file
- `maxConcurrency: 5` - Limit concurrent tests

## CI/CD Integration

Tests are configured to run in CI/CD pipelines:
- **Exit codes**: Tests exit with non-zero code on failure
- **Coverage reporting**: Coverage data available for CI integration
- **Parallel execution**: Optimized for CI environments

## Test Patterns

### Arrange-Act-Assert (AAA)
```typescript
it("should process task", () => {
  // Arrange
  const task = { id: "1", description: "Task" };
  
  // Act
  const result = processTask(task);
  
  // Assert
  expect(result.processed).toBe(true);
});
```

### Testing Async Code
```typescript
it("should handle async operations", async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Errors
```typescript
it("should throw on invalid input", () => {
  expect(() => processTask(null)).toThrow("Task must be valid");
});
```

### Mocking Functions
```typescript
import { vi } from "vitest";

const mockFn = vi.fn();
mockFn.mockReturnValue("mocked value");
expect(mockFn()).toBe("mocked value");
```

## Troubleshooting

### Tests Timing Out
- Increase timeout in `vitest.config.ts`: `testTimeout: 20000`
- Check for slow async operations
- Verify network requests are mocked

### Coverage Not Generating
- Ensure `--coverage` flag is used
- Check coverage provider is installed: `bun add -D @vitest/coverage-v8`
- Verify `coverage/` directory is writable

### E2E Tests Failing
- Verify dev server is running: `bun run dev`
- Check browser installation: `bunx playwright install`
- Review screenshots/videos in `test-results/` directory

### Component Tests Not Rendering
- Verify jsdom environment is configured
- Check that React is imported correctly
- Ensure test utilities are imported from `@/test-utils/test-utils`

## Best Practices

1. **Write tests first** (TDD approach)
2. **Test behavior, not implementation**
3. **Use semantic queries** (getByRole, getByLabelText)
4. **Mock external dependencies**
5. **Keep tests independent** (no shared state)
6. **Test edge cases** and error scenarios
7. **Maintain 80%+ coverage** for critical paths
8. **Keep tests fast** (< 10 seconds for unit tests)
9. **Use descriptive test names**
10. **Clean up after tests** (teardown, cleanup)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Accessibility Testing Guide](https://www.w3.org/WAI/test-evaluate/)


