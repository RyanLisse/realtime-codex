import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

// Re-export everything from testing library
export * from "@testing-library/react";

// Re-export userEvent from the real library for full event simulation
export { userEvent };

// Re-export commonly used queries for convenience
export { screen, waitFor };

/**
 * Custom render function that wraps Testing Library's render
 * Provides consistent test setup for all components
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Parameters<typeof render>[1]
) => render(ui, options);

/**
 * Accessibility query helpers
 * These demonstrate semantic query patterns for component testing
 */

// Example: Get by role with accessible name
export function getByRoleWithName(
  role: string,
  name: string | RegExp
): HTMLElement {
  return screen.getByRole(role, { name });
}

// Example: Get by label text (for form inputs)
export function getByLabelText(text: string | RegExp): HTMLElement {
  return screen.getByLabelText(text);
}

// Example: Get by placeholder text
export function getByPlaceholderText(text: string | RegExp): HTMLElement {
  return screen.getByPlaceholderText(text);
}

// Example: Get by text content
export function getByText(text: string | RegExp): HTMLElement {
  return screen.getByText(text);
}
