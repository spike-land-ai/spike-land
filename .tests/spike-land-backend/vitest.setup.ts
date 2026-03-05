// Vitest setup for spike-land-backend
// Cloudflare Workers globals stub

// WebSocketPair polyfill for tests
class MockWebSocket {
  accept() {}
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  serializeAttachment() {}
  deserializeAttachment() { return null; }
}

globalThis.WebSocketPair = class WebSocketPair {
  0: MockWebSocket;
  1: MockWebSocket;
  constructor() {
    this[0] = new MockWebSocket() as unknown as MockWebSocket;
    this[1] = new MockWebSocket() as unknown as MockWebSocket;
  }
} as unknown as typeof WebSocketPair;
