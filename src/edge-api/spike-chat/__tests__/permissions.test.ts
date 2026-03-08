import { describe, it, expect, vi } from "vitest";
import { checkWorkspaceMembership, checkChannelAccess } from "../core-logic/permissions";
import type { Env } from "../core-logic/env";

describe("permissions", () => {
  it("checkWorkspaceMembership returns true for visitors", async () => {
    const result = await checkWorkspaceMembership({} as Env, "visitor-123", "ws-1");
    expect(result).toBe(true);
  });

  it("checkWorkspaceMembership returns false if MCP_SERVICE returns 404", async () => {
    const env = {
      MCP_SERVICE: {
        fetch: vi.fn().mockResolvedValue({ status: 404 }),
      },
    } as unknown as Env;

    const result = await checkWorkspaceMembership(env, "user-1", "ws-1");
    expect(result).toBe(false);
  });

  it("checkWorkspaceMembership returns res.ok otherwise", async () => {
    const env = {
      MCP_SERVICE: {
        fetch: vi.fn().mockResolvedValue({ status: 200, ok: true }),
      },
    } as unknown as Env;

    const result = await checkWorkspaceMembership(env, "user-1", "ws-1");
    expect(result).toBe(true);
  });

  it("checkWorkspaceMembership returns false on error", async () => {
    const env = {
      MCP_SERVICE: {
        fetch: vi.fn().mockRejectedValue(new Error("Network Error")),
      },
    } as unknown as Env;

    const result = await checkWorkspaceMembership(env, "user-1", "ws-1");
    expect(result).toBe(false);
  });

  describe("checkChannelAccess", () => {
    it("returns false when channel is not found", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      const env = { DB: mockDb } as unknown as Env;
      const result = await checkChannelAccess(env, "user-1", "chan-1");
      expect(result).toBe(false);
    });

    it("returns false on DB error (fail-closed)", async () => {
      const env = { DB: undefined } as unknown as Env;
      const result = await checkChannelAccess(env, "user-1", "chan-1");
      expect(result).toBe(false);
    });

    it("allows visitors on public channels", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: "chan-1", type: "public", workspaceId: "ws-1" },
              ]),
            }),
          }),
        }),
      };
      const env = { DB: mockDb } as unknown as Env;
      const result = await checkChannelAccess(env, "visitor-abc", "chan-1");
      expect(result).toBe(true);
    });

    it("denies visitors on private channels", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: "chan-1", type: "private", workspaceId: "ws-1" },
              ]),
            }),
          }),
        }),
      };
      const env = { DB: mockDb } as unknown as Env;
      const result = await checkChannelAccess(env, "visitor-abc", "chan-1");
      expect(result).toBe(false);
    });

    it("denies visitors on dm channels", async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                { id: "chan-1", type: "dm", workspaceId: "ws-1" },
              ]),
            }),
          }),
        }),
      };
      const env = { DB: mockDb } as unknown as Env;
      const result = await checkChannelAccess(env, "visitor-abc", "chan-1");
      expect(result).toBe(false);
    });

    it("allows member in private channel when present in channelMembers", async () => {
      let callCount = 0;
      const mockDb = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                  // First call: channels lookup
                  return Promise.resolve([{ id: "chan-1", type: "private", workspaceId: "ws-1" }]);
                }
                // Second call: channelMembers lookup
                return Promise.resolve([{ channelId: "chan-1", userId: "user-1" }]);
              }),
            }),
          }),
        })),
      };
      const env = { DB: mockDb } as unknown as Env;
      const result = await checkChannelAccess(env, "user-1", "chan-1");
      expect(result).toBe(true);
    });

    it("denies non-member in private channel", async () => {
      let callCount = 0;
      const mockDb = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                  return Promise.resolve([{ id: "chan-1", type: "private", workspaceId: "ws-1" }]);
                }
                return Promise.resolve([]);
              }),
            }),
          }),
        })),
      };
      const env = { DB: mockDb } as unknown as Env;
      const result = await checkChannelAccess(env, "user-2", "chan-1");
      expect(result).toBe(false);
    });
  });
});
