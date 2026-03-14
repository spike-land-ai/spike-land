/**
 * Shared bridge: routes messages from external channels (WhatsApp, Telegram)
 * through the spike-chat pipeline.
 *
 * Calls the spike-chat endpoint internally, collects the SSE stream,
 * and returns the assistant's text response.
 */

import type { Env } from "./env.js";
import { createLogger } from "@spike-land-ai/shared";

const log = createLogger("messaging-bridge");

export interface ChannelMessage {
  /** The user's message text. */
  text: string;
  /** Channel source identifier (e.g. "whatsapp", "telegram"). */
  source: "whatsapp" | "telegram";
  /** spike.land userId (already resolved from channel-specific linking). */
  userId: string;
  /** Default persona to use for the conversation. */
  persona?: string;
}

/**
 * Route a channel message through the spike-chat pipeline.
 * Returns the assistant's text reply.
 */
export async function routeToSpikeChat(env: Env, msg: ChannelMessage): Promise<string> {
  // Build system prompt for the channel context
  const persona = msg.persona ?? "radix";

  // Use the spike-chat pipeline via internal service call
  // We construct the same request body that the frontend sends
  try {
    // Call spike-chat via the MCP_SERVICE or direct Gemini for simplicity
    // For now, use the same LLM path as spike-chat but simplified for messaging
    const reply = await streamingChat(env, msg.text, msg.userId, persona);
    return reply;
  } catch (err) {
    log.error("spike-chat bridge error", { error: String(err), source: msg.source });
    return "Sorry, I encountered an error. Please try again.";
  }
}

/**
 * Simplified streaming chat that mirrors the spike-chat pipeline
 * but returns a collected text response (no SSE needed for messaging channels).
 */
async function streamingChat(
  env: Env,
  message: string,
  userId: string,
  persona: string,
): Promise<string> {
  // Resolve which LLM provider to use
  // Try xAI (Grok) first (same as spike-chat), fall back to Gemini
  const xaiKey = env.XAI_API_KEY;
  const geminiKey = env.GEMINI_API_KEY;

  if (xaiKey) {
    return callXai(xaiKey, message, userId, persona);
  }

  if (geminiKey) {
    return callGemini(geminiKey, message, persona);
  }

  return "Chat service is not configured. Please contact support.";
}

async function callXai(
  apiKey: string,
  message: string,
  userId: string,
  persona: string,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(persona);

  const resp = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-3-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 2048,
      temperature: 0.3,
      user: userId,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "unknown");
    log.error("xAI API error", { status: resp.status, body: errText });
    throw new Error(`xAI returned ${resp.status}`);
  }

  const result = await resp.json<{
    choices?: Array<{ message?: { content?: string } }>;
  }>();

  return result?.choices?.[0]?.message?.content ?? "No response.";
}

async function callGemini(apiKey: string, message: string, persona: string): Promise<string> {
  const systemPrompt = buildSystemPrompt(persona);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
    }),
  });

  if (!resp.ok) {
    throw new Error(`Gemini returned ${resp.status}`);
  }

  const result = await resp.json<{
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }>();

  return result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response.";
}

function buildSystemPrompt(persona: string): string {
  const base =
    "You are Spike, the AI assistant for spike.land — an open AI app store built on MCP. " +
    "Keep responses concise and under 4000 characters. " +
    "Do not use markdown formatting (the output goes to WhatsApp/Telegram). " +
    "Use plain text with line breaks for structure.";

  const personaPrompts: Record<string, string> = {
    radix:
      base +
      "\n\nYou have a radix personality — sharp, direct, slightly irreverent. " +
      "You cut through noise and get to the point.",
    erdos:
      base +
      "\n\nYou channel Paul Erdős — mathematically precise, collaborative, " +
      'curious. You call good solutions "elegant" and share knowledge freely.',
    gov:
      base +
      "\n\nYou are helpful and formal, focused on governance, policy, and rights. " +
      "You provide clear, structured information.",
  };

  return personaPrompts[persona] ?? base;
}

/**
 * Fetch MCP tool results for a query.
 * Used by command handlers to search and execute tools.
 */
export async function searchMcpTools(env: Env, query: string): Promise<string> {
  const rpcBody = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "search_tools", arguments: { query } },
  });

  const resp = await env.MCP_SERVICE.fetch(
    new Request("https://mcp.spike.land/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rpcBody,
    }),
  );

  if (!resp.ok) return "Failed to search tools.";

  const result = await resp.json<{ result?: { content?: Array<{ text?: string }> } }>();
  return result?.result?.content?.[0]?.text ?? "No tools found.";
}
