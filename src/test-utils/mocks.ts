/**
 * Mocking utilities for external dependencies in tests
 * Supports API mocking, file system mocking, and database mocking
 */

import { vi } from "vitest";

/**
 * Mock API fetch responses
 */
export function createFetchMock(
  responses: Record<string, { status: number; body: unknown }>
) {
  return vi.fn((url: string | URL | Request) => {
    const urlString =
      typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
    const response = responses[urlString] || responses["*"];

    if (!response) {
      throw new Error(`No mock response for URL: ${urlString}`);
    }

    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText:
        response.status >= 200 && response.status < 300 ? "OK" : "Error",
      json: () => Promise.resolve(response.body),
      text: () => Promise.resolve(JSON.stringify(response.body)),
      headers: new Headers({ "Content-Type": "application/json" }),
    } as Response);
  });
}

/**
 * Mock file system operations
 */
export const mockFileSystem = {
  readFile: vi.fn<[string], Promise<string>>(),
  writeFile: vi.fn<[string, string], Promise<void>>(),
  exists: vi.fn<[string], Promise<boolean>>(),
  mkdir: vi.fn<[string], Promise<void>>(),
  rm: vi.fn<[string], Promise<void>>(),
};

/**
 * Mock database operations
 */
export const mockDatabase = {
  query: vi.fn(),
  transaction: vi.fn(),
  close: vi.fn(),
};

/**
 * Reset all mocks between tests
 */
export function resetAllMocks() {
  vi.clearAllMocks();
  mockFileSystem.readFile.mockReset();
  mockFileSystem.writeFile.mockReset();
  mockFileSystem.exists.mockReset();
  mockFileSystem.mkdir.mockReset();
  mockFileSystem.rm.mockReset();
  mockDatabase.query.mockReset();
  mockDatabase.transaction.mockReset();
  mockDatabase.close.mockReset();
}

/**
 * Create a mock function with typed signature
 */
export function createMockFn<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): ReturnType<typeof vi.fn<T>> {
  return vi.fn(implementation);
}

/**
 * Mock environment variables
 */
export function mockEnv(env: Record<string, string>) {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env };
  return () => {
    process.env = originalEnv;
  };
}

/**
 * Mock Next.js server actions
 */
export function mockServerAction<T>(
  actionName: string,
  implementation: T
): ReturnType<typeof vi.fn> {
  return vi.fn(implementation) as unknown as ReturnType<typeof vi.fn<T>>;
}

/**
 * Mock file system paths
 */
export const mockPaths = {
  workflows: "/tmp/test-workflows",
  artifacts: "/tmp/test-artifacts",
  logs: "/tmp/test-logs",
};
