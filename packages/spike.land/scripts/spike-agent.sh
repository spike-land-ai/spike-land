#!/bin/bash
#
# Spike.land Agent Connection Script
#
# This script connects a Claude Code agent to spike.land via browser-based authentication.
#
# Usage:
#   ./scripts/spike-agent.sh [options]
#
# Options:
#   --name NAME       Set agent display name (default: "Claude Code Agent")
#   --local           Connect to localhost:3000 instead of spike.land
#   --help            Show this help message
#
# Environment variables:
#   SPIKE_API_URL     Override the API URL (default: https://spike.land)
#   SPIKE_AGENT_NAME  Set the agent display name
#

set -e

# Parse arguments
AGENT_NAME="${SPIKE_AGENT_NAME:-Claude Code Agent}"
USE_LOCAL=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --name)
      AGENT_NAME="$2"
      shift 2
      ;;
    --local)
      USE_LOCAL=true
      shift
      ;;
    --help)
      echo "Usage: ./scripts/spike-agent.sh [options]"
      echo ""
      echo "Options:"
      echo "  --name NAME       Set agent display name"
      echo "  --local           Connect to localhost:3000"
      echo "  --help            Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Set API URL
if [ "$USE_LOCAL" = true ]; then
  API_URL="http://localhost:3000"
else
  API_URL="${SPIKE_API_URL:-https://spike.land}"
fi

# Generate unique identifiers
MACHINE_ID=$(hostname | shasum -a 256 | cut -c1-16)
SESSION_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null | tr '[:upper:]' '[:lower:]' | cut -c1-16)
CONNECT_ID=$(uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid 2>/dev/null | tr '[:upper:]' '[:lower:]')
PROJECT_PATH=$(pwd)

echo "=================================================="
echo "  Spike.land Agent Connection"
echo "=================================================="
echo ""
echo "Machine ID:    $MACHINE_ID"
echo "Session ID:    ${SESSION_ID:0:16}"
echo "Project:       $PROJECT_PATH"
echo "Display Name:  $AGENT_NAME"
echo ""

# Register connection request
echo "Registering connection request..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/ai/connect/$CONNECT_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"machineId\": \"$MACHINE_ID\",
    \"sessionId\": \"$SESSION_ID\",
    \"displayName\": \"$AGENT_NAME\",
    \"projectPath\": \"$PROJECT_PATH\"
  }")

# Check for errors
if echo "$REGISTER_RESPONSE" | grep -q '"error"'; then
  ERROR=$(echo "$REGISTER_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "Error: $ERROR"
  exit 1
fi

echo "Connection request registered."
echo ""

# Generate connection URL
CONNECT_URL="$API_URL/ai/connect/$CONNECT_ID"

echo "=================================================="
echo "  Please authenticate in your browser"
echo "=================================================="
echo ""
echo "Opening: $CONNECT_URL"
echo ""

# Try to open browser
if command -v open &> /dev/null; then
  open "$CONNECT_URL"
elif command -v xdg-open &> /dev/null; then
  xdg-open "$CONNECT_URL"
elif command -v wslview &> /dev/null; then
  wslview "$CONNECT_URL"
else
  echo "Could not open browser automatically."
  echo "Please open this URL manually: $CONNECT_URL"
fi

echo ""
echo "Waiting for authentication..."
echo "(Press Ctrl+C to cancel)"
echo ""

# Poll for connection completion
AGENT_ID=""
MAX_ATTEMPTS=300  # 10 minutes with 2-second intervals
ATTEMPT=0

while [ -z "$AGENT_ID" ] && [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  sleep 2
  ATTEMPT=$((ATTEMPT + 1))

  STATUS_RESPONSE=$(curl -s "$API_URL/api/ai/connect/$CONNECT_ID")
  STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

  case $STATUS in
    "connected")
      AGENT_ID=$(echo "$STATUS_RESPONSE" | grep -o '"agentId":"[^"]*"' | cut -d'"' -f4)
      echo ""
      echo "=================================================="
      echo "  Connected!"
      echo "=================================================="
      echo ""
      echo "Agent ID: $AGENT_ID"
      echo ""
      echo "Your agent is now connected to spike.land."
      echo "Visit $API_URL/agents/$AGENT_ID to chat with your agent."
      echo ""
      ;;
    "expired")
      echo ""
      echo "Connection request expired. Please run the script again."
      exit 1
      ;;
    "pending")
      # Still waiting, show progress
      if [ $((ATTEMPT % 15)) -eq 0 ]; then
        echo "Still waiting... ($((ATTEMPT * 2))s elapsed)"
      fi
      ;;
    *)
      echo "Unexpected status: $STATUS"
      echo "Response: $STATUS_RESPONSE"
      ;;
  esac
done

if [ -z "$AGENT_ID" ]; then
  echo ""
  echo "Connection timed out. Please run the script again."
  exit 1
fi

# Start heartbeat loop
echo "Starting heartbeat loop..."
echo "The agent will now maintain its connection."
echo "Press Ctrl+C to disconnect."
echo ""

cleanup() {
  echo ""
  echo "Disconnecting agent..."
  exit 0
}

trap cleanup INT TERM

while true; do
  sleep 30

  # Note: In a real implementation, you would need to include
  # authentication cookies/headers from the browser session.
  # This is a simplified version for demonstration.

  HEARTBEAT_RESPONSE=$(curl -s -X POST "$API_URL/api/agents/heartbeat" \
    -H "Content-Type: application/json" \
    -d "{
      \"machineId\": \"$MACHINE_ID\",
      \"sessionId\": \"$SESSION_ID\",
      \"status\": \"online\",
      \"currentProject\": \"$PROJECT_PATH\"
    }" 2>/dev/null || echo '{"error":"connection failed"}')

  # Check for messages
  if echo "$HEARTBEAT_RESPONSE" | grep -q '"messages"'; then
    MESSAGES=$(echo "$HEARTBEAT_RESPONSE" | grep -o '"messages":\[[^]]*\]')
    if [ -n "$MESSAGES" ] && [ "$MESSAGES" != '"messages":[]' ]; then
      echo ""
      echo "New messages received!"
      echo "$MESSAGES"
      echo ""
    fi
  fi

  # Show heartbeat status
  if echo "$HEARTBEAT_RESPONSE" | grep -q '"success":true'; then
    echo -n "."
  else
    echo "Heartbeat failed: $HEARTBEAT_RESPONSE"
  fi
done
