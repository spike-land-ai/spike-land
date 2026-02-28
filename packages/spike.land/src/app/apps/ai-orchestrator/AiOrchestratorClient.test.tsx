import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Module mocks (must be hoisted) ---

const mockMutate = vi.hoisted(() => vi.fn());
const mockMutateAsync = vi.hoisted(() => vi.fn());

const mockUseMcpMutation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutation,
}));

vi.mock("@/lib/mcp/client/hooks/use-mcp-tool", () => ({
  useMcpTool: vi.fn(() => ({ data: undefined, isLoading: false, error: undefined })),
}));

// next/link renders a simple anchor in tests
vi.mock("next/link", () => ({
  default: (
    { href, children, ...props }: {
      href: string;
      children: React.ReactNode;
      [key: string]: unknown;
    },
  ) => <a href={href} {...props}>{children}</a>,
}));

import { AiOrchestratorClient } from "./AiOrchestratorClient";

function makeMutation(overrides: Partial<{
  mutate: typeof mockMutate;
  mutateAsync: typeof mockMutateAsync;
  isLoading: boolean;
  data: unknown;
  error: Error | undefined;
}> = {}) {
  return {
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    isLoading: false,
    data: undefined,
    error: undefined,
    reset: vi.fn(),
    ...overrides,
  };
}

