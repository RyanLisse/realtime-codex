import { beforeEach, describe, expect, it, vi } from "vitest";
import { CodexMcpService } from "./codexMcp.service";

type ToolCallParams = {
  name: string;
  arguments: Record<string, unknown>;
  timeoutMs?: number;
};

type ToolResult = {
  content?: Array<{ type: "text"; text: string }>;
  data?: unknown;
};

class MockClient {
  connect = vi.fn<[], Promise<void>>(() => Promise.resolve());
  close = vi.fn<[], Promise<void>>(() => Promise.resolve());
  callTool = vi.fn<[ToolCallParams], Promise<ToolResult>>(() =>
    Promise.resolve({ content: [{ type: "text", text: "" }] })
  );
}

describe("CodexMcpService", () => {
  let client: MockClient;
  let service: CodexMcpService;

  beforeEach(() => {
    client = new MockClient();
    service = new CodexMcpService({
      clientFactory: () => client,
      maxRetries: 2,
      retryDelayMs: 0,
      requestTimeoutMs: 50,
    });
  });

  it("connects to the MCP server once", async () => {
    await service.connect();
    await service.connect();

    expect(client.connect).toHaveBeenCalledTimes(1);
  });

  it("disconnects from the MCP server", async () => {
    await service.connect();
    await service.disconnect();

    expect(client.close).toHaveBeenCalledTimes(1);
  });

  it("reads files via the MCP server", async () => {
    client.callTool.mockResolvedValueOnce({
      content: [{ type: "text", text: "file contents" }],
    });

    const contents = await service.readFile("/path/to/file.ts");

    expect(client.callTool).toHaveBeenCalledWith({
      name: "filesystem.readFile",
      arguments: { path: "/path/to/file.ts" },
      timeoutMs: 50,
    });
    expect(contents).toBe("file contents");
  });

  it("writes files via the MCP server", async () => {
    client.callTool.mockResolvedValueOnce({ content: [] });

    await service.writeFile("/path/to/file.ts", "console.log('hi')");

    expect(client.callTool).toHaveBeenCalledWith({
      name: "filesystem.writeFile",
      arguments: {
        path: "/path/to/file.ts",
        content: "console.log('hi')",
      },
      timeoutMs: 50,
    });
  });

  it("deletes files via the MCP server", async () => {
    client.callTool.mockResolvedValueOnce({ content: [] });

    await service.deleteFile("/path/to/file.ts");

    expect(client.callTool).toHaveBeenCalledWith({
      name: "filesystem.deleteFile",
      arguments: { path: "/path/to/file.ts" },
      timeoutMs: 50,
    });
  });

  it("generates code snippets via Codex", async () => {
    client.callTool.mockResolvedValueOnce({
      content: [{ type: "text", text: "function add(a, b) { return a + b; }" }],
    });

    const result = await service.generateCode("Add two numbers", {
      language: "typescript",
    });

    expect(client.callTool).toHaveBeenCalledWith({
      name: "codex.generateCode",
      arguments: {
        prompt: "Add two numbers",
        language: "typescript",
      },
      timeoutMs: 50,
    });
    expect(result).toContain("return a + b");
  });

  it("retries failed tool calls", async () => {
    client.callTool
      .mockRejectedValueOnce(new Error("temporary failure"))
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "retry success" }],
      });

    const result = await service.readFile("/retry/path");

    expect(client.callTool).toHaveBeenCalledTimes(2);
    expect(result).toBe("retry success");
  });
});
