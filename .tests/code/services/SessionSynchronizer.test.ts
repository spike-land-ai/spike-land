import { beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { generateSessionPatch } from "../../../src/frontend/monaco-editor/core-logic/lib/make-sess";
import { SessionSynchronizer } from "../../../src/frontend/monaco-editor/core-logic/services/SessionSynchronizer";
import type { ICodeSession } from "../../../src/frontend/monaco-editor/ui/@/lib/interfaces";

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: MockWebSocket[] = [];

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onopen: ((event: Event) => void) | null = null;
  close = vi.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close"));
  });
  send = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  emitOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  emitMessage(message: unknown): void {
    const data = typeof message === "string" ? message : JSON.stringify(message);
    this.onmessage?.(new MessageEvent("message", { data }));
  }
}

function createSession(overrides: Partial<ICodeSession> = {}): ICodeSession {
  return {
    codeSpace: "room-a",
    code: 'export default function App() { return <div>Alpha</div>; }',
    html: "<div>Alpha</div>",
    css: ".app { color: red; }",
    transpiled: 'const App = () => "Alpha"; export default App;',
    messages: [],
    ...overrides,
  };
}

describe("SessionSynchronizer", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.clearAllMocks();
    MockWebSocket.instances = [];
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
  });

  it("fetches the session and opens the live websocket", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(createSession()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const synchronizer = new SessionSynchronizer("room-a");
    await synchronizer.init();

    expect(fetchMock).toHaveBeenCalledWith("/live/room-a/session.json");
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0]!.url).toMatch(/\/live\/room-a\/websocket$/);

    synchronizer.close();
  });

  it("applies incoming backend deltas to the current session", async () => {
    const initialSession = createSession();
    const updatedSession = createSession({
      code: 'export default function App() { return <div>Beta</div>; }',
      html: "<div>Beta</div>",
      transpiled: 'const App = () => "Beta"; export default App;',
    });

    const synchronizer = new SessionSynchronizer("room-a");
    const updates = vi.fn();
    synchronizer.subscribe(updates);
    await synchronizer.init(initialSession);

    const socket = MockWebSocket.instances[0]!;
    socket.emitOpen();
    socket.emitMessage(generateSessionPatch(initialSession, updatedSession));

    await waitFor(() => {
      expect(updates).toHaveBeenCalled();
      expect(synchronizer.getSession()?.code).toContain("Beta");
    });

    expect(updates.mock.lastCall?.[0]).toMatchObject({
      code: updatedSession.code,
      sender: "REMOTE_PATCH",
    });

    synchronizer.close();
  });

  it("refreshes from the server when the socket handshake hash diverges", async () => {
    const initialSession = createSession();
    const refreshedSession = createSession({
      code: 'export default function App() { return <div>Gamma</div>; }',
      html: "<div>Gamma</div>",
    });

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(refreshedSession), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const synchronizer = new SessionSynchronizer("room-a");
    const updates = vi.fn();
    synchronizer.subscribe(updates);
    await synchronizer.init(initialSession);

    const socket = MockWebSocket.instances[0]!;
    socket.emitOpen();
    socket.emitMessage({ type: "handshake", hash: "different-hash" });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/live/room-a/session.json");
      expect(synchronizer.getSession()?.code).toContain("Gamma");
    });

    expect(updates.mock.lastCall?.[0]).toMatchObject({
      code: refreshedSession.code,
      sender: "SOCKET_HANDSHAKE",
    });

    synchronizer.close();
  });
});
