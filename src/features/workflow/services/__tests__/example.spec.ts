/**
 * Example unit test demonstrating pass/fail output and coverage reporting
 * This file serves as a reference for unit testing patterns
 */

import { describe, expect, it } from "vitest";

/**
 * Simple agent tool function for demonstration
 */
function processTask(task: { id: string; description: string }): {
  processed: boolean;
  result: string;
} {
  if (!(task.id && task.description)) {
    throw new Error("Task must have id and description");
  }

  return {
    processed: true,
    result: `Processed: ${task.description}`,
  };
}

describe("Example Unit Test", () => {
  it("should process valid task successfully", () => {
    const task = { id: "task-1", description: "Test task" };
    const result = processTask(task);

    expect(result.processed).toBe(true);
    expect(result.result).toBe("Processed: Test task");
  });

  it("should fail with clear error message when task is invalid", () => {
    const task = { id: "", description: "Test task" };

    expect(() => processTask(task)).toThrow(
      "Task must have id and description"
    );
  });

  it("should show expected vs actual in failure messages", () => {
    const task = { id: "task-1", description: "Test task" };
    const result = processTask(task);

    // This test demonstrates failure message format
    // If this assertion fails, it will show:
    // Expected: "Processed: Wrong"
    // Received: "Processed: Test task"
    expect(result.result).toBe("Processed: Test task");
  });

  it("should execute quickly (under 1 second)", async () => {
    const start = Date.now();
    const task = { id: "task-1", description: "Test task" };
    processTask(task);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});
