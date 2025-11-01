export type McpToolCallParams = {
  name: string;
  arguments: Record<string, unknown>;
  timeoutMs?: number;
};

export type McpToolResult = {
  content?: Array<{ type: "text"; text: string }>;
  data?: unknown;
};

export interface McpClient {
  connect(): Promise<void>;
  close(): Promise<void>;
  callTool(params: McpToolCallParams): Promise<McpToolResult>;
}

export type CodexMcpServiceOptions = {
  clientFactory: () => McpClient;
  maxRetries?: number;
  retryDelayMs?: number;
  requestTimeoutMs?: number;
};

const DEFAULT_RETRY_DELAY_MS = 100;

export class CodexMcpService {
  private client?: McpClient;
  private connected = false;
  private connecting?: Promise<void>;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly requestTimeoutMs: number;

  constructor(private readonly options: CodexMcpServiceOptions) {
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 30_000;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    if (!this.connecting) {
      this.connecting = this.executeWithRetry(async () => {
        await this.getClient().connect();
        this.connected = true;
      });
    }

    try {
      await this.connecting;
    } catch (error) {
      this.connected = false;
      await this.disposeClient();
      throw error;
    } finally {
      this.connecting = undefined;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.disposeClient();
  }

  async readFile(path: string): Promise<string> {
    const result = await this.callTool({
      name: "filesystem.readFile",
      arguments: { path },
      timeoutMs: this.requestTimeoutMs,
    });

    const text = this.extractText(result);
    if (text === undefined) {
      throw new Error(`No content returned when reading ${path}`);
    }

    return text;
  }

  async writeFile(path: string, content: string): Promise<void> {
    await this.callTool({
      name: "filesystem.writeFile",
      arguments: { path, content },
      timeoutMs: this.requestTimeoutMs,
    });
  }

  async deleteFile(path: string): Promise<void> {
    await this.callTool({
      name: "filesystem.deleteFile",
      arguments: { path },
      timeoutMs: this.requestTimeoutMs,
    });
  }

  async generateCode(
    prompt: string,
    options: { language?: string } = {}
  ): Promise<string> {
    const result = await this.callTool({
      name: "codex.generateCode",
      arguments: { prompt, ...options },
      timeoutMs: this.requestTimeoutMs,
    });

    const text = this.extractText(result);
    if (text === undefined) {
      throw new Error("Codex did not return any code snippet");
    }

    return text;
  }

  private async callTool(params: McpToolCallParams): Promise<McpToolResult> {
    await this.connect();
    return this.executeWithRetry(() => this.getClient().callTool(params));
  }

  private getClient(): McpClient {
    if (!this.client) {
      this.client = this.options.clientFactory();
    }

    return this.client;
  }

  private extractText(result: McpToolResult): string | undefined {
    const firstText = result.content?.find((item) => item.type === "text");
    return firstText?.text;
  }

  private async disposeClient(): Promise<void> {
    if (!this.client) {
      this.connected = false;
      return;
    }

    try {
      await this.client.close();
    } catch {
      // Ignore errors during cleanup to avoid masking the original failure.
    } finally {
      this.client = undefined;
      this.connected = false;
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === this.maxRetries) {
          throw error;
        }
        await this.delay(this.retryDelayMs);
      }
    }

    throw lastError ?? new Error("Operation failed");
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
