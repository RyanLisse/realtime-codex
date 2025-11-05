/**
 * Example component test demonstrating user interactions
 * This file serves as a reference for component testing patterns
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
          id="test-input"
          name="test-input"
          type="text"
          required
          aria-label="Test input field"
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
        <Button onClick={handleClick} data-testid="button-1">
          First Button
        </Button>
        <Button onClick={handleClick} data-testid="button-2">
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

    // Press Enter on second button
    secondButton.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
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

