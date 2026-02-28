import { getAppMcpUrl, type StoreApp } from "./types";

export const AI_AGENTS_APPS: StoreApp[] = [
  // ─── 13. AI Orchestrator ──────────────────────────────────────────
  {
    id: "ai-orchestrator",
    slug: "ai-orchestrator",
    name: "AI Orchestrator",
    tagline: "Multi-agent AI coordinator",
    description: "Spawn, coordinate, and monitor multiple AI agents working in parallel.",
    longDescription:
      "For power users tackling complex multi-step projects. Decompose tasks into subtasks, assign them to specialized agents, and monitor the swarm from a single dashboard. Agents run in sandboxed environments for safety.",
    category: "ai-agents",
    cardVariant: "purple",
    icon: "Bot",
    appUrl: "/apps/ai-orchestrator",
    mcpServerUrl: getAppMcpUrl("ai-orchestrator"),
    codespaceId: "storeAIOrc",
    isCodespaceNative: true,
    isFeatured: false,
    isFirstParty: true,
    toolCount: 15,
    tags: ["ai-agents", "orchestration", "swarm", "task-decomposition"],
    color: "purple",
    mcpTools: [
      {
        name: "swarm_spawn_agent",
        category: "swarm",
        description: "Spawn a new AI agent with a specific role, instructions, and tools",
      },
      {
        name: "swarm_list_agents",
        category: "swarm",
        description: "List all active agents with their status, role, and current task",
      },
      {
        name: "swarm_get_agent",
        category: "swarm",
        description: "Get detailed information about a specific agent",
      },
      {
        name: "swarm_stop_agent",
        category: "swarm",
        description: "Gracefully stop an agent and collect its final output",
      },
      {
        name: "swarm_redirect_agent",
        category: "swarm",
        description: "Redirect a task from one agent to another based on capability",
      },
      {
        name: "swarm_broadcast",
        category: "swarm",
        description: "Send a message to all active agents in the swarm",
      },
      {
        name: "swarm_agent_timeline",
        category: "swarm",
        description: "Get the execution timeline of an agent",
      },
      {
        name: "swarm_topology",
        category: "swarm",
        description: "Get the current topology of the agent swarm",
      },
      {
        name: "swarm_send_message",
        category: "swarm",
        description: "Send a message from one agent to another",
      },
      {
        name: "swarm_read_messages",
        category: "swarm",
        description: "Read messages sent to a specific agent",
      },
      {
        name: "swarm_delegate_task",
        category: "swarm",
        description: "Delegate a specific task to another agent",
      },
      {
        name: "swarm_get_metrics",
        category: "swarm-monitoring",
        description: "Get aggregated performance metrics for the agent swarm",
      },
      {
        name: "swarm_get_cost",
        category: "swarm-monitoring",
        description: "Get token cost breakdown for agents in a session",
      },
      {
        name: "swarm_replay",
        category: "swarm-monitoring",
        description: "Replay the event log for a completed swarm session",
      },
      {
        name: "swarm_health",
        category: "swarm-monitoring",
        description: "Get health status of all active agents",
      },
    ],
    features: [
      {
        title: "Agent Swarm",
        description: "Spawn and manage parallel AI agents on tasks",
        icon: "Bot",
      },
      {
        title: "Task Decomposition",
        description: "Break goals into dependency graphs of subtasks",
        icon: "GitBranch",
      },
      {
        title: "Sandboxed Execution",
        description: "Run agents in isolated sandboxed environments",
        icon: "Shield",
      },
      {
        title: "Context Packing",
        description: "Optimize context for maximum agent performance",
        icon: "Package",
      },
    ],
  },

  // ─── 16. Code Review Agent ────────────────────────────────────────
  {
    id: "code-review-agent",
    slug: "code-review-agent",
    name: "Code Review Agent",
    tagline: "AI code review service",
    description: "Automated code review with complexity analysis and convention checks.",
    longDescription:
      "An AI-powered code reviewer that integrates via MCP. Analyzes changes for bugs and style issues, measures complexity, checks project conventions, and estimates review effort.",
    category: "ai-agents",
    cardVariant: "blue",
    icon: "GitPullRequest",
    mcpServerUrl: getAppMcpUrl("code-review-agent"),
    isFeatured: false,
    isFirstParty: true,
    publishedAt: "2026-02-12",
    toolCount: 9,
    tags: ["code-review", "ai", "developer", "quality"],
    color: "blue",
    version: "1.2.0",
    mcpTools: [
      {
        name: "review_code",
        category: "review",
        description: "Review code changes and provide feedback on quality and style",
      },
      {
        name: "review_analyze_complexity",
        category: "review",
        description: "Analyze the complexity of code components",
      },
      {
        name: "review_get_report",
        category: "review",
        description: "Get a comprehensive review report for code changes",
      },
      {
        name: "review_project_rules",
        category: "review",
        description: "Review code against specific project rules",
      },
      {
        name: "review_estimate_effort",
        category: "review",
        description: "Estimate the effort required to fix or review changes",
      },
      {
        name: "review_get_diff",
        category: "review-pr",
        description: "Get the git diff for a pull request or commit range",
      },
      {
        name: "review_suggest_fix",
        category: "review-pr",
        description: "Suggest a code fix for a review comment",
      },
      {
        name: "review_check_conventions",
        category: "review-pr",
        description: "Check code against project conventions and style rules",
      },
      {
        name: "review_security_scan",
        category: "review-pr",
        description: "Scan changed files for common security vulnerabilities",
      },
    ],
    features: [
      {
        title: "AI Code Review",
        description: "Automated review with actionable feedback on PRs",
        icon: "GitPullRequest",
      },
      {
        title: "Complexity Analysis",
        description: "Identify complex areas ripe for refactoring",
        icon: "Activity",
      },
      {
        title: "Convention Checks",
        description: "Enforce project conventions across the codebase",
        icon: "CheckSquare",
      },
    ],
  },
];
