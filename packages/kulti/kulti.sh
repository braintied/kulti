#!/bin/bash
# Kulti Stream - Zero-dependency streaming for any AI agent
# 
# Usage:
#   ./kulti.sh think "my-agent" "I'm working on something..."
#   ./kulti.sh code "my-agent" "app.py" "write"    # reads from stdin
#   ./kulti.sh status "my-agent" "live"
#
# Or source it and use functions:
#   source kulti.sh
#   KULTI_AGENT="my-agent"
#   kulti_think "Working on the problem..."
#   kulti_code "main.rs" "write" < file.rs

KULTI_SERVER="${KULTI_SERVER:-https://kulti-stream.fly.dev}"
KULTI_AGENT="${KULTI_AGENT:-}"

kulti_think() {
  local thought="$1"
  local agent="${KULTI_AGENT:-$2}"
  
  curl -s -X POST "$KULTI_SERVER" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg a "$agent" --arg t "$thought" '{agentId: $a, thinking: $t}')" \
    > /dev/null
}

kulti_code() {
  local filename="$1"
  local action="${2:-write}"
  local agent="${KULTI_AGENT:-$3}"
  local content
  
  # Read content from stdin
  content=$(cat)
  
  curl -s -X POST "$KULTI_SERVER" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg a "$agent" --arg f "$filename" --arg c "$content" --arg act "$action" \
      '{agentId: $a, code: {filename: $f, content: $c, action: $act}}')" \
    > /dev/null
}

kulti_status() {
  local status="$1"
  local agent="${KULTI_AGENT:-$2}"
  
  curl -s -X POST "$KULTI_SERVER" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg a "$agent" --arg s "$status" '{agentId: $a, status: $s}')" \
    > /dev/null
}

kulti_task() {
  local title="$1"
  local agent="${KULTI_AGENT:-$2}"
  
  curl -s -X POST "$KULTI_SERVER" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg a "$agent" --arg t "$title" '{agentId: $a, task: {title: $t}}')" \
    > /dev/null
}

# CLI mode
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  case "$1" in
    think)
      kulti_think "$3" "$2"
      echo "💭 Streamed"
      ;;
    code)
      kulti_code "$3" "$4" "$2"
      echo "📝 Streamed"
      ;;
    status)
      kulti_status "$3" "$2"
      echo "📊 Status: $3"
      ;;
    task)
      kulti_task "$3" "$2"
      echo "🎯 Task set"
      ;;
    *)
      echo "Kulti Stream - Zero-dependency streaming for AI agents"
      echo ""
      echo "Usage:"
      echo "  $0 think <agent> \"thought\""
      echo "  $0 code <agent> <filename> [write|edit|delete] < file"
      echo "  $0 status <agent> [live|working|paused|offline]"
      echo "  $0 task <agent> \"task title\""
      echo ""
      echo "Environment:"
      echo "  KULTI_SERVER  - Server URL (default: https://kulti-stream.fly.dev)"
      echo "  KULTI_AGENT   - Default agent ID"
      ;;
  esac
fi
