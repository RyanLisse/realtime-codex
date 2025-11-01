import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AgentTask, Requirement } from "../types/artifact.types";
import { ArtifactManager } from "./artifactManager";

describe("ArtifactManager", () => {
  let manager: ArtifactManager;

  beforeEach(() => {
    manager = new ArtifactManager("/tmp/artifacts-test");
  });

  afterEach(async () => {
    // Clean up test files
    await manager.deleteAll();
  });

  describe("create", () => {
    it("should create a requirement artifact", async () => {
      const requirement: Requirement = {
        id: "req-1",
        title: "User Authentication",
        description: "Users must be able to login",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: ["User can login with email/password"],
        relatedTasks: ["task-1"],
        metadata: {
          id: "req-1",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const result = await manager.create(requirement);
      expect(result).toBe(requirement.id);
    });

    it("should create an agent task artifact", async () => {
      const task: AgentTask = {
        id: "task-1",
        workflowTaskId: "workflow-task-1",
        agentType: "FrontendDeveloper",
        description: "Implement login form",
        status: "pending",
        assignedTo: ["FrontendDeveloper"],
        dependencies: [],
        metadata: {
          id: "task-1",
          type: "agent-task",
          workflowId: "workflow-1",
          agentType: "FrontendDeveloper",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const result = await manager.create(task);
      expect(result).toBe(task.id);
    });

    it("should throw error for invalid artifact data", async () => {
      const invalidArtifact = {
        id: "invalid",
        // Missing required fields
      } as any;

      await expect(manager.create(invalidArtifact)).rejects.toThrow();
    });
  });

  describe("get", () => {
    it("should retrieve an artifact by id", async () => {
      const requirement: Requirement = {
        id: "req-1",
        title: "User Authentication",
        description: "Users must be able to login",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: ["User can login with email/password"],
        relatedTasks: [],
        metadata: {
          id: "req-1",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await manager.create(requirement);
      const retrieved = await manager.get("req-1");

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("req-1");
    });

    it("should return undefined for non-existent artifact", async () => {
      const result = await manager.get("non-existent");
      expect(result).toBeUndefined();
    });
  });

  describe("update", () => {
    it("should update an existing artifact", async () => {
      const requirement: Requirement = {
        id: "req-1",
        title: "User Authentication",
        description: "Users must be able to login",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: [],
        relatedTasks: [],
        metadata: {
          id: "req-1",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await manager.create(requirement);

      const updated: Requirement = {
        ...requirement,
        status: "approved",
        metadata: {
          ...requirement.metadata,
          version: 2,
          updatedAt: new Date(),
        },
      };

      const result = await manager.update(updated);
      expect(result).toBe(true);

      const retrieved = (await manager.get("req-1")) as Requirement;
      expect(retrieved.status).toBe("approved");
      expect(retrieved.metadata.version).toBe(2);
    });

    it("should throw error when updating non-existent artifact", async () => {
      const requirement: Requirement = {
        id: "non-existent",
        title: "Test",
        description: "Test",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: [],
        relatedTasks: [],
        metadata: {
          id: "non-existent",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await expect(manager.update(requirement)).rejects.toThrow();
    });
  });

  describe("list", () => {
    it("should list all artifacts", async () => {
      const requirement1: Requirement = {
        id: "req-1",
        title: "User Authentication",
        description: "Login functionality",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: [],
        relatedTasks: [],
        metadata: {
          id: "req-1",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const requirement2: Requirement = {
        id: "req-2",
        title: "Password Reset",
        description: "Password reset functionality",
        priority: "should-have",
        status: "draft",
        acceptanceCriteria: [],
        relatedTasks: [],
        metadata: {
          id: "req-2",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await manager.create(requirement1);
      await manager.create(requirement2);

      const artifacts = await manager.list();
      expect(artifacts).toHaveLength(2);
    });

    it("should filter artifacts by type", async () => {
      const requirement: Requirement = {
        id: "req-1",
        title: "User Authentication",
        description: "Login functionality",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: [],
        relatedTasks: [],
        metadata: {
          id: "req-1",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const task: AgentTask = {
        id: "task-1",
        workflowTaskId: "workflow-task-1",
        agentType: "FrontendDeveloper",
        description: "Implement login form",
        status: "pending",
        assignedTo: ["FrontendDeveloper"],
        dependencies: [],
        metadata: {
          id: "task-1",
          type: "agent-task",
          workflowId: "workflow-1",
          agentType: "FrontendDeveloper",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await manager.create(requirement);
      await manager.create(task);

      const requirements = await manager.list({ type: "requirement" });
      expect(requirements).toHaveLength(1);
      expect(requirements[0].metadata.type).toBe("requirement");

      const tasks = await manager.list({ type: "agent-task" });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].metadata.type).toBe("agent-task");
    });
  });

  describe("export", () => {
    it("should export artifact as markdown", async () => {
      const requirement: Requirement = {
        id: "req-1",
        title: "User Authentication",
        description: "Users must be able to login",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: ["User can login with email/password"],
        relatedTasks: [],
        metadata: {
          id: "req-1",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await manager.create(requirement);
      const exported = await manager.export("req-1", "markdown");

      expect(exported).toContain("# User Authentication");
      expect(exported).toContain("Users must be able to login");
      expect(exported).toContain("must-have");
    });

    it("should export artifact as JSON", async () => {
      const requirement: Requirement = {
        id: "req-1",
        title: "User Authentication",
        description: "Users must be able to login",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: ["User can login with email/password"],
        relatedTasks: [],
        metadata: {
          id: "req-1",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await manager.create(requirement);
      const exported = await manager.export("req-1", "json");

      expect(exported).toContain('"id"');
      expect(exported).toContain('"title"');
      expect(exported).toContain("User Authentication");

      // Parse to ensure valid JSON
      const parsed = JSON.parse(exported);
      expect(parsed.id).toBe("req-1");
    });
  });

  describe("versioning", () => {
    it("should increment version on update", async () => {
      const requirement: Requirement = {
        id: "req-1",
        title: "User Authentication",
        description: "Users must be able to login",
        priority: "must-have",
        status: "draft",
        acceptanceCriteria: [],
        relatedTasks: [],
        metadata: {
          id: "req-1",
          type: "requirement",
          workflowId: "workflow-1",
          agentType: "ProjectManager",
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      await manager.create(requirement);

      const updated: Requirement = {
        ...requirement,
        metadata: {
          ...requirement.metadata,
          version: 2,
          updatedAt: new Date(),
        },
      };

      await manager.update(updated);
      const retrieved = (await manager.get("req-1")) as Requirement;

      expect(retrieved.metadata.version).toBe(2);
    });
  });
});
