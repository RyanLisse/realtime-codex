import "@testing-library/jest-dom";

// Global test utilities
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Mock implementation for tests
  }
  unobserve() {
    // Mock implementation for tests
  }
  disconnect() {
    // Mock implementation for tests
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = "";
  thresholds = [];
  observe() {
    // Mock implementation for tests
  }
  unobserve() {
    // Mock implementation for tests
  }
  disconnect() {
    // Mock implementation for tests
  }
  takeRecords() {
    return [];
  }
};
