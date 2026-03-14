/**
 * 4-Pass Pipeline Orchestrator
 *
 * Pass 1: Intent Classification (heuristic, ~0ms)
 * Pass 2: Context Gathering (RAG + CLAUDE.md + memory, parallel, 3s timeout)
 * Pass 3: Generation (enriched prompt → Ollama)
 * Pass 4: Self-Verification (critic, optional)
 */

import { classifyIntent } from "../core-logic/intent-classifier.ts";
import { gatherMemoryContext } from "../core-logic/memory-injector.ts";
import { assemblePrompt } from "../core-logic/prompt-assembler.ts";
import { buildVerificationPrompt, parseVerificationResult } from "../core-logic/self-verifier.ts";
import type {
  CrystallineConfig,
  OllamaMessage,
  OpenAIChatRequest,
  SearchResult,
} from "../core-logic/types.ts";
import { EmbeddingClient } from "../node-sys/embedding-client.ts";
import { OllamaClient } from "../node-sys/ollama-client.ts";
import { VectorStore } from "../node-sys/vector-store.ts";

/**
 * Strip qwen3 thinking tags from responses.
 * qwen3 wraps its reasoning in <think>...</think> tags.
 */
function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export interface PipelineResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  contextSources: string[];
  verificationVerdict?: string;
  timings: {
    classify: number;
    context: number;
    generate: number;
    verify: number;
    total: number;
  };
}

export interface PipelineStreamResult {
  stream: AsyncGenerator<import("../core-logic/types.ts").OllamaStreamChunk>;
  contextSources: string[];
  model: string;
}

function extractUserMessage(messages: OpenAIChatRequest["messages"]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!;
    if (msg.role === "user") {
      if (typeof msg.content === "string") return msg.content;
      if (Array.isArray(msg.content)) {
        return msg.content
          .filter((c) => c.type === "text")
          .map((c) => c.text ?? "")
          .join("\n");
      }
    }
  }
  return "";
}

function convertMessages(messages: OpenAIChatRequest["messages"]): OllamaMessage[] {
  return messages.map((m) => ({
    role: m.role as OllamaMessage["role"],
    content:
      typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content.map((c) => c.text ?? "").join("\n")
          : "",
  }));
}

export class Pipeline {
  private readonly ollama: OllamaClient;
  private readonly embedding: EmbeddingClient;
  private readonly store: VectorStore;
  private readonly config: CrystallineConfig;

  constructor(config: CrystallineConfig, store: VectorStore) {
    this.config = config;
    this.ollama = new OllamaClient(config.ollamaEndpoint);
    this.embedding = new EmbeddingClient(config.ollamaEndpoint, config.embeddingModel);
    this.store = store;
  }

