/**
 * Thin Gemini REST streaming client — replaces Vercel AI SDK (`ai` + `@ai-sdk/google`).
 *
 * Sends SSE events the frontend already understands:
 *   data: {"type":"text_delta","text":"…"}
 *   data: {"type":"tool_call_start","name":"…","toolCallId":"…","args":{…},"transport":"server"}
 *   data: {"type":"tool_call_end","toolCallId":"…","name":"…","result":…}
 *   data: [DONE]
 */

// ── Local types (replace AI SDK types) ──────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | ContentPart[];
}

export interface ContentPart {
  type: string;
  text?: string;
  image?: string;
}

export interface ToolDef {
  description?: string;
  parameters: JsonSchema;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

interface JsonSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

// ── Gemini API types ────────────────────────────────────────────────────────

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: { result: unknown } } };

interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: JsonSchema;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

interface GeminiStreamChunk {
  candidates?: GeminiCandidate[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function contentToString(content: string | ContentPart[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");
}

function toGeminiContents(messages: ChatMessage[]): {
  contents: GeminiContent[];
  systemInstruction?: { parts: { text: string }[] };
} {
  let systemInstruction: { parts: { text: string }[] } | undefined;
  const contents: GeminiContent[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemInstruction = { parts: [{ text: contentToString(msg.content) }] };
      continue;
    }

    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: contentToString(msg.content) }],
    });
  }

  return { contents, ...(systemInstruction !== undefined && { systemInstruction }) };
}

function toFunctionDeclarations(tools: Record<string, ToolDef>): GeminiFunctionDeclaration[] {
  return Object.entries(tools).map(([name, def]) => ({
    name,
    ...(def.description !== undefined && { description: def.description }),
    parameters: def.parameters,
  }));
}

function sseEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── Core streaming function ─────────────────────────────────────────────────

export interface StreamGeminiOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatMessage[];
  tools?: Record<string, ToolDef>;
  onToolResult?: (toolName: string, result: unknown) => Promise<void>;
}

export function streamGemini(opts: StreamGeminiOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const { apiKey, model, systemPrompt, messages, tools, onToolResult } = opts;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        await runStreamLoop(
          controller,
          encoder,
          apiKey,
          model,
          systemPrompt,
          messages,
          tools,
          onToolResult,
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(sseEvent({ type: "error", error: msg })));
      } finally {
        controller.close();
      }
    },
  });
}

async function runStreamLoop(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: ChatMessage[],
  tools: Record<string, ToolDef> | undefined,
  onToolResult: ((toolName: string, result: unknown) => Promise<void>) | undefined,
  depth = 0,
): Promise<void> {
  if (depth > 10) {
    controller.enqueue(
      encoder.encode(sseEvent({ type: "error", error: "Tool call loop limit reached" })),
    );
    return;
  }

  const { contents, systemInstruction } = toGeminiContents([
    { role: "system", content: systemPrompt },
    ...messages,
  ]);

  const body: Record<string, unknown> = { contents };
  if (systemInstruction) {
    body.systemInstruction = systemInstruction;
  }

  const declarations = tools ? toFunctionDeclarations(tools) : [];
  if (declarations.length > 0) {
    body.tools = [{ functionDeclarations: declarations }];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const functionCalls: { name: string; args: Record<string, unknown> }[] = [];

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines
    const lines = buffer.split("\n");
    buffer = lines.pop()!; // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;

      let chunk: GeminiStreamChunk;
      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }

      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if ("text" in part) {
          controller.enqueue(encoder.encode(sseEvent({ type: "text_delta", text: part.text })));
        } else if ("functionCall" in part) {
          functionCalls.push({
            name: part.functionCall.name,
            args: part.functionCall.args,
          });
        }
      }
    }
  }

  // Process any function calls
  if (functionCalls.length > 0 && tools) {
    for (const fc of functionCalls) {
      const toolCallId = crypto.randomUUID();

      controller.enqueue(
        encoder.encode(
          sseEvent({
            type: "tool_call_start",
            toolCallId,
            name: fc.name,
            args: fc.args,
            transport: "server",
          }),
        ),
      );

      const toolDef = tools[fc.name];
      let result: unknown;
      if (toolDef) {
        try {
          result = await toolDef.execute(fc.args);
        } catch (err) {
          result = {
            error: err instanceof Error ? err.message : "Tool execution failed",
          };
        }
      } else {
        result = { error: `Unknown tool: ${fc.name}` };
      }

      controller.enqueue(
        encoder.encode(
          sseEvent({
            type: "tool_call_end",
            toolCallId,
            name: fc.name,
            result,
          }),
        ),
      );

      if (onToolResult) {
        try {
          await onToolResult(fc.name, result);
        } catch {
          // fire-and-forget
        }
      }

      // Append function call + response to messages and recurse
      messages.push({
        role: "assistant",
        content: `[Called tool ${fc.name}]`,
      });
      messages.push({
        role: "user",
        content: JSON.stringify({ toolResult: fc.name, result }),
      });
    }

    // Recurse for multi-turn tool calling
    await runStreamLoop(
      controller,
      encoder,
      apiKey,
      model,
      systemPrompt,
      messages,
      tools,
      onToolResult,
      depth + 1,
    );
  }
}
