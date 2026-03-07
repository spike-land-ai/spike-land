/**
 * Context window management with automatic summarization.
 * Compresses older messages when context usage reaches critical levels.
 */

import type { Message } from "../../ai/client.js";
import type { TokenTracker } from "./token-tracker.js";

export interface ContextManagerOptions {
  /** Number of recent messages to keep verbatim. Default: 4 */
  keepRecentMessages?: number;
  /** Summary function — takes messages to compress, returns a summary string. */
  summarizer?: (messages: Message[]) => Promise<string>;
}

/**
 * Manages conversation context by summarizing older messages
 * when the token tracker signals high utilization.
 */
export class ContextManager {
  private readonly keepRecent: number;
  private readonly summarizer: (messages: Message[]) => Promise<string>;

  constructor(options: ContextManagerOptions = {}) {
    this.keepRecent = options.keepRecentMessages ?? 4;
    this.summarizer = options.summarizer ?? defaultSummarizer;
  }

  /**
   * Check if context needs compression and perform it if so.
   * Mutates the messages array in place.
   * Returns true if summarization was performed.
   */
  async maybeSummarize(
    messages: Message[],
    tracker: TokenTracker,
  ): Promise<boolean> {
    if (!tracker.shouldSummarize) return false;
    if (messages.length <= this.keepRecent + 1) return false;

    // Split messages: older ones to summarize, recent ones to keep
    const toSummarize = messages.slice(0, messages.length - this.keepRecent);
    const toKeep = messages.slice(messages.length - this.keepRecent);

    const summary = await this.summarizer(toSummarize);

    // Replace messages array contents
    messages.length = 0;
    messages.push(
      {
        role: "user",
        content: `[Previous conversation summary]\n${summary}`,
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "I understand. I have the context from our previous conversation. How can I help?" }],
      },
      ...toKeep,
    );

    return true;
  }
}

/**
 * Default summarizer that creates a simple text summary from messages.
 * In production, this would be replaced with a Claude API call.
 */
async function defaultSummarizer(messages: Message[]): Promise<string> {
  const parts: string[] = [];

  for (const msg of messages) {
    if (typeof msg.content === "string") {
      parts.push(`${msg.role}: ${msg.content}`);
    } else if (Array.isArray(msg.content)) {
      const texts = msg.content
        .filter((b): b is { type: "text"; text: string } => "type" in b && b.type === "text")
        .map((b) => b.text);
      if (texts.length > 0) {
        parts.push(`${msg.role}: ${texts.join(" ")}`);
      }
    }
  }

  return parts.join("\n");
}
