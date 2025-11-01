import { promises as fs } from "node:fs";
import { join } from "node:path";
import type { Artifact, ArtifactExportFormat } from "../types/artifact.types";
import {
  AgentTaskSchema,
  DesignSpecSchema,
  RequirementSchema,
  TestPlanSchema,
} from "../types/artifact.types";

export type ArtifactListFilter = {
  type?: string;
  workflowId?: string;
  agentType?: string;
};

export class ArtifactManager {
  private readonly artifactsDir: string;
  private readonly artifactsCache: Map<string, Artifact>;

  constructor(artifactsDir = "./artifacts") {
    this.artifactsDir = artifactsDir;
    this.artifactsCache = new Map();
  }

  private getFilePath(id: string): string {
    return join(this.artifactsDir, `${id}.json`);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.artifactsDir, { recursive: true });
  }

  private validateArtifact(artifact: Artifact): void {
    // Determine which schema to use based on artifact type
    const schema =
      artifact.metadata.type === "requirement"
        ? RequirementSchema
        : artifact.metadata.type === "agent-task"
          ? AgentTaskSchema
          : artifact.metadata.type === "test-plan"
            ? TestPlanSchema
            : artifact.metadata.type === "design-spec"
              ? DesignSpecSchema
              : null;

    if (!schema) {
      throw new Error(`Unknown artifact type: ${artifact.metadata.type}`);
    }

    schema.parse(artifact);
  }

  async create(artifact: Artifact): Promise<string> {
    this.validateArtifact(artifact);

    await this.ensureDir();

    const filePath = this.getFilePath(artifact.id);

    // Check if artifact already exists
    try {
      await fs.access(filePath);
      throw new Error(`Artifact with id ${artifact.id} already exists`);
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    // Store in cache
    this.artifactsCache.set(artifact.id, artifact);

    // Write to file
    await fs.writeFile(filePath, JSON.stringify(artifact, null, 2));

    return artifact.id;
  }

  async get(id: string): Promise<Artifact | undefined> {
    // Check cache first
    if (this.artifactsCache.has(id)) {
      return this.artifactsCache.get(id);
    }

    const filePath = this.getFilePath(id);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const artifact = JSON.parse(content) as Artifact;

      // Cache it
      this.artifactsCache.set(id, artifact);

      return artifact;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return;
      }
      throw error;
    }
  }

  async update(artifact: Artifact): Promise<boolean> {
    // Validate artifact
    this.validateArtifact(artifact);

    const filePath = this.getFilePath(artifact.id);

    // Check if artifact exists
    const existing = await this.get(artifact.id);
    if (!existing) {
      throw new Error(`Artifact with id ${artifact.id} does not exist`);
    }

    // Update cache
    this.artifactsCache.set(artifact.id, artifact);

    // Write to file
    await fs.writeFile(filePath, JSON.stringify(artifact, null, 2));

    return true;
  }

  async list(filter?: ArtifactListFilter): Promise<Artifact[]> {
    await this.ensureDir();

    try {
      const files = await fs.readdir(this.artifactsDir);
      const jsonFiles = files.filter((f) => f.endsWith(".json"));

      const artifacts: Artifact[] = [];

      for (const file of jsonFiles) {
        const id = file.replace(".json", "");
        const artifact = await this.get(id);

        if (artifact) {
          // Apply filters if provided
          if (filter) {
            if (filter.type && artifact.metadata.type !== filter.type) {
              continue;
            }
            if (
              filter.workflowId &&
              artifact.metadata.workflowId !== filter.workflowId
            ) {
              continue;
            }
            if (
              filter.agentType &&
              artifact.metadata.agentType !== filter.agentType
            ) {
              continue;
            }
          }

          artifacts.push(artifact);
        }
      }

      return artifacts;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async export(
    id: string,
    format: ArtifactExportFormat = "markdown"
  ): Promise<string> {
    const artifact = await this.get(id);
    if (!artifact) {
      throw new Error(`Artifact with id ${id} not found`);
    }

    switch (format) {
      case "markdown":
        return this.exportAsMarkdown(artifact);
      case "json":
        return this.exportAsJSON(artifact);
      case "html":
        return this.exportAsHTML(artifact);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private exportAsMarkdown(artifact: Artifact): string {
    let md = "";

    if (artifact.metadata.type === "requirement") {
      const req = artifact as any;
      md += `# ${req.title}\n\n`;
      md += `**Priority:** ${req.priority}\n\n`;
      md += `**Status:** ${req.status}\n\n`;
      md += `## Description\n\n${req.description}\n\n`;

      if (req.acceptanceCriteria.length > 0) {
        md += "## Acceptance Criteria\n\n";
        req.acceptanceCriteria.forEach((criteria: string) => {
          md += `- ${criteria}\n`;
        });
        md += "\n";
      }

      if (req.relatedTasks.length > 0) {
        md += "## Related Tasks\n\n";
        req.relatedTasks.forEach((task: string) => {
          md += `- ${task}\n`;
        });
        md += "\n";
      }
    } else if (artifact.metadata.type === "agent-task") {
      const task = artifact as any;
      md += `# ${task.description}\n\n`;
      md += `**Status:** ${task.status}\n\n`;
      md += `**Assigned To:** ${task.assignedTo.join(", ")}\n\n`;

      if (task.notes) {
        md += `## Notes\n\n${task.notes}\n\n`;
      }
    } else if (artifact.metadata.type === "test-plan") {
      const plan = artifact as any;
      md += `# ${plan.title}\n\n`;
      md += `**Test Level:** ${plan.testLevel}\n\n`;
      md += `## Description\n\n${plan.description}\n\n`;

      if (plan.testCases.length > 0) {
        md += "## Test Cases\n\n";
        plan.testCases.forEach((testCase: any) => {
          md += `### ${testCase.description}\n\n`;
          md += `**Status:** ${testCase.status}\n\n`;
          md += `**Priority:** ${testCase.priority}\n\n`;
          md += `**Expected Result:** ${testCase.expectedResult}\n\n`;
          if (testCase.actualResult) {
            md += `**Actual Result:** ${testCase.actualResult}\n\n`;
          }
        });
      }
    } else if (artifact.metadata.type === "design-spec") {
      const spec = artifact as any;
      md += `# ${spec.componentName}\n\n`;
      md += `## Description\n\n${spec.description}\n\n`;

      if (spec.props.length > 0) {
        md += "## Props\n\n";
        spec.props.forEach((prop: any) => {
          md += `- **${prop.name}** (${prop.type}) ${prop.required ? "(required)" : ""}: ${prop.description || ""}\n`;
        });
        md += "\n";
      }

      if (spec.colorPalette) {
        md += "## Color Palette\n\n";
        Object.entries(spec.colorPalette).forEach(([key, value]) => {
          md += `- **${key}**: ${value}\n`;
        });
        md += "\n";
      }
    }

    // Add metadata
    md += "---\n\n";
    md += `**Created:** ${artifact.metadata.createdAt.toISOString()}\n`;
    md += `**Last Updated:** ${artifact.metadata.updatedAt.toISOString()}\n`;
    md += `**Version:** ${artifact.metadata.version}\n`;

    return md;
  }

  private exportAsJSON(artifact: Artifact): string {
    return JSON.stringify(artifact, null, 2);
  }

  private exportAsHTML(artifact: Artifact): string {
    const md = this.exportAsMarkdown(artifact);
    // Simple markdown to HTML conversion
    let html = md
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^\*\*(.*)\*\*$/gim, "<strong>$1</strong>")
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    html = `<html><head><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}</style></head><body><p>${html}</p></body></html>`;
    return html;
  }

  async delete(id: string): Promise<boolean> {
    const filePath = this.getFilePath(id);

    try {
      await fs.unlink(filePath);
      this.artifactsCache.delete(id);
      return true;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    const artifacts = await this.list();

    for (const artifact of artifacts) {
      await this.delete(artifact.id);
    }
  }
}
