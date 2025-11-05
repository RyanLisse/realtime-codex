import { promises as fs } from "fs";
import * as path from "path";
import { WorkflowSchema } from "../types/workflow.schema";
import type {
  HandoffRecord,
  Task,
  Workflow,
  WorkflowId,
  WorkflowPersistence,
  WorkflowStatus,
} from "../types/workflow.types";

type SerializableTask = Omit<
  Task,
  "createdAt" | "startedAt" | "completedAt"
> & {
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

type SerializableHandoffRecord = Omit<HandoffRecord, "timestamp"> & {
  timestamp: string;
};

interface SerializableWorkflow
  extends Omit<
    Workflow,
    "createdAt" | "updatedAt" | "taskQueue" | "completedTasks" | "history"
  > {
  createdAt: string;
  updatedAt: string;
  taskQueue: SerializableTask[];
  completedTasks: SerializableTask[];
  history: SerializableHandoffRecord[];
}

export class FileWorkflowPersistence implements WorkflowPersistence {
  private readonly workflowsDir: string;

  constructor(workflowsDir = "./workflows") {
    this.workflowsDir = workflowsDir;
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    await this.ensureWorkflowsDirectory();

    // Validate workflow prior to serialization to catch issues early
    WorkflowSchema.parse(workflow);

    const filePath = this.getWorkflowFilePath(workflow.id);
    const tempPath = `${filePath}.tmp`;
    const data = this.serializeWorkflow(workflow);

    await fs.writeFile(tempPath, data, "utf-8");
    await fs.rename(tempPath, filePath);
  }

  async loadWorkflow(id: WorkflowId): Promise<Workflow | null> {
    try {
      await this.ensureWorkflowsDirectory();
      const filePath = this.getWorkflowFilePath(id);
      const data = await fs.readFile(filePath, "utf-8");
      return this.deserializeWorkflow(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async listWorkflows(status?: WorkflowStatus): Promise<Workflow[]> {
    await this.ensureWorkflowsDirectory();
    const entries = await fs.readdir(this.workflowsDir);

    const workflows: Workflow[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".json")) {
        continue;
      }

      const workflow = await this.loadWorkflow(entry.replace(/\.json$/, ""));
      if (!workflow) {
        continue;
      }

      if (status && workflow.status !== status) {
        continue;
      }

      workflows.push(workflow);
    }

    return workflows.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }

  async deleteWorkflow(id: WorkflowId): Promise<void> {
    try {
      const filePath = this.getWorkflowFilePath(id);
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }
      throw error;
    }
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
    const serializable: SerializableWorkflow = {
      ...workflow,
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
      taskQueue: workflow.taskQueue.map((task) => this.serializeTask(task)),
      completedTasks: workflow.completedTasks.map((task) =>
        this.serializeTask(task)
      ),
      history: workflow.history.map((record) => ({
        ...record,
        timestamp: record.timestamp.toISOString(),
      })),
    };

    return JSON.stringify(serializable, null, 2);
  }

  private deserializeWorkflow(json: string): Workflow {
    const data = JSON.parse(json) as SerializableWorkflow;

    const workflow: Workflow = {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      taskQueue: data.taskQueue.map((task) => this.deserializeTask(task)),
      completedTasks: data.completedTasks.map((task) =>
        this.deserializeTask(task)
      ),
      history: data.history.map((record) => ({
        ...record,
        timestamp: new Date(record.timestamp),
      })),
    };

    return WorkflowSchema.parse(workflow);
  }

  private serializeTask(task: Task): SerializableTask {
    return {
      ...task,
      createdAt: task.createdAt.toISOString(),
      startedAt: task.startedAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
    };
  }

  private deserializeTask(task: SerializableTask): Task {
    return {
      ...task,
      createdAt: new Date(task.createdAt),
      startedAt: task.startedAt ? new Date(task.startedAt) : undefined,
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
    };
  }
}
