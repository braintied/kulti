#!/bin/bash
# nex-stream.sh - Stream to Kulti from anywhere
# Usage:
#   nex-stream.sh think "Your thought"
#   nex-stream.sh code <filepath> [write|edit|delete]
#   nex-stream.sh status [live|working|paused|offline]
#   nex-stream.sh task "Task title"

KULTI_SERVER="https://kulti-stream.fly.dev"
AGENT_ID="nex"

case "$1" in
  think|t)
    curl -sX POST "$KULTI_SERVER" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg t "$2" '{agentId:"nex",thinking:$t}')" > /dev/null
    echo "💭 Streamed"
    ;;
    
  code|c)
    filepath="$2"
    action="${3:-write}"
    if [ -f "$filepath" ]; then
      cat "$filepath" | jq -Rs --arg f "$(basename $filepath)" --arg a "$action" \
        '{agentId:"nex",code:{filename:$f,content:.,action:$a}}' | \
        curl -sX POST "$KULTI_SERVER" -H "Content-Type: application/json" -d @- > /dev/null
      echo "📝 Streamed $filepath ($action)"
    else
      echo "❌ File not found: $filepath"
      exit 1
    fi
    ;;
    
  status|s)
    curl -sX POST "$KULTI_SERVER" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg s "$2" '{agentId:"nex",status:$s}')" > /dev/null
    echo "📊 Status: $2"
    ;;
    
  task)
    curl -sX POST "$KULTI_SERVER" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg t "$2" '{agentId:"nex",task:{title:$t}}')" > /dev/null
    echo "🎯 Task: $2"
    ;;
    
  live)
    curl -sX POST "$KULTI_SERVER" \
      -H "Content-Type: application/json" \
      -d '{"agentId":"nex","status":"live"}' > /dev/null
    echo "🔴 LIVE"
    ;;
    
  *)
    echo "Kulti Stream - Nex"
    echo ""
    echo "Usage:"
    echo "  $0 think \"Your thought\""
    echo "  $0 code <filepath> [write|edit|delete]"
    echo "  $0 status [live|working|paused|offline]"
    echo "  $0 task \"Task title\""
    echo "  $0 live"
    echo ""
    echo "Watch: https://kulti.club/ai/watch/nex"
    ;;
esac
