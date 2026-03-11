import type { ChatMessage, ToolDef } from "./gemini-stream";
import { streamGemini } from "./gemini-stream";
import type { Code } from "../lazy-imports/chatRoom";
import type Env from "../core-logic/env";
import { hashClientId, sendGA4Events } from "../core-logic/lib/ga4";
import { convertMessages } from "../lazy-imports/message-converter";
import type { MessageWithParts } from "../lazy-imports/message-converter";
import { validateMessages } from "../core-logic/lib/message-validation";
import { createSystemPrompt } from "../core-logic/lib/prompts";
import { validateToolsArray } from "../core-logic/lib/tool-adapter";
import type { McpTool } from "../core-logic/mcp/mcp-index.ts";
import { StorageService } from "../core-logic/services/storageService";
import type { ErrorResponse, PostRequestBody } from "../lazy-imports/types";
import { DEFAULT_CORS_HEADERS } from "../core-logic/utils";

type ProcessedToolsRecord = Record<string, ToolDef>;

export class PostHandler {
  private storageService: StorageService;

  constructor(
    private code: Code,
    private env: Env,
  ) {
    this.storageService = new StorageService(env);
  }

  async handle(request: Request, _url: URL): Promise<Response> {
    const requestId = crypto.randomUUID();

    try {
      // Validate request size
      const contentLength = request.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        return this.createErrorResponse("Request too large", 413);
      }

      const body = await this.parseRequestBody(request);

      // Validate and clean tools in the request body
      if (body.tools && Array.isArray(body.tools)) {
        const invalidTools = validateToolsArray(body.tools);
        if (invalidTools.length > 0) {
          console.warn(
            `[AI Routes][${requestId}] Found ${invalidTools.length} tools with invalid schemas:`,
            invalidTools,
          );
        }
      }

      // Validate messages
      const validationError = validateMessages(body.messages);
      if (validationError) {
        return this.createErrorResponse(validationError, 400);
      }

      const codeSpace = this.code.getSession().codeSpace;
      const messages = convertMessages(body.messages as MessageWithParts[]);

      // Track ai_message_request event (fire-and-forget)
      if (this.env.GA_MEASUREMENT_ID && this.env.GA_API_SECRET) {
        hashClientId(codeSpace)
          .then((clientId) =>
            sendGA4Events(this.env.GA_MEASUREMENT_ID, this.env.GA_API_SECRET, clientId, [
              {
                name: "ai_message_request",
                params: {
                  code_space: codeSpace,
                  request_id: requestId,
                },
              },
            ]),
          )
          .catch((err) => console.error("Failed to send GA4 event:", err));
      }

      await this.storageService.saveRequestBody(codeSpace, body);

      if (!this.env.CLAUDE_CODE_OAUTH_TOKEN) {
        return this.createErrorResponse(
          "CLAUDE_CODE_OAUTH_TOKEN not configured. Please add your OAuth token to .dev.vars file.",
          503,
        );
      }

      const tools = this.code.getMcpServer().tools;

      // Remove tools from body to ensure we only use MCP-generated tools
      const bodyWithoutTools = { ...body };
      delete bodyWithoutTools.tools;

      return await this.createStreamResponse(
        messages,
        tools,
        bodyWithoutTools,
        codeSpace,
        requestId,
      );
    } catch (error) {
      console.error(`[AI Routes][${requestId}] Error handling message:`, error);
      return this.createErrorResponse(
        "Failed to process message",
        500,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  private async parseRequestBody(request: Request): Promise<PostRequestBody> {
    try {
      return await request.json();
    } catch (parseError) {
      console.error("[AI Routes] Failed to parse request body:", parseError);
      throw new Error(
        `Invalid JSON in request body: ${
          parseError instanceof Error ? parseError.message : "Unknown parse error"
        }`,
      );
    }
  }

  private async createStreamResponse(
    messages: ChatMessage[],
    tools: McpTool[],
    body: PostRequestBody,
    codeSpace: string,
    requestId: string,
  ): Promise<Response> {
    const systemPrompt = createSystemPrompt(codeSpace);

    // Create a copy of messages to avoid mutation
    const messagesCopy = JSON.parse(JSON.stringify(body.messages));

    try {
      const disableTools = this.env.DISABLE_AI_TOOLS === "true";
      const processedTools = disableTools
        ? undefined
        : this.processTools(tools, codeSpace, requestId);

      const stream = streamGemini({
        apiKey: this.env.GEMINI_API_KEY,
        model: "gemini-3-flash-preview",
        systemPrompt,
        messages,
        ...(processedTools !== undefined && { tools: processedTools }),
        onToolResult: async (_toolName, result) => {
          try {
            messagesCopy.push({
              role: "assistant" as const,
              content: JSON.stringify(result),
            });

            await this.storageService.saveRequestBody(codeSpace, {
              ...body,
              messages: messagesCopy,
            });
          } catch (error) {
            console.error(
              `[AI Routes][${requestId}] Error saving messages after tool call:`,
              error,
            );
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...this.getCorsHeaders(),
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (streamErrorCaught) {
      console.error(`[AI Routes][${requestId}] Stream error details:`, {
        message: streamErrorCaught instanceof Error ? streamErrorCaught.message : "Unknown error",
        stack: streamErrorCaught instanceof Error ? streamErrorCaught.stack : undefined,
      });
      throw streamErrorCaught;
    }
  }

  processTools(tools: McpTool[], codeSpace: string, requestId: string): ProcessedToolsRecord {
    return tools.reduce<ProcessedToolsRecord>((acc, mcpTool) => {
      if (!mcpTool.inputSchema) {
        console.warn(
          `[AI Routes][${requestId}] Tool '${mcpTool.name}' has no inputSchema, skipping`,
        );
        return acc;
      }

      if (mcpTool.inputSchema.type !== "object") {
        console.error(
          `[AI Routes][${requestId}] Tool '${mcpTool.name}' has invalid inputSchema.type: '${mcpTool.inputSchema.type}', expected 'object'`,
        );
        return acc;
      }

      const mcpServerRef = this.code.getMcpServer();
      const toolName = mcpTool.name;

      acc[mcpTool.name] = {
        ...(mcpTool.description !== undefined && { description: mcpTool.description }),
        parameters: {
          type: "object",
          properties: mcpTool.inputSchema.properties as Record<string, unknown>,
          required: mcpTool.inputSchema.required as string[],
        },
        execute: async (args: Record<string, unknown>) => {
          try {
            const response = await mcpServerRef.executeTool(toolName, {
              ...args,
              codeSpace,
            });
            return response;
          } catch (error) {
            console.error(`[AI Routes][${requestId}] Error executing tool ${toolName}:`, error);
            throw new Error(
              `Failed to execute tool ${toolName}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            );
          }
        },
      };

      return acc;
    }, {});
  }

  private getCorsHeaders(): Record<string, string> {
    return DEFAULT_CORS_HEADERS;
  }

  private createErrorResponse(error: string, status: number, details?: string): Response {
    const errorResponse: ErrorResponse = { error };
    if (details) {
      errorResponse.details = details;
    }

    return new Response(JSON.stringify(errorResponse), {
      status,
      headers: this.getCorsHeaders(),
    });
  }
}
