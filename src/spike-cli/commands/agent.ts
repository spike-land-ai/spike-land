import type { Command } from "commander";
import { GoogleGenAI } from "@google/genai";
import { createStdbHttpClient, type StdbHttpClient } from "@spike-land-ai/spacetimedb-platform/stdb-http-client";
import express from "express";
import cors from "cors";

// Fallback to CLAUDE_CODE_OAUTH_TOKEN if GEMINI_API_KEY isn't available
export const ai = new GoogleGenAI(
  process.env.GEMINI_API_KEY ? { apiKey: process.env.GEMINI_API_KEY } : {}
);

export let stdbClient: StdbHttpClient | null = null;

export function initSpacetimeDB(baseUrl: string, moduleName: string) {
  // Convert ws:// to http:// for HTTP API
  const httpHost = baseUrl.replace(/^ws(s?):\/\//, "http$1://");

  const client = createStdbHttpClient({
    host: httpHost,
    database: moduleName,
  });

  client.sql("SELECT 1").then(() => {
    console.log("[Agent] Connected to SpacetimeDB via HTTP");
    stdbClient = client;

    // Poll for code_session changes every 2 seconds
    setInterval(async () => {
      try {
        const sessions = await client.sql<Record<string, unknown>>(
          "SELECT * FROM code_session"
        );
        for (const session of sessions) {
          await handleSessionUpdate(session);
        }
      } catch (err) {
        console.error("[Agent] Poll error:", err);
      }
    }, 2000);
  }).catch((err: unknown) => {
    console.error("[Agent] Connection error:", err);
  });
}

const processingSessions = new Set<string>();

export async function handleSessionUpdate(session: Record<string, unknown>) {
  const codeSpace = String(session.codeSpace ?? session.code_space ?? "");
  if (!codeSpace || processingSessions.has(codeSpace)) return;

  try {
    let messages: Array<{ role: string; content: string; id?: string }> = [];
    const messagesJson = String(session.messagesJson ?? session.messages_json ?? "");
    if (messagesJson) {
      messages = JSON.parse(messagesJson);
    }

    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // Only respond if the last message is from the user
    if (lastMessage.role === "user") {
      processingSessions.add(codeSpace);
      console.log(`[Agent] Processing request for ${codeSpace}: ${lastMessage.content}`);

      const code = String(session.code ?? "");
      const systemPrompt = `You are an expert AI programming assistant.
You are helping the user with their code in the SpacetimeDB-backed Monaco editor.
The user is currently working on the following code:
\`\`\`typescript
${code}
\`\`\`
Provide helpful, concise code modifications.`;

      const formattedContents = messages.map(m => {
        const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text }]
        };
      });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 4000,
        }
      });

      const replyContent = response.text || "I couldn't process that.";

      const newMessages = [...messages, {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: replyContent
      }];

      if (stdbClient) {
        await stdbClient.callReducer("update_code_session", [
          codeSpace,
          code,
          String(session.html ?? ""),
          String(session.css ?? ""),
          String(session.transpiled ?? ""),
          JSON.stringify(newMessages),
        ]);
      }

      console.log(`[Agent] Replied to ${codeSpace}`);
    }
  } catch (error) {
    console.error(`[Agent] Error processing session ${codeSpace}:`, error);
  } finally {
    processingSessions.delete(codeSpace);
  }
}

export function startCompletionServer(port: number) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post("/completion", async (req, res) => {
    try {
      const { prefix, suffix } = req.body;

      if (!prefix) {
        res.status(400).json({ error: "Missing prefix" });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `<prefix>\n${prefix}\n</prefix>\n<suffix>\n${suffix || ""}\n</suffix>\n\nComplete the code exactly where prefix ends and suffix begins. Output only the missing code.` }]
          }
        ],
        config: {
          systemInstruction: "You are an AI code completion engine. You receive the prefix and suffix of a TypeScript/TSX code file. Your task is to output ONLY the code that should be inserted exactly at the cursor position. DO NOT add markdown blocks or explanations.",
          maxOutputTokens: 150,
        }
      });

      const completionText = (response.text || "").trim();
      res.json({ completion: completionText });
    } catch (error) {
      console.error("[Agent] Completion error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return app.listen(port, () => {
    console.log(`[Agent] Completion API server listening on port ${port}`);
  });
}

export function registerAgentCommand(program: Command): void {
  program
    .command("agent")
    .description("Run the Spike CLI AI Agent that connects to SpacetimeDB and replies to chats")
    .option("--stdb-url <url>", "SpacetimeDB URL", "ws://localhost:3000")
    .option("--stdb-module <module>", "SpacetimeDB Module Name", "rightful-dirt-5033")
    .option("--port <port>", "Port for local HTTP completion API", "3005")
    .action((options) => {
      if (!process.env.GEMINI_API_KEY && !process.env.CLAUDE_CODE_OAUTH_TOKEN) {
        console.error("Error: GEMINI_API_KEY is not set.");
        process.exit(1);
      }

      console.log("Starting Spike Agent with Gemini...");
      initSpacetimeDB(options.stdbUrl, options.stdbModule);
      startCompletionServer(parseInt(options.port, 10));

      // Keep process alive
      setInterval(() => {}, 1000 * 60 * 60);
    });
}
