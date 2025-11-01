import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

// Re-export everything from testing library
export * from "@testing-library/react";

// Re-export userEvent from the real library for full event simulation
export { userEvent };

// Custom render function that wraps Testing Library's render
export const renderWithProviders = (
  ui: ReactElement,
  options?: Parameters<typeof render>[1]
) => render(ui, options);
