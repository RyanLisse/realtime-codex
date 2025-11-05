/**
 * Accessibility testing utilities
 * Provides helpers for verifying ARIA labels, keyboard navigation, and screen reader compatibility
 */

import { screen, within } from "@testing-library/react";
import { expect } from "vitest";

/**
 * Verify that an element has proper ARIA label
 */
export function expectAriaLabel(element: HTMLElement, label: string): void {
  const ariaLabel = element.getAttribute("aria-label");
  const ariaLabelledBy = element.getAttribute("aria-labelledby");

  // Check direct aria-label match
  if (ariaLabel === label) {
    return;
  }

  // Check aria-labelledby reference
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    if (labelElement && labelElement.textContent?.includes(label)) {
      return;
    }
  }

  // Check if element text content matches
  if (element.textContent?.includes(label)) {
    return;
  }

  throw new Error(
    `Expected element to have aria-label="${label}" or aria-labelledby pointing to label with "${label}"`
  );
}

/**
 * Verify that form inputs have associated labels
 */
export function expectLabeledInput(input: HTMLElement): void {
  const id = input.getAttribute("id");
  if (!id) {
    throw new Error("Input element must have an id attribute");
  }

  const label = document.querySelector(`label[for="${id}"]`);
  const ariaLabel = input.getAttribute("aria-label");
  const ariaLabelledBy = input.getAttribute("aria-labelledby");

  if (!label && !ariaLabel && !ariaLabelledBy) {
    throw new Error(
      `Input with id="${id}" must have an associated label, aria-label, or aria-labelledby`
    );
  }
}

/**
 * Verify keyboard navigation order (tab order)
 */
export function expectKeyboardNavigation(
  elements: HTMLElement[],
  expectedOrder: string[]
): void {
  const tabIndices = elements.map((el) => {
    const tabIndex = el.getAttribute("tabindex");
    return tabIndex ? parseInt(tabIndex, 10) : el.tabIndex;
  });

  // Check that focusable elements are in expected order
  elements.forEach((el, index) => {
    const expectedId = expectedOrder[index];
    if (expectedId && el.id !== expectedId) {
      const actualElement = elements.find((e) => e.id === expectedId);
      if (actualElement && actualElement.tabIndex > el.tabIndex) {
        throw new Error(
          `Keyboard navigation order incorrect: expected ${expectedId} before ${el.id}`
        );
      }
    }
  });
}

/**
 * Verify that interactive elements are keyboard accessible
 */
export function expectKeyboardAccessible(element: HTMLElement): void {
  const role = element.getAttribute("role");
  const tagName = element.tagName.toLowerCase();
  const isNativelyFocusable =
    tagName === "a" ||
    tagName === "button" ||
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea";

  const hasTabIndex = element.hasAttribute("tabindex");
  const tabIndexValue = element.getAttribute("tabindex");

  if (!isNativelyFocusable && !hasTabIndex) {
    throw new Error(
      `Element ${tagName} with role="${role}" is not keyboard accessible. Add tabindex="0" or use a native interactive element.`
    );
  }

  if (tabIndexValue && parseInt(tabIndexValue, 10) > 0) {
    throw new Error(
      `Element has tabindex="${tabIndexValue}" which is > 0. Use tabindex="0" for keyboard accessibility.`
    );
  }
}

/**
 * Verify ARIA attributes are valid for the element's role
 */
export function expectValidAriaAttributes(element: HTMLElement): void {
  const role = element.getAttribute("role");
  if (!role) return;

  // Check for required ARIA attributes based on role
  const roleRequirements: Record<string, string[]> = {
    button: [],
    checkbox: ["aria-checked"],
    radio: ["aria-checked"],
    textbox: ["aria-label", "aria-labelledby"],
    combobox: ["aria-expanded", "aria-controls"],
    dialog: ["aria-label", "aria-labelledby"],
    alertdialog: ["aria-label", "aria-labelledby"],
    tab: ["aria-selected", "aria-controls"],
    tabpanel: ["aria-labelledby"],
  };

  const required = roleRequirements[role] || [];
  for (const attr of required) {
    if (!element.hasAttribute(attr)) {
      throw new Error(
        `Element with role="${role}" must have ${attr} attribute`
      );
    }
  }
}