describe("AiOrchestratorClient", () => {
  beforeEach(() => {
    mockMutate.mockReset().mockResolvedValue(undefined);
    mockMutateAsync.mockReset().mockResolvedValue(undefined);
    mockUseMcpMutation.mockReset().mockReturnValue(makeMutation());
  });

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  describe("header", () => {
    it("renders the AI Orchestrator title", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByText("AI Orchestrator")).toBeInTheDocument();
    });

    it("renders a back link to /store", () => {
      render(<AiOrchestratorClient />);
      const backLink = screen.getByRole("link", { name: /back to store/i });
      expect(backLink).toHaveAttribute("href", "/store");
    });

    it("renders the Run Pipeline button", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByRole("button", { name: /run pipeline/i })).toBeInTheDocument();
    });

    it("renders the Save button", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  describe("tab navigation", () => {
    it("renders all four tab triggers", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByRole("tab", { name: /swarm/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /pipeline/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /messages/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /topology/i })).toBeInTheDocument();
    });

    it("shows the swarm tab content by default", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByText(/swarm overview/i)).toBeInTheDocument();
    });

    it("switches to the Pipeline tab when clicked", async () => {
      const user = userEvent.setup();
      render(<AiOrchestratorClient />);
      const pipelineTab = screen.getByRole("tab", { name: /pipeline/i });
      await user.click(pipelineTab);
      expect(pipelineTab).toHaveAttribute("aria-selected", "true");
    });

    it("switches to the Messages tab when clicked", async () => {
      const user = userEvent.setup();
      render(<AiOrchestratorClient />);
      const messagesTab = screen.getByRole("tab", { name: /messages/i });
      await user.click(messagesTab);
      expect(messagesTab).toHaveAttribute("aria-selected", "true");
    });

    it("switches to the Topology tab when clicked", async () => {
      render(<AiOrchestratorClient />);
      const topologyTab = screen.getByRole("tab", { name: /topology/i });
      await act(async () => {
        fireEvent.click(topologyTab);
      });
      expect(screen.getByText(/topology/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Sidebar — Templates
  // ---------------------------------------------------------------------------

  describe("templates sidebar", () => {
    it("renders the Templates section", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByText("Templates")).toBeInTheDocument();
    });

    it("renders all four template buttons", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByText("Code Generator")).toBeInTheDocument();
      expect(screen.getByText("Content Pipeline")).toBeInTheDocument();
      expect(screen.getByText("Data Transformer")).toBeInTheDocument();
      expect(screen.getByText("Chat Agent")).toBeInTheDocument();
    });

    it("calls loadTemplate mutation when a template is clicked", async () => {
      render(<AiOrchestratorClient />);
      const templateBtn = screen.getByText("Code Generator");
      await act(async () => {
        fireEvent.click(templateBtn);
      });
      expect(mockMutate).toHaveBeenCalledWith({ template: "Code Generator" });
    });
  });

  // ---------------------------------------------------------------------------
  // Sidebar — Available Models
  // ---------------------------------------------------------------------------

  describe("models sidebar", () => {
    it("renders the Available Models section", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByText("Available Models")).toBeInTheDocument();
    });

    it("shows all four model providers", () => {
      render(<AiOrchestratorClient />);
      // Models appear in both the left sidebar and the prompt tester sidebar,
      // so we assert presence rather than uniqueness
      expect(screen.getAllByText("GPT-4o").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Claude 3.5").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Gemini 2.0").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Llama 3.1").length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Swarm Dashboard interactions
  // ---------------------------------------------------------------------------

  describe("swarm tab interactions", () => {
    it("calls listAgents mutation when Refresh is clicked", async () => {
      render(<AiOrchestratorClient />);
      const refreshBtn = screen.getByRole("button", { name: /refresh agents/i });
      await act(async () => {
        fireEvent.click(refreshBtn);
      });
      expect(mockMutate).toHaveBeenCalledWith({ status: "all" });
    });

    it("calls spawnAgent mutation when Spawn is clicked", async () => {
      render(<AiOrchestratorClient />);
      const spawnBtn = screen.getByRole("button", { name: /spawn/i });
      await act(async () => {
        fireEvent.click(spawnBtn);
      });
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ machine_id: "local" }),
      );
    });

    it("calls broadcast mutation when Broadcast button is clicked", async () => {
      render(<AiOrchestratorClient />);
      const broadcastBtn = screen.getByRole("button", { name: /broadcast/i });
      await act(async () => {
        fireEvent.click(broadcastBtn);
      });
      expect(mockMutate).toHaveBeenCalledWith({
        content: "Status check: please report current task.",
      });
    });

    it("renders demo agents", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByText("Architect Alpha")).toBeInTheDocument();
      expect(screen.getByText("Builder Beta")).toBeInTheDocument();
      expect(screen.getByText("Reviewer Gamma")).toBeInTheDocument();
    });

    it("calls stopAgent mutation when stop is clicked for an active agent", async () => {
      render(<AiOrchestratorClient />);
      const stopBtns = screen.getAllByRole("button", { name: /stop agent/i });
      await act(async () => {
        fireEvent.click(stopBtns[0]!);
      });
      expect(mockMutate).toHaveBeenCalledWith({ agent_id: "agent-001" });
    });

    it("calls sendMessage mutation when send message is clicked", async () => {
      render(<AiOrchestratorClient />);
      const sendBtns = screen.getAllByRole("button", { name: /send message/i });
      await act(async () => {
        fireEvent.click(sendBtns[0]!);
      });
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ content: "Hello from the dashboard!" }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Pipeline tab interactions
  // ---------------------------------------------------------------------------

  describe("pipeline tab interactions", () => {
    async function openPipelineTab() {
      const user = userEvent.setup();
      render(<AiOrchestratorClient />);
      const pipelineTab = screen.getByRole("tab", { name: /pipeline/i });
      await user.click(pipelineTab);
      return user;
    }

    it("renders the Pipeline tab label", async () => {
      render(<AiOrchestratorClient />);
      const pipelineTab = screen.getByRole("tab", { name: /pipeline/i });
      expect(pipelineTab).toBeInTheDocument();
    });

    it("Pipeline tab becomes selected when clicked", async () => {
      await openPipelineTab();
      expect(screen.getByRole("tab", { name: /pipeline/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });

    it("calls runPipeline mutation when Run Pipeline header button is clicked", async () => {
      render(<AiOrchestratorClient />);
      const runBtn = screen.getByRole("button", { name: /run pipeline/i });
      await act(async () => {
        fireEvent.click(runBtn);
      });
      expect(mockMutate).toHaveBeenCalledWith({});
    });

    it("calls savePipeline mutation when Save is clicked", async () => {
      render(<AiOrchestratorClient />);
      const saveBtn = screen.getByRole("button", { name: /save/i });
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      expect(mockMutate).toHaveBeenCalledWith({});
    });

    it("calls editStep mutation when Add Step is clicked", async () => {
      const user = await openPipelineTab();
      // After switching to Pipeline tab, find the Add Step button
      const addBtn = screen.getByRole("button", { name: /add step/i });
      await user.click(addBtn);
      expect(mockMutate).toHaveBeenCalledWith({});
    });
  });

  // ---------------------------------------------------------------------------
  // Prompt Tester sidebar
  // ---------------------------------------------------------------------------

  describe("prompt tester", () => {
    it("renders the Prompt Tester section", () => {
      render(<AiOrchestratorClient />);
      expect(screen.getByText("Prompt Tester")).toBeInTheDocument();
    });

    it("renders the prompt textarea", () => {
      render(<AiOrchestratorClient />);
      expect(
        screen.getByPlaceholderText(/enter a test prompt/i),
      ).toBeInTheDocument();
    });

    it("Test Prompt button is disabled when prompt is empty", () => {
      render(<AiOrchestratorClient />);
      const testBtn = screen.getByRole("button", { name: /test prompt/i });
      expect(testBtn).toBeDisabled();
    });

    it("Test Prompt button is enabled when prompt has text", async () => {
      render(<AiOrchestratorClient />);
      const textarea = screen.getByPlaceholderText(/enter a test prompt/i);
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "Hello world" } });
      });
      const testBtn = screen.getByRole("button", { name: /test prompt/i });
      expect(testBtn).not.toBeDisabled();
    });

    it("calls testPrompt mutation and shows output when Test Prompt is clicked", async () => {
      render(<AiOrchestratorClient />);
      const textarea = screen.getByPlaceholderText(/enter a test prompt/i);
      await act(async () => {
        fireEvent.change(textarea, { target: { value: "My test prompt" } });
      });
      const testBtn = screen.getByRole("button", { name: /test prompt/i });
      await act(async () => {
        fireEvent.click(testBtn);
      });
      expect(mockMutate).toHaveBeenCalledWith({ prompt: "My test prompt" });
      expect(
        screen.getByText("Test complete. Check MCP response for details."),
      ).toBeInTheDocument();
    });

    it("shows placeholder text when no output yet", () => {
      render(<AiOrchestratorClient />);
      expect(
        screen.getByText("Output will appear here..."),
      ).toBeInTheDocument();
    });

    it("calls compareOutputs mutation when Compare Outputs is clicked", async () => {
      render(<AiOrchestratorClient />);
      const compareBtn = screen.getByRole("button", { name: /compare outputs/i });
      await act(async () => {
        fireEvent.click(compareBtn);
      });
      expect(mockMutate).toHaveBeenCalledWith({});
    });
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  describe("loading state", () => {
    it("disables the Refresh button while refreshing", async () => {
      let resolveListAgents: (v: unknown) => void;
      const listAgentsMutate = vi.fn(
        () =>
          new Promise(resolve => {
            resolveListAgents = resolve;
          }),
      );

      mockUseMcpMutation.mockImplementation((name: string) => {
        if (name === "swarm_list_agents") {
          return makeMutation({ mutate: listAgentsMutate });
        }
        return makeMutation();
      });

      render(<AiOrchestratorClient />);
      const refreshBtn = screen.getByRole("button", { name: /refresh agents/i });

      act(() => {
        fireEvent.click(refreshBtn);
      });

      // After click, while promise is still pending, isRefreshing=true
      expect(refreshBtn).toBeDisabled();

      await act(async () => {
        resolveListAgents!(undefined);
      });
    });
  });
});
