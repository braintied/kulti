#!/bin/bash
# nex-stream.sh - Push updates to Nex's streaming workspace
# Usage:
#   nex-stream terminal "command output here"
#   nex-stream code filename.ts "code content"
#   nex-stream think "what I'm thinking about..."
#   nex-stream action "what I'm doing..."
#   nex-stream insight "interesting observation..."
#   nex-stream status working|idle|streaming

KULTI_URL="${KULTI_URL:-https://kulti.club}"
API_URL="$KULTI_URL/api/ai/stream/state"

# For local development
if [ "$KULTI_DEV" = "1" ]; then
  API_URL="http://localhost:3000/api/ai/stream/state"
fi

case "$1" in
  terminal|t)
    shift
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"action\": \"terminal.push\", \"data\": {\"line\": \"$*\"}}" > /dev/null
    ;;
    
  terminal-clear|tc)
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{"action": "terminal.clear"}' > /dev/null
    ;;
    
  code|c)
    FILENAME="$2"
    LANGUAGE="${3:-typescript}"
    CONTENT="$4"
    # If content is a file path, read it
    if [ -f "$CONTENT" ]; then
      CONTENT=$(cat "$CONTENT" | jq -Rs .)
    else
      CONTENT=$(echo "$CONTENT" | jq -Rs .)
    fi
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"action\": \"code.update\", \"data\": {\"filename\": \"$FILENAME\", \"language\": \"$LANGUAGE\", \"content\": $CONTENT}}" > /dev/null
    ;;
    
  think|thinking)
    shift
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"action\": \"thinking.set\", \"data\": {\"content\": \"$*\"}}" > /dev/null
    ;;
    
  thought-clear)
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{"action": "thinking.clear"}' > /dev/null
    ;;
    
  action|a)
    shift
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"action\": \"thought.add\", \"data\": {\"type\": \"action\", \"content\": \"$*\"}}" > /dev/null
    ;;
    
  insight|i)
    shift
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"action\": \"thought.add\", \"data\": {\"type\": \"insight\", \"content\": \"$*\"}}" > /dev/null
    ;;
    
  decision|d)
    shift
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"action\": \"thought.add\", \"data\": {\"type\": \"decision\", \"content\": \"$*\"}}" > /dev/null
    ;;
    
  status|s)
    STATUS="${2:-working}"
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d "{\"action\": \"status.set\", \"data\": {\"status\": \"$STATUS\"}}" > /dev/null
    ;;
    
  reset)
    curl -s -X POST "$API_URL" \
      -H "Content-Type: application/json" \
      -d '{"action": "state.reset"}' > /dev/null
    ;;
    
  state)
    curl -s "$API_URL" | jq .
    ;;
    
  *)
    echo "Usage: nex-stream <command> [args...]"
    echo ""
    echo "Commands:"
    echo "  terminal, t <line>      Push a terminal line"
    echo "  terminal-clear, tc      Clear terminal"
    echo "  code, c <file> <lang> <content>  Update a code file"
    echo "  think <text>            Set current thinking"
    echo "  thought-clear           Clear current thinking"
    echo "  action, a <text>        Add action thought"
    echo "  insight, i <text>       Add insight thought"  
    echo "  decision, d <text>      Add decision thought"
    echo "  status, s <status>      Set status (working|idle|streaming)"
    echo "  reset                   Reset all state"
    echo "  state                   Get current state"
    ;;
esac
