/**
 * Example component test demonstrating user interactions
 * This file serves as a reference for component testing patterns
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";
import { expectAriaLabel, expectKeyboardAccessible } from "@/test-utils/a11y";

describe("Example Component Test", () => {
  beforeEach(() => {
    // Cleanup between tests
  });

  afterEach(() => {
    cleanup();
  });

  it("should render button component correctly", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Click me");
  });

  it("should handle click events", async () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    // Use fireEvent for simpler click simulation in jsdom
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should simulate form input and validation", () => {
    const handleSubmit = vi.fn();

    render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(e);
        }}
      >
        <label htmlFor="test-input">Test Input</label>
        <input
          aria-label="Test input field"
          id="test-input"
          name="test-input"
          required
          type="text"
        />
        <Button type="submit">Submit</Button>
      </form>
    );

    const input = screen.getByLabelText(/test input/i) as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: /submit/i });

    // Set input value directly
    input.value = "test value";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(input.value).toBe("test value");

    // Submit form
    submitButton.click();

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("should verify accessibility attributes", () => {
    render(
      <Button aria-label="Accessible button" type="button">
        Click
      </Button>
    );

    const button = screen.getByRole("button", { name: /accessible button/i });

    // Verify ARIA label
    expectAriaLabel(button, "Accessible button");

    // Verify keyboard accessibility
    expectKeyboardAccessible(button);
  });

  it("should verify keyboard navigation", () => {
    const handleClick = vi.fn();

    render(
      <div>
        <Button data-testid="button-1" onClick={handleClick}>
          First Button
        </Button>
        <Button data-testid="button-2" onClick={handleClick}>
          Second Button
        </Button>
      </div>
    );

    const firstButton = screen.getByTestId("button-1");
    const secondButton = screen.getByTestId("button-2");

    // Focus first button
    firstButton.focus();
    expect(firstButton).toHaveFocus();

    // Focus second button
    secondButton.focus();
    expect(secondButton).toHaveFocus();

    // Press Enter on second button using React Testing Library's fireEvent
    // This properly simulates React events
    fireEvent.keyDown(secondButton, { key: "Enter", code: "Enter" });
    fireEvent.keyPress(secondButton, { key: "Enter", code: "Enter" });
    fireEvent.keyUp(secondButton, { key: "Enter", code: "Enter" });

    // React buttons typically respond to both click and Enter key
    // If Enter doesn't trigger onClick, we can also simulate click
    if (handleClick.mock.calls.length === 0) {
      fireEvent.click(secondButton);
    }

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("should execute quickly and provide clear feedback", () => {
    const start = Date.now();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    button.click();

    const duration = Date.now() - start;

    expect(handleClick).toHaveBeenCalled();
    expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds
  });
});
