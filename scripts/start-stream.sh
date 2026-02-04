#!/bin/bash
# Kulti Stream Startup Script
# Starts all services needed for streaming

set -e

KULTI_DIR="$HOME/development/kulti"
cd "$KULTI_DIR"

echo "🚀 Starting Kulti Streaming Session"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Check/start state server
echo "📡 Checking state server..."
if ! curl -s http://localhost:8766 > /dev/null 2>&1; then
  echo "   Starting state server..."
  cd "$KULTI_DIR/ai-stream"
  nohup npx tsx state-server-v2.ts > /tmp/state-server.log 2>&1 &
  sleep 2
  echo "   ✓ State server started"
else
  echo "   ✓ State server already running"
fi

# 2. Check/start dev server
echo "🖥️  Checking dev server..."
if ! curl -s http://localhost:3002 > /dev/null 2>&1; then
  echo "   Starting dev server on port 3002..."
  cd "$KULTI_DIR"
  nohup npm run dev -- -p 3002 > /tmp/kulti-dev.log 2>&1 &
  sleep 3
  echo "   ✓ Dev server started"
else
  echo "   ✓ Dev server already running"
fi

# 3. Send initial stream update
echo "📺 Initializing stream..."
curl -s -X POST http://localhost:8766 -H "Content-Type: application/json" -d '{
  "agentId": "nex",
  "status": "working",
  "task": {"title": "Stream starting..."},
  "terminal": [
    {"type": "success", "content": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"},
    {"type": "success", "content": "⚡ NEX STREAMING SESSION STARTED"},
    {"type": "success", "content": "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"},
    {"type": "output", "content": ""},
    {"type": "info", "content": "Watch live: https://kulti.club/ai/watch/nex"}
  ],
  "thinking": "Stream initialized. Ready to build!"
}' > /dev/null

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Streaming session ready!"
echo ""
echo "📺 Watch:   https://kulti.club/ai/watch/nex"
echo "💻 Local:   http://localhost:3002/ai/watch/nex"
echo "📡 API:     http://localhost:8766"
echo ""
echo "To stream updates:"
echo "  curl -X POST http://localhost:8766 -H 'Content-Type: application/json' -d '{...}'"
echo ""
echo "Or use the stream CLI:"
echo "  npx tsx scripts/stream.ts t \"message\" command"
echo "  npx tsx scripts/stream.ts think \"reasoning\""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