/**
 * Verify that heading hierarchy is correct (h1 → h2 → h3, no skipping)
 */
export function expectHeadingHierarchy(headings: HTMLElement[]): void {
  let lastLevel = 0;
  for (const heading of headings) {
    const match = heading.tagName.match(/^H(\d)$/i);
    if (!match) continue;

    const level = parseInt(match[1], 10);
    if (level > lastLevel + 1) {
      throw new Error(
        `Heading hierarchy skipped: h${lastLevel} → h${level}. Headings must be in order.`
      );
    }
    lastLevel = level;
  }
}

/**
 * Verify that images have alt text
 */
export function expectImageAltText(img: HTMLImageElement): void {
  const alt = img.getAttribute("alt");
  if (alt === null) {
    throw new Error("Image element must have alt attribute");
  }
  if (alt === "" && !img.hasAttribute("aria-hidden")) {
    // Empty alt is OK if image is decorative and aria-hidden
    throw new Error(
      'Image with empty alt text must have aria-hidden="true" if decorative'
    );
  }
}

/**
 * Verify that focus indicators are visible (for keyboard navigation)
 */
export function expectFocusIndicator(element: HTMLElement): void {
  const styles = window.getComputedStyle(element, ":focus");
  const hasOutline = styles.outlineWidth !== "0px" && styles.outline !== "none";
  const hasBoxShadow = styles.boxShadow !== "none";
  const hasBorder = styles.borderWidth !== "0px";

  if (!hasOutline && !hasBoxShadow && !hasBorder) {
    // Check if element has focus-visible styles via classes
    const hasFocusClass = element.classList.contains("focus-visible");
    if (!hasFocusClass) {
      throw new Error(
        "Element must have visible focus indicator (outline, box-shadow, or border) for keyboard navigation"
      );
    }
  }
}

/**
 * Test keyboard navigation flow
 */
export async function testKeyboardNavigation(
  startElement: HTMLElement,
  keySequence: Array<{ key: string; expectedFocus: string }>
): Promise<void> {
  startElement.focus();
  for (const { key, expectedFocus } of keySequence) {
    const event = new KeyboardEvent("keydown", { key, bubbles: true });
    document.activeElement?.dispatchEvent(event);

    const focused = document.activeElement;
    if (!focused || focused.id !== expectedFocus) {
      throw new Error(
        `Expected focus on element with id="${expectedFocus}" after pressing ${key}, but got ${focused.id || focused.tagName}`
      );
    }
  }
}

/**
 * Verify screen reader compatibility by checking ARIA attributes
 */
export function expectScreenReaderCompatible(element: HTMLElement): void {
  const role = element.getAttribute("role");
  const ariaLabel = element.getAttribute("aria-label");
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  const ariaDescribedBy = element.getAttribute("aria-describedby");
  const textContent = element.textContent?.trim();

  // Element must be accessible to screen readers
  if (
    element.hasAttribute("aria-hidden") &&
    element.getAttribute("aria-hidden") === "true"
  ) {
    return; // Hidden elements don't need labels
  }

  // Interactive elements need labels
  const isInteractive =
    role === "button" ||
    role === "link" ||
    role === "checkbox" ||
    role === "radio" ||
    role === "textbox" ||
    element.tagName === "BUTTON" ||
    element.tagName === "A" ||
    element.tagName === "INPUT";

  if (isInteractive && !ariaLabel && !ariaLabelledBy && !textContent) {
    throw new Error(
      "Interactive element must have aria-label, aria-labelledby, or text content for screen readers"
    );
  }
}

/**
 * Get all focusable elements in order
 */
export function getFocusableElements(
  container: HTMLElement = document.body
): HTMLElement[] {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter((el) => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    })
    .sort((a, b) => {
      const aIndex = a.tabIndex || 0;
      const bIndex = b.tabIndex || 0;
      return aIndex - bIndex;
    });
}
