/**
 * Vitest setup for react-ts-worker tests.
 *
 * The Scheduler uses MessageChannel to schedule work. In Node.js / jsdom,
 * a MessagePort with an onmessage listener keeps the event loop alive.
 *
 * We replace MessageChannel with a version that uses setTimeout instead,
 * allowing the process to exit cleanly.
 */

class TestMessagePort {
  onmessage: ((ev: { data: unknown }) => void) | null = null;

  postMessage(data: unknown) {
    if (this._other?.onmessage) {
      const handler = this._other.onmessage;
      setTimeout(() => handler({ data }), 0);
    }
  }

  _other: TestMessagePort | null = null;

  start() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return false;
  }
}

class TestMessageChannel {
  port1: TestMessagePort;
  port2: TestMessagePort;

  constructor() {
    this.port1 = new TestMessagePort();
    this.port2 = new TestMessagePort();
    this.port1._other = this.port2;
    this.port2._other = this.port1;
  }
}

(globalThis as Record<string, unknown>).MessageChannel = TestMessageChannel;

export {};
