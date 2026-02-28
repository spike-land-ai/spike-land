#!/bin/bash

# Create Test Apps for /my-apps Testing
# This script creates 5 different apps to test the agent workflow

set -e

API_URL="${1:-http://localhost:3000}"
E2E_AUTH="${E2E_BYPASS_SECRET:-}"

if [ -z "$E2E_AUTH" ]; then
  echo "Error: E2E_BYPASS_SECRET environment variable not set"
  echo "Please set it before running this script"
  exit 1
fi

echo "======================================"
echo "Creating 5 Test Apps"
echo "API URL: $API_URL"
echo "======================================"
echo ""

# Array to store app IDs
declare -a APP_IDS

# App 1: Colorful Counter
echo "[1/5] Creating colorful counter app..."
APP1=$(curl -s -X POST "$API_URL/api/apps" \
  -H 'Content-Type: application/json' \
  -H "x-e2e-auth-bypass: $E2E_AUTH" \
  -d '{
    "name": "Vibrant Counter",
    "description": "A colorful counter with big numbers and colorful buttons"
  }' | jq -r '.id')

if [ "$APP1" != "null" ] && [ -n "$APP1" ]; then
  echo "  ✓ Created app ID: $APP1"
  APP_IDS+=("$APP1")

  # Send initial message
  curl -s -X POST "$API_URL/api/apps/$APP1/agent/chat" \
    -H 'Content-Type: application/json' \
    -H "x-e2e-auth-bypass: $E2E_AUTH" \
    -d '{"content": "Create a vibrant counter: huge purple number in center, green plus button, red minus button, fun gradients"}' > /dev/null
  echo "  ✓ Sent chat message"
else
  echo "  ✗ Failed to create app"
fi
echo ""

# App 2: Todo List
echo "[2/5] Creating todo list app..."
APP2=$(curl -s -X POST "$API_URL/api/apps" \
  -H 'Content-Type: application/json' \
  -H "x-e2e-auth-bypass: $E2E_AUTH" \
  -d '{
    "name": "Modern Todo List",
    "description": "A beautiful todo list with checkboxes and delete buttons"
  }' | jq -r '.id')

if [ "$APP2" != "null" ] && [ -n "$APP2" ]; then
  echo "  ✓ Created app ID: $APP2"
  APP_IDS+=("$APP2")

  curl -s -X POST "$API_URL/api/apps/$APP2/agent/chat" \
    -H 'Content-Type: application/json' \
    -H "x-e2e-auth-bypass: $E2E_AUTH" \
    -d '{"content": "Build a colorful todo list with input, add button, checkboxes, and delete buttons. Use bright colors and gradients."}' > /dev/null
  echo "  ✓ Sent chat message"
else
  echo "  ✗ Failed to create app"
fi
echo ""

# App 3: Color Picker
echo "[3/5] Creating color picker app..."
APP3=$(curl -s -X POST "$API_URL/api/apps" \
  -H 'Content-Type: application/json' \
  -H "x-e2e-auth-bypass: $E2E_AUTH" \
  -d '{
    "name": "Color Picker Tool",
    "description": "Interactive color picker showing hex and RGB values"
  }' | jq -r '.id')

if [ "$APP3" != "null" ] && [ -n "$APP3" ]; then
  echo "  ✓ Created app ID: $APP3"
  APP_IDS+=("$APP3")

  curl -s -X POST "$API_URL/api/apps/$APP3/agent/chat" \
    -H 'Content-Type: application/json' \
    -H "x-e2e-auth-bypass: $E2E_AUTH" \
    -d '{"content": "Create a color picker: large color preview box, RGB sliders, hex code display, HSL values. Make it beautiful!"}' > /dev/null
  echo "  ✓ Sent chat message"
else
  echo "  ✗ Failed to create app"
fi
echo ""

# App 4: Timer
echo "[4/5] Creating countdown timer app..."
APP4=$(curl -s -X POST "$API_URL/api/apps" \
  -H 'Content-Type: application/json' \
  -H "x-e2e-auth-bypass: $E2E_AUTH" \
  -d '{
    "name": "Countdown Timer",
    "description": "A stylish countdown timer with controls"
  }' | jq -r '.id')

if [ "$APP4" != "null" ] && [ -n "$APP4" ]; then
  echo "  ✓ Created app ID: $APP4"
  APP_IDS+=("$APP4")

  curl -s -X POST "$API_URL/api/apps/$APP4/agent/chat" \
    -H 'Content-Type: application/json' \
    -H "x-e2e-auth-bypass: $E2E_AUTH" \
    -d '{"content": "Build a countdown timer: big digital display, input for minutes/seconds, start/pause/reset buttons, colorful design"}' > /dev/null
  echo "  ✓ Sent chat message"
else
  echo "  ✗ Failed to create app"
fi
echo ""

# App 5: Calculator
echo "[5/5] Creating calculator app..."
APP5=$(curl -s -X POST "$API_URL/api/apps" \
  -H 'Content-Type: application/json' \
  -H "x-e2e-auth-bypass: $E2E_AUTH" \
  -d '{
    "name": "Simple Calculator",
    "description": "A colorful calculator with basic operations"
  }' | jq -r '.id')

if [ "$APP5" != "null" ] && [ -n "$APP5" ]; then
  echo "  ✓ Created app ID: $APP5"
  APP_IDS+=("$APP5")

  curl -s -X POST "$API_URL/api/apps/$APP5/agent/chat" \
    -H 'Content-Type: application/json' \
    -H "x-e2e-auth-bypass: $E2E_AUTH" \
    -d '{"content": "Create a calculator: display screen, number buttons (0-9), operation buttons (+,-,*,/), equals and clear. Use a modern, colorful design with gradients."}' > /dev/null
  echo "  ✓ Sent chat message"
else
  echo "  ✗ Failed to create app"
fi
echo ""

echo "======================================"
echo "Summary"
echo "======================================"
echo "Created ${#APP_IDS[@]} apps successfully:"
echo ""
for APP_ID in "${APP_IDS[@]}"; do
  echo "  $API_URL/my-apps/$APP_ID"
done
echo ""
echo "Next steps:"
echo "1. Trigger agent polling: yarn agent:poll:once"
echo "2. Open browser to verify: $API_URL/my-apps"
echo "======================================"
