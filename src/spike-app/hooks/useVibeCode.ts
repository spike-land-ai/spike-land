import { useCallback, useState, useRef } from "react";
import type { ChatMessage } from "./useChat";

interface UseVibeCodeReturn {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  fileName: string;
  setFileName: (name: string) => void;
  applyFromChat: (messages: ChatMessage[]) => void;
  history: Array<{ code: string; timestamp: number }>;
  undo: () => void;
}

const DEFAULT_CODE = `// Welcome to Vibe Coder
// Chat with the AI to start building your app

import React from "react";

export default function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Hello, Vibe Coder!</h1>
        <p className="text-lg opacity-80">Start chatting to build something amazing.</p>
      </div>
    </div>
  );
}
`;

export function useVibeCode(): UseVibeCodeReturn {
  const [code, setCodeRaw] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("typescript");
  const [fileName, setFileName] = useState("App.tsx");
  const historyRef = useRef<Array<{ code: string; timestamp: number }>>([
    { code: DEFAULT_CODE, timestamp: Date.now() },
  ]);

  const setCode = useCallback((newCode: string) => {
    setCodeRaw(newCode);
    historyRef.current.push({ code: newCode, timestamp: Date.now() });
    // Keep max 50 history entries
    if (historyRef.current.length > 50) {
      historyRef.current = historyRef.current.slice(-50);
    }
  }, []);

  const undo = useCallback(() => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const prev = historyRef.current[historyRef.current.length - 1];
      if (prev) setCodeRaw(prev.code);
    }
  }, []);

  // Extract code blocks from the latest assistant message
  const applyFromChat = useCallback((messages: ChatMessage[]) => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant" && m.content);
    if (!lastAssistant) return;

    // Find fenced code blocks
    const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript)?\s*\n([\s\S]*?)```/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = codeBlockRegex.exec(lastAssistant.content)) !== null) {
      if (match[1]) matches.push(match[1].trim());
    }

    // Apply the last (most complete) code block
    if (matches.length > 0) {
      const newCode = matches[matches.length - 1]!;
      setCode(newCode);

      // Try to detect language from the code block header
      const langMatch = lastAssistant.content.match(/```(tsx?|jsx?|typescript|javascript)/);
      if (langMatch) {
        const lang = langMatch[1];
        if (lang === "tsx" || lang === "typescript") setLanguage("typescript");
        else if (lang === "jsx" || lang === "javascript") setLanguage("javascript");
      }
    }
  }, [setCode]);

  return {
    code,
    setCode,
    language,
    setLanguage,
    fileName,
    setFileName,
    applyFromChat,
    history: historyRef.current,
    undo,
  };
}
