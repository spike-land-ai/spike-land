import { vi } from "vitest";

export const kv = {
  get: vi.fn(),
  set: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  scan: vi.fn(),
};
