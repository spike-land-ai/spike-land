import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mockUseMcpMutation = vi.hoisted(() => vi.fn());

vi.mock("@/lib/mcp/client/hooks/use-mcp-mutation", () => ({
  useMcpMutation: mockUseMcpMutation,
}));

import { useAiOrchestratorMcp } from "./useAiOrchestratorMcp";

function makeFakeMutation(name: string) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    data: undefined,
    error: undefined,
    isLoading: false,
    reset: vi.fn(),
    _name: name,
  };
}

describe("useAiOrchestratorMcp", () => {
  const fakeMutations: Record<string, ReturnType<typeof makeFakeMutation>> = {};

  const PIPELINE_TOOLS = [
    "create_pipeline",
    "run_pipeline",
    "edit_pipeline_step",
    "list_models",
    "test_prompt",
    "compare_outputs",
    "save_pipeline",
    "load_pipeline_template",
  ];

  const SWARM_TOOLS = [
    "swarm_list_agents",
    "swarm_get_agent",
    "swarm_spawn_agent",
    "swarm_stop_agent",
    "swarm_redirect_agent",
    "swarm_broadcast",
    "swarm_agent_timeline",
    "swarm_topology",
    "swarm_send_message",
    "swarm_read_messages",
    "swarm_delegate_task",
  ];

  const ALL_TOOLS = [...PIPELINE_TOOLS, ...SWARM_TOOLS];

  beforeEach(() => {
    mockUseMcpMutation.mockReset();
    for (const name of ALL_TOOLS) {
      fakeMutations[name] = makeFakeMutation(name);
    }
    mockUseMcpMutation.mockImplementation((name: string) => {
      return fakeMutations[name] ?? makeFakeMutation(name);
    });
  });

  describe("initialization", () => {
    it("calls useMcpMutation for each pipeline tool", () => {
      renderHook(() => useAiOrchestratorMcp());

      for (const tool of PIPELINE_TOOLS) {
        expect(mockUseMcpMutation).toHaveBeenCalledWith(tool);
      }
    });

    it("calls useMcpMutation for each swarm tool", () => {
      renderHook(() => useAiOrchestratorMcp());

      for (const tool of SWARM_TOOLS) {
        expect(mockUseMcpMutation).toHaveBeenCalledWith(tool);
      }
    });

    it("calls useMcpMutation exactly once per tool (no duplicates)", () => {
      renderHook(() => useAiOrchestratorMcp());
      expect(mockUseMcpMutation).toHaveBeenCalledTimes(ALL_TOOLS.length);
    });
  });

  describe("return shape", () => {
    it("returns a mutations object", () => {
      const { result } = renderHook(() => useAiOrchestratorMcp());
      expect(result.current).toHaveProperty("mutations");
      expect(typeof result.current.mutations).toBe("object");
    });

    describe("pipeline mutations", () => {
      it("exposes createPipeline", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.createPipeline).toBe(
          fakeMutations.create_pipeline,
        );
      });

      it("exposes runPipeline", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.runPipeline).toBe(
          fakeMutations.run_pipeline,
        );
      });

      it("exposes editStep (edit_pipeline_step)", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.editStep).toBe(
          fakeMutations.edit_pipeline_step,
        );
      });

      it("exposes listModels", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.listModels).toBe(
          fakeMutations.list_models,
        );
      });

      it("exposes testPrompt", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.testPrompt).toBe(
          fakeMutations.test_prompt,
        );
      });

      it("exposes compareOutputs", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.compareOutputs).toBe(
          fakeMutations.compare_outputs,
        );
      });

      it("exposes savePipeline", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.savePipeline).toBe(
          fakeMutations.save_pipeline,
        );
      });

      it("exposes loadTemplate (load_pipeline_template)", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.loadTemplate).toBe(
          fakeMutations.load_pipeline_template,
        );
      });
    });

    describe("swarm mutations", () => {
      it("exposes listAgents", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.listAgents).toBe(
          fakeMutations.swarm_list_agents,
        );
      });

      it("exposes getAgent", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.getAgent).toBe(
          fakeMutations.swarm_get_agent,
        );
      });

      it("exposes spawnAgent", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.spawnAgent).toBe(
          fakeMutations.swarm_spawn_agent,
        );
      });

      it("exposes stopAgent", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.stopAgent).toBe(
          fakeMutations.swarm_stop_agent,
        );
      });

      it("exposes redirectAgent", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.redirectAgent).toBe(
          fakeMutations.swarm_redirect_agent,
        );
      });

      it("exposes broadcast", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.broadcast).toBe(
          fakeMutations.swarm_broadcast,
        );
      });

      it("exposes agentTimeline", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.agentTimeline).toBe(
          fakeMutations.swarm_agent_timeline,
        );
      });

      it("exposes topology", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.topology).toBe(
          fakeMutations.swarm_topology,
        );
      });

      it("exposes sendMessage", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.sendMessage).toBe(
          fakeMutations.swarm_send_message,
        );
      });

      it("exposes readMessages", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.readMessages).toBe(
          fakeMutations.swarm_read_messages,
        );
      });

      it("exposes delegateTask", () => {
        const { result } = renderHook(() => useAiOrchestratorMcp());
        expect(result.current.mutations.delegateTask).toBe(
          fakeMutations.swarm_delegate_task,
        );
      });
    });

    it("mutations object has exactly 19 keys (8 pipeline + 11 swarm)", () => {
      const { result } = renderHook(() => useAiOrchestratorMcp());
      expect(Object.keys(result.current.mutations)).toHaveLength(19);
    });
  });

  describe("mutation identity stability", () => {
    it("does not change mutation references across re-renders", () => {
      const { result, rerender } = renderHook(() => useAiOrchestratorMcp());
      const first = result.current.mutations.createPipeline;
      rerender();
      expect(result.current.mutations.createPipeline).toBe(first);
    });
  });
});
