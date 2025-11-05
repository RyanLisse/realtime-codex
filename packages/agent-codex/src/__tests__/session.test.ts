/**
 * Unit tests for Codex agent session management
 */

import { describe, expect, it } from "bun:test";

// Note: bun:test types are provided by Bun runtime
import {
  addMessageToSession,
  createCodexSession,
  updateCodexSession,
} from "../session.js";

describe("Codex Session Management", () => {
  it("should create a new codex session", () => {
    const session = createCodexSession("Test Agent");
    expect(session.type).toBe("codex");
    expect(session.status).toBe("idle");
    expect(session.metadata.name).toBe("Test Agent");
    expect(session.messages).toEqual([]);
  });

  it("should update session status", () => {
    const session = createCodexSession();
    const updated = updateCodexSession(session, { status: "active" });
    expect(updated.status).toBe("active");
    expect(updated.id).toBe(session.id);
  });

  it("should add message to session", () => {
    const session = createCodexSession();
    const updated = addMessageToSession(session, "user", "Hello");
    expect(updated.messages.length).toBe(1);
    expect(updated.messages[0]?.role).toBe("user");
    expect(updated.messages[0]?.content).toBe("Hello");
  });
});
