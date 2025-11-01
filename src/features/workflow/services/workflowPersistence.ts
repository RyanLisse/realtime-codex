import { promises as fs } from "fs";
import * as path from "path";
import {
  type Workflow,
  type WorkflowId,
  type WorkflowPersistence,
  WorkflowSchema,
  type WorkflowStatus,
} from "../types/workflow.types";

export class FileWorkflowPersistence implements WorkflowPersistence {
  private readonly workflowsDir: string;

  constructor(workflowsDir = "./workflows") {
    this.workflowsDir = workflowsDir;
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    // TODO: Implement atomic file writing with backup
    // TODO: Serialize dates properly
    // TODO: Handle concurrent access
    throw new Error("FileWorkflowPersistence.saveWorkflow not implemented");
  }

  async loadWorkflow(id: WorkflowId): Promise<Workflow | null> {
    // TODO: Implement workflow loading from JSON file
    // TODO: Deserialize dates from ISO strings
    // TODO: Validate loaded data with Zod schema
    // TODO: Handle file not found gracefully
    throw new Error("FileWorkflowPersistence.loadWorkflow not implemented");
  }

  async listWorkflows(status?: WorkflowStatus): Promise<Workflow[]> {
    // TODO: Scan workflows directory for JSON files
    // TODO: Filter by status if provided
    // TODO: Load and validate each workflow
    // TODO: Return sorted by creation date
    throw new Error("FileWorkflowPersistence.listWorkflows not implemented");
  }

  async deleteWorkflow(id: WorkflowId): Promise<void> {
    // TODO: Delete workflow JSON file
    // TODO: Handle file not found gracefully
    // TODO: Consider backup/archive instead of deletion
    throw new Error("FileWorkflowPersistence.deleteWorkflow not implemented");
  }

  // Helper methods for file operations
  private getWorkflowFilePath(workflowId: WorkflowId): string {
    return path.join(this.workflowsDir, `${workflowId}.json`);
  }

  private async ensureWorkflowsDirectory(): Promise<void> {
    try {
      await fs.access(this.workflowsDir);
    } catch {
      await fs.mkdir(this.workflowsDir, { recursive: true });
    }
  }

  private serializeWorkflow(workflow: Workflow): string {
    // TODO: Implement proper serialization with date handling
    return JSON.stringify(workflow, null, 2);
  }

  private deserializeWorkflow(json: string): Workflow {
    // TODO: Implement proper deserialization with date parsing and validation
    const data = JSON.parse(json);
    return WorkflowSchema.parse(data);
  }
}
