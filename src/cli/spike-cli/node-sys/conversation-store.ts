/**
 * Conversation persistence — save/load chat sessions to disk.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { Message } from "../ai/client.js";

export interface ConversationMeta {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: string;
}

export interface SavedConversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

const CONVERSATIONS_DIR = join(homedir(), ".spike", "conversations");

function ensureDir(): void {
  if (!existsSync(CONVERSATIONS_DIR)) {
    mkdirSync(CONVERSATIONS_DIR, { recursive: true });
  }
}

function generateId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toISOString().slice(11, 19).replace(/:/g, "");
  const rand = Math.random().toString(36).slice(2, 6);
  return `${date}-${time}-${rand}`;
}

function extractPreview(messages: Message[]): string {
  for (const msg of messages) {
    if (msg.role === "user" && typeof msg.content === "string") {
      return msg.content.slice(0, 80);
    }
  }
  return "(empty)";
}

/**
 * Save a conversation to disk.
 */
export function saveConversation(messages: Message[], id?: string): ConversationMeta {
  ensureDir();

  const conversationId = id ?? generateId();
  const now = new Date().toISOString();
  const filePath = join(CONVERSATIONS_DIR, `${conversationId}.json`);

  // Check if updating existing
  let createdAt = now;
  if (existsSync(filePath)) {
    try {
      const existing = JSON.parse(readFileSync(filePath, "utf-8")) as SavedConversation;
      createdAt = existing.createdAt;
    } catch {
      // Corrupt file, overwrite
    }
  }

  const conversation: SavedConversation = {
    id: conversationId,
    createdAt,
    updatedAt: now,
    messages,
  };

  writeFileSync(filePath, JSON.stringify(conversation, null, 2), "utf-8");

  return {
    id: conversationId,
    createdAt,
    updatedAt: now,
    messageCount: messages.length,
    preview: extractPreview(messages),
  };
}

/**
 * Load a conversation from disk.
 */
export function loadConversation(id: string): SavedConversation | null {
  ensureDir();
  const filePath = join(CONVERSATIONS_DIR, `${id}.json`);

  if (!existsSync(filePath)) return null;

  try {
    const data = readFileSync(filePath, "utf-8");
    return JSON.parse(data) as SavedConversation;
  } catch {
    return null;
  }
}

/**
 * List all saved conversations.
 */
export function listConversations(): ConversationMeta[] {
  ensureDir();

  const files = readdirSync(CONVERSATIONS_DIR).filter((f) => f.endsWith(".json"));
  const conversations: ConversationMeta[] = [];

  for (const file of files) {
    try {
      const data = readFileSync(join(CONVERSATIONS_DIR, file), "utf-8");
      const conv = JSON.parse(data) as SavedConversation;
      conversations.push({
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages.length,
        preview: extractPreview(conv.messages),
      });
    } catch {
      // Skip corrupt files
    }
  }

  // Sort by updatedAt descending
  conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return conversations;
}
