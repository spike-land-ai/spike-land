import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    data: undefined,
    error: undefined,
    isLoading: false,
    reset: vi.fn(),
  }),
}));

import { useSocialAutopilotMcp } from "./useSocialAutopilotMcp";
import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";

describe("useSocialAutopilotMcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a mutations object with all expected keys", () => {
    const { result } = renderHook(() => useSocialAutopilotMcp());
    expect(result.current).toHaveProperty("mutations");
    const { mutations } = result.current;
    expect(mutations).toHaveProperty("connectAccount");
    expect(mutations).toHaveProperty("disconnectAccount");
    expect(mutations).toHaveProperty("accountHealthCheck");
    expect(mutations).toHaveProperty("schedulePost");
    expect(mutations).toHaveProperty("bulkSchedule");
    expect(mutations).toHaveProperty("reschedulePost");
    expect(mutations).toHaveProperty("engagementMetrics");
    expect(mutations).toHaveProperty("contentPerformance");
    expect(mutations).toHaveProperty("autoBoostRules");
  });

  it("calls useMcpMutation for each of the 9 mutation keys", () => {
    renderHook(() => useSocialAutopilotMcp());
    const expectedKeys = [
      "connect_account",
      "disconnect_account",
      "account_health_check",
      "schedule_post",
      "bulk_schedule",
      "reschedule_post",
      "engagement_metrics",
      "content_performance",
      "auto_boost_rules",
    ];
    expect(vi.mocked(useMcpMutation)).toHaveBeenCalledTimes(9);
    for (const key of expectedKeys) {
      expect(vi.mocked(useMcpMutation)).toHaveBeenCalledWith(key);
    }
  });

  it("each mutation exposes mutate, mutateAsync, data, error, isLoading, and reset", () => {
    const { result } = renderHook(() => useSocialAutopilotMcp());
    for (const mutation of Object.values(result.current.mutations)) {
      expect(mutation).toHaveProperty("mutate");
      expect(mutation).toHaveProperty("mutateAsync");
      expect(mutation).toHaveProperty("data");
      expect(mutation).toHaveProperty("error");
      expect(mutation).toHaveProperty("isLoading");
      expect(mutation).toHaveProperty("reset");
    }
  });

  it("connectAccount mutation starts not loading", () => {
    const { result } = renderHook(() => useSocialAutopilotMcp());
    expect(result.current.mutations.connectAccount.isLoading).toBe(false);
  });

  it("schedulePost mutation starts with no data and no error", () => {
    const { result } = renderHook(() => useSocialAutopilotMcp());
    expect(result.current.mutations.schedulePost.data).toBeUndefined();
    expect(result.current.mutations.schedulePost.error).toBeUndefined();
  });

  it("account group contains connectAccount, disconnectAccount, accountHealthCheck", () => {
    const { result } = renderHook(() => useSocialAutopilotMcp());
    const { mutations } = result.current;
    expect(mutations.connectAccount).toBeDefined();
    expect(mutations.disconnectAccount).toBeDefined();
    expect(mutations.accountHealthCheck).toBeDefined();
  });

  it("calendar group contains schedulePost, bulkSchedule, reschedulePost", () => {
    const { result } = renderHook(() => useSocialAutopilotMcp());
    const { mutations } = result.current;
    expect(mutations.schedulePost).toBeDefined();
    expect(mutations.bulkSchedule).toBeDefined();
    expect(mutations.reschedulePost).toBeDefined();
  });

  it("analytics group contains engagementMetrics, contentPerformance, autoBoostRules", () => {
    const { result } = renderHook(() => useSocialAutopilotMcp());
    const { mutations } = result.current;
    expect(mutations.engagementMetrics).toBeDefined();
    expect(mutations.contentPerformance).toBeDefined();
    expect(mutations.autoBoostRules).toBeDefined();
  });
});
