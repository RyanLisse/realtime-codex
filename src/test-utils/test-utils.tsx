import { render } from "@testing-library/react";
import type { ReactElement } from "react";

// Re-export everything from testing library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";

// Custom render function that wraps Testing Library's render
export const renderWithProviders = (
  ui: ReactElement,
  options?: Parameters<typeof render>[1]
) => render(ui, options);
