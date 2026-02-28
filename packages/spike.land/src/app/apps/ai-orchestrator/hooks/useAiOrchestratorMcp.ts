"use client";

import { useMcpMutation } from "@/lib/mcp/client/hooks/use-mcp-mutation";

export function useAiOrchestratorMcp() {
  // Pipeline mutations
  const createPipeline = useMcpMutation("create_pipeline");
  const runPipeline = useMcpMutation("run_pipeline");
  const editStep = useMcpMutation("edit_pipeline_step");
  const listModels = useMcpMutation("list_models");
  const testPrompt = useMcpMutation("test_prompt");
  const compareOutputs = useMcpMutation("compare_outputs");
  const savePipeline = useMcpMutation("save_pipeline");
  const loadTemplate = useMcpMutation("load_pipeline_template");

  // Swarm mutations
  const listAgents = useMcpMutation("swarm_list_agents");
  const getAgent = useMcpMutation("swarm_get_agent");
  const spawnAgent = useMcpMutation("swarm_spawn_agent");
  const stopAgent = useMcpMutation("swarm_stop_agent");
  const redirectAgent = useMcpMutation("swarm_redirect_agent");
  const broadcast = useMcpMutation("swarm_broadcast");
  const agentTimeline = useMcpMutation("swarm_agent_timeline");
  const topology = useMcpMutation("swarm_topology");
  const sendMessage = useMcpMutation("swarm_send_message");
  const readMessages = useMcpMutation("swarm_read_messages");
  const delegateTask = useMcpMutation("swarm_delegate_task");

  return {
    mutations: {
      // Pipeline
      createPipeline,
      runPipeline,
      editStep,
      listModels,
      testPrompt,
      compareOutputs,
      savePipeline,
      loadTemplate,
      // Swarm
      listAgents,
      getAgent,
      spawnAgent,
      stopAgent,
      redirectAgent,
      broadcast,
      agentTimeline,
      topology,
      sendMessage,
      readMessages,
      delegateTask,
    },
  };
}
