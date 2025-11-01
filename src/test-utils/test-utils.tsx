import { fireEvent, render } from "@testing-library/react";
import type { ReactElement } from "react";

// Re-export everything from testing library
export * from "@testing-library/react";

export const userEvent = {
  async click(element: Element) {
    fireEvent.click(element);
  },
  async type(element: HTMLInputElement | HTMLTextAreaElement, text: string) {
    for (const char of text.split("")) {
      const newValue = `${element.value ?? ""}${char}`;
      element.value = newValue;
      fireEvent.input(element, {
        target: { value: newValue },
      });
    }
  },
};

// Custom render function that wraps Testing Library's render
export const renderWithProviders = (
  ui: ReactElement,
  options?: Parameters<typeof render>[1]
) => render(ui, options);
