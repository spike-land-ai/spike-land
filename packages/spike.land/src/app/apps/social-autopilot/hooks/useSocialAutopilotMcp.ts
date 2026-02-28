"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";

export function useSocialAutopilotMcp() {
  // Account Mutations
  const connectAccount = useMcpMutation("connect_account");
  const disconnectAccount = useMcpMutation("disconnect_account");
  const accountHealthCheck = useMcpMutation("account_health_check");

  // Calendar Mutations
  const schedulePost = useMcpMutation("schedule_post");
  const bulkSchedule = useMcpMutation("bulk_schedule");
  const reschedulePost = useMcpMutation("reschedule_post");

  // Analytics Mutations
  const engagementMetrics = useMcpMutation("engagement_metrics");
  const contentPerformance = useMcpMutation("content_performance");
  const autoBoostRules = useMcpMutation("auto_boost_rules");

  return {
    mutations: {
      connectAccount,
      disconnectAccount,
      accountHealthCheck,
      schedulePost,
      bulkSchedule,
      reschedulePost,
      engagementMetrics,
      contentPerformance,
      autoBoostRules,
    },
  };
}
