import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-utils/setup.ts"],
    include: ["**/*.spec.{ts,tsx}"],
    exclude: [
      "**/*.e2e.spec.{ts,tsx}",
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
    ],
    testTimeout: 10_000, // 10 seconds default timeout
    hookTimeout: 10_000, // 10 seconds for hooks
    teardownTimeout: 5000, // 5 seconds for teardown
    threads: true, // Enable parallel execution
    isolate: true, // Isolate each test file
    maxConcurrency: 5, // Limit concurrent tests
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.spec.{ts,tsx}",
        "**/*.e2e.spec.{ts,tsx}",
        "**/test-utils/**",
        "**/__tests__/**",
        "**/node_modules/**",
        "**/.next/**",
      ],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
