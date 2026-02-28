#!/bin/bash
set -euo pipefail

# Ensure MCP_API_KEY is set for the agents to connect to spike-land-dev
export MCP_API_KEY=${SPIKE_LAND_API_KEY:-}

mkdir -p logs

# Array of MCP Tool Categories and their specific instructions
areas=(
  "QA Studio: Test tools like qa_navigate, qa_screenshot, qa_accessibility, qa_console, qa_network, qa_viewport, qa_evaluate, qa_tabs, qa_test_run, qa_coverage."
  # "Chess System: Test tools like chess_game, chess_player, chess_challenge, chess_replay, chess_tournament."
  # "App Store: Test tools like store_apps, store_install, store_search, store_skills, store_ab."
  # "Billing & Stripe: Test tools like billing, stripe_checkout, subscriptions."
  # "Brand & Marketing: Test tools like brand_brain, brand_campaigns, merch."
  # "CleanSweep (Gamified Cleaning): Test tools like clean_rooms, clean_tasks, clean_photo, clean_scanner, clean_streaks, clean_reminders, clean_motivate, clean_verify."
  # "Codebase & Dev: Test tools like codebase_explain, codegen, esbuild, dev, build_from_github."
  # "Communication: Test tools like chat, direct_message, relay, inbox, agent_inbox."
  # "Content Management: Test tools like blog_management, album_management, album_images, gallery, blog."
  # "Core Platform: Test tools like capabilities, auth, permissions, workspaces, session, policy, gateway, audit."
  # "Creative & AI: Test tools like creative, image, ai_gateway, tts, batch_enhance, page_ai."
  # "Infrastructure: Test tools like filesystem, storage, vault, audit, allocator, jobs, enhancement_jobs."
  # "Orchestration: Test tools like swarm, swarm_monitoring, orchestrator, pipelines, pipeline, scout, pulse."
  # "Planning & Decisions: Test tools like planning_tools, decisions, retro, req_interview, ab_testing."
  # "Simulation & Games: Test tools like netsim, tabletop, arena, tabletop_state, bft, causality."
  # "State Machine: Test tools like state_machine, state_machine_templates."
)

batch_size=2
count=0
for area in "${areas[@]}"; do
  echo "Spawning Gemini agent #${count} for area: ${area}"
  gemini -m gemini-3-flash-preview --yolo -p "You are a QA agent specializing in MCP tools.
Your task is to test the following category of tools on the spike-land-dev MCP server (http://localhost:3000/api/mcp): ${area}

Focus on:
1. Tool discovery (list_tools).
2. Protocol compliance (calling tools with valid/invalid inputs).
3. Functional correctness (verifying tool effects where possible).

For every unique finding (bug, edge case failure, or improvement), create a GitHub issue with the label 'agent-created' and 'bug' or 'tech-debt' as appropriate, following the format in GEMINI.md.
Include reproduction steps and tool call examples in the issue body.
Stop once you have thoroughly checked these specific tools." > "logs/agent-${count}.log" 2>&1 &

  count=$((count + 1))
  if [ $((count % batch_size)) -eq 0 ]; then
    echo "Reached batch size ${batch_size}, waiting 60s before next batch..."
    sleep 60
  else
    sleep 30
  fi
done

wait
echo "All ${#areas[@]} parallel MCP tool testing agents have completed."
