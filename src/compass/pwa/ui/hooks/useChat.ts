import { useCallback, useReducer } from "react";
import type { ChatMessage, QuickChoice } from "../../types.ts";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type ChatAction =
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_HISTORY" }
  | { type: "UPDATE_MESSAGE"; payload: { id: string; content: string } };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "CLEAR_HISTORY":
      return { ...initialState };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.payload.id ? { ...m, content: action.payload.content } : m,
        ),
      };

    default:
      return state;
  }
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Hook options
// ---------------------------------------------------------------------------

interface UseChatOptions {
  /**
   * Called when the user sends a message. Should return the assistant's reply.
   * If not provided, a placeholder response is used.
   */
  onSendMessage?: (message: ChatMessage) => Promise<string>;
  /** Optional initial messages (e.g. restored from IndexedDB) */
  initialMessages?: ChatMessage[];
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  /**
   * Send a user text message. Dispatches the user bubble, calls `onSendMessage`,
   * then appends the assistant bubble.
   */
  sendMessage: (content: string) => Promise<void>;
  /**
   * Send a quick-choice selection as a user message.
   * Labels of selected items are joined as the visible content.
   */
  sendQuickChoices: (choices: QuickChoice[], selectedIds: string[]) => Promise<void>;
  /** Clear all messages and reset to initial state */
  clearHistory: () => void;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function buildMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChat({
  onSendMessage,
  initialMessages = [],
}: UseChatOptions = {}): UseChatReturn {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialState,
    messages: initialMessages,
  });

  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      const userMessage = buildMessage("user", content);
      dispatch({ type: "ADD_MESSAGE", payload: userMessage });
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        let assistantContent: string;

        if (onSendMessage) {
          assistantContent = await onSendMessage(userMessage);
        } else {
          // Placeholder response for development / offline fallback
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 600);
          });
          assistantContent =
            "I received your message. Please connect me to the COMPASS conversation engine to give you a real response.";
        }

        const assistantMessage = buildMessage("assistant", assistantContent);
        dispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
      } catch (err) {
        const errorText =
          err instanceof Error ? err.message : "Something went wrong. Please try again.";
        dispatch({ type: "SET_ERROR", payload: errorText });

        // Still show a graceful assistant message so the chat doesn't feel broken
        const fallbackMessage = buildMessage(
          "assistant",
          "I'm having trouble connecting right now. Your question has been noted and I'll answer as soon as possible.",
        );
        dispatch({ type: "ADD_MESSAGE", payload: fallbackMessage });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [onSendMessage],
  );

  const sendQuickChoices = useCallback(
    async (choices: QuickChoice[], selectedIds: string[]): Promise<void> => {
      if (selectedIds.length === 0) return;

      const labels = selectedIds
        .map((id) => choices.find((c) => c.id === id)?.label ?? id)
        .join(", ");

      await sendMessage(labels);
    },
    [sendMessage],
  );

  const clearHistory = useCallback((): void => {
    dispatch({ type: "CLEAR_HISTORY" });
  }, []);

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage,
    sendQuickChoices,
    clearHistory,
  };
}
