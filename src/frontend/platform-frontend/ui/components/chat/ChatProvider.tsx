import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAetherChat, type AetherMessage, type PipelineStage } from "../../hooks/useAetherChat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatContextValue {
  /** Full message history for the current session. */
  messages: AetherMessage[];
  /** Send a message and stream the assistant reply. */
  sendMessage: (content: string) => Promise<void>;
  /** Whether a response is currently streaming. */
  isStreaming: boolean;
  /** Current Aether pipeline stage. */
  currentStage: PipelineStage;
  /** Latest error, or null. */
  error: string | null;
  /** Dismiss the current error. */
  clearError: () => void;
  /** Clear the entire conversation history. */
  clearMessages: () => void;
  /** Active session ID (null until server assigns one). */
  sessionId: string | null;
  /** Whether the DO session is loaded and synced. */
  sessionReady: boolean;
  /** Number of unread messages (messages added while widget is closed). */
  unreadCount: number;
  /** Mark all messages as read. */
  markAllRead: () => void;
  /** Whether the chat widget panel is open. */
  isPanelOpen: boolean;
  /** Open the chat panel. */
  openPanel: () => void;
  /** Close the chat panel. */
  closePanel: () => void;
  /** Toggle the chat panel open/closed. */
  togglePanel: () => void;
  /** Memory stats. */
  noteCount: number;
  totalNoteCount: number;
  toolCatalogCount: number;
  model: string | null;
}

const WIDGET_OPEN_KEY = "spike-chat-widget-open";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ChatContext = createContext<ChatContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const aether = useAetherChat();

  // Track the message count at last open to compute unread count
  const readCountRef = useRef(aether.messages.length);

  // Panel open/closed — persisted to localStorage
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(WIDGET_OPEN_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Unread count: messages added while the panel was closed
  const [unreadCount, setUnreadCount] = useState(0);

  // When new messages arrive and panel is closed, increment unread
  useEffect(() => {
    if (isPanelOpen) {
      // Panel is open: keep read pointer current
      readCountRef.current = aether.messages.length;
      return;
    }
    const newMessages = aether.messages.length - readCountRef.current;
    if (newMessages > 0) {
      setUnreadCount((prev) => prev + newMessages);
      readCountRef.current = aether.messages.length;
    }
  }, [aether.messages.length, isPanelOpen]);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
    setUnreadCount(0);
    readCountRef.current = aether.messages.length;
    try {
      localStorage.setItem(WIDGET_OPEN_KEY, "true");
    } catch {
      // ignore
    }
  }, [aether.messages.length]);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    try {
      localStorage.setItem(WIDGET_OPEN_KEY, "false");
    } catch {
      // ignore
    }
  }, []);

  const togglePanel = useCallback(() => {
    if (isPanelOpen) {
      closePanel();
    } else {
      openPanel();
    }
  }, [isPanelOpen, openPanel, closePanel]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    readCountRef.current = aether.messages.length;
  }, [aether.messages.length]);

  const value = useMemo<ChatContextValue>(
    () => ({
      messages: aether.messages,
      sendMessage: aether.sendMessage,
      isStreaming: aether.isStreaming,
      currentStage: aether.currentStage,
      error: aether.error,
      clearError: aether.clearError,
      clearMessages: aether.clearMessages,
      sessionId: aether.sessionId,
      sessionReady: aether.sessionReady,
      noteCount: aether.noteCount,
      totalNoteCount: aether.totalNoteCount,
      toolCatalogCount: aether.toolCatalogCount,
      model: aether.model,
      unreadCount,
      markAllRead,
      isPanelOpen,
      openPanel,
      closePanel,
      togglePanel,
    }),
    [
      aether.messages,
      aether.sendMessage,
      aether.isStreaming,
      aether.currentStage,
      aether.error,
      aether.clearError,
      aether.clearMessages,
      aether.sessionId,
      aether.sessionReady,
      aether.noteCount,
      aether.totalNoteCount,
      aether.toolCatalogCount,
      aether.model,
      unreadCount,
      markAllRead,
      isPanelOpen,
      openPanel,
      closePanel,
      togglePanel,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used inside <ChatProvider>");
  }
  return ctx;
}