  async run(request: OpenAIChatRequest): Promise<PipelineResult> {
    const totalStart = performance.now();
    const userMessage = extractUserMessage(request.messages);

    // ── Pass 1: Intent Classification ──
    const classifyStart = performance.now();
    const plan = classifyIntent(userMessage);
    const classifyTime = performance.now() - classifyStart;

    console.log(
      `[crystalline] Pass 1: ${plan.intent} (${(plan.confidence * 100).toFixed(0)}%) in ${classifyTime.toFixed(0)}ms`,
    );

    // ── Pass 2: Context Gathering (parallel, with timeout) ──
    const contextStart = performance.now();

    const contextResults = await Promise.allSettled([
      // RAG search
      plan.sources.rag && this.store.size > 0
        ? this.ragSearch(userMessage)
        : Promise.resolve([] as SearchResult[]),

      // CLAUDE.md + Memory
      plan.sources.claudeMd || plan.sources.memory
        ? gatherMemoryContext(
            this.config.monorepoRoot,
            plan.entities.packageNames,
            this.config.maxContextTokens / 4,
          )
        : Promise.resolve(""),
    ]);

    const ragResults = contextResults[0]?.status === "fulfilled" ? contextResults[0].value : [];
    const memoryContext = contextResults[1]?.status === "fulfilled" ? contextResults[1].value : "";
    const contextTime = performance.now() - contextStart;

    console.log(
      `[crystalline] Pass 2: ${ragResults.length} RAG chunks, memory=${memoryContext.length > 0 ? "yes" : "no"} in ${contextTime.toFixed(0)}ms`,
    );

    // ── Pass 3: Generation ──
    const generateStart = performance.now();

    const userMessages = convertMessages(request.messages);
    const assembled = assemblePrompt(
      userMessages,
      plan,
      ragResults,
      memoryContext,
      this.config.maxContextTokens,
    );

    const ollamaOptions: Record<string, unknown> = {
      temperature: request.temperature ?? 0.2,
    };
    // Only set num_predict if explicitly requested and large enough
    // qwen3 uses tokens for <think> tags even with /no_think
    if (request.max_tokens && request.max_tokens > 100) {
      ollamaOptions["num_predict"] = request.max_tokens;
    }

    const response = await this.ollama.chat({
      model: request.model.replace("crystalline/", "").replace("ollama/", "") || this.config.model,
      messages: assembled.messages,
      options: ollamaOptions as { temperature?: number; num_predict?: number },
    });

    const generateTime = performance.now() - generateStart;
    const content = stripThinkingTags(response.message.content);

    console.log(
      `[crystalline] Pass 3: Generated ${content.length} chars in ${generateTime.toFixed(0)}ms`,
    );

    // ── Pass 4: Self-Verification (optional) ──
    let verifyTime = 0;
    let verificationVerdict: string | undefined;

    if (this.config.enableSelfVerification && !plan.skipVerification && ragResults.length > 0) {
      const verifyStart = performance.now();

      try {
        const verifyMessages = buildVerificationPrompt(userMessage, ragResults, content);
        const verifyResponse = await this.ollama.chat({
          model: this.config.model,
          messages: verifyMessages,
          options: { temperature: 0, num_predict: 200 },
        });

        const result = parseVerificationResult(verifyResponse.message.content);
        verificationVerdict = `${result.verdict}${result.reason ? `: ${result.reason}` : ""}`;

        console.log(
          `[crystalline] Pass 4: ${result.verdict} in ${(performance.now() - verifyStart).toFixed(0)}ms`,
        );
      } catch (err) {
        console.error("[crystalline] Pass 4 failed:", err);
        verificationVerdict = "skipped (error)";
      }

      verifyTime = performance.now() - verifyStart;
    }

    return {
      content,
      model: response.model,
      promptTokens: response.prompt_eval_count ?? 0,
      completionTokens: response.eval_count ?? 0,
      contextSources: assembled.contextSources,
      ...(verificationVerdict !== undefined ? { verificationVerdict } : {}),
      timings: {
        classify: classifyTime,
        context: contextTime,
        generate: generateTime,
        verify: verifyTime,
        total: performance.now() - totalStart,
      },
    };
  }

  async runStream(request: OpenAIChatRequest): Promise<PipelineStreamResult> {
    const userMessage = extractUserMessage(request.messages);

    // Pass 1
    const plan = classifyIntent(userMessage);

    // Pass 2 (parallel)
    const [ragResults, memoryContext] = await Promise.all([
      plan.sources.rag && this.store.size > 0
        ? this.ragSearch(userMessage)
        : Promise.resolve([] as SearchResult[]),

      plan.sources.claudeMd || plan.sources.memory
        ? gatherMemoryContext(
            this.config.monorepoRoot,
            plan.entities.packageNames,
            this.config.maxContextTokens / 4,
          )
        : Promise.resolve(""),
    ]);

    // Pass 3: stream
    const userMessages = convertMessages(request.messages);
    const assembled = assemblePrompt(
      userMessages,
      plan,
      ragResults,
      memoryContext,
      this.config.maxContextTokens,
    );

    const model =
      request.model.replace("crystalline/", "").replace("ollama/", "") || this.config.model;

    const streamOptions: Record<string, unknown> = {
      temperature: request.temperature ?? 0.2,
    };
    if (request.max_tokens && request.max_tokens > 100) {
      streamOptions["num_predict"] = request.max_tokens;
    }

    const stream = this.ollama.chatStream({
      model,
      messages: assembled.messages,
      options: streamOptions as { temperature?: number; num_predict?: number },
    });

    return {
      stream,
      contextSources: assembled.contextSources,
      model,
    };
  }

  private async ragSearch(query: string): Promise<SearchResult[]> {
    try {
      const queryEmbedding = await this.embedding.embedSingle(query);
      return this.store.search(queryEmbedding, this.config.ragTopK);
    } catch (err) {
      console.error("[crystalline] RAG search failed:", err);
      return [];
    }
  }
}
