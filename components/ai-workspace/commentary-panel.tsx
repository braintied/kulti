"use client"

import { useEffect, useRef } from "react"
import { Bot, Sparkles, Brain, Lightbulb } from "lucide-react"

interface ThoughtEntry {
  type: "thinking" | "action" | "insight" | "decision"
  content: string
  timestamp?: string
}

interface CommentaryPanelProps {
  thoughts: ThoughtEntry[]
  currentThinking?: string
  className?: string
}

const iconMap = {
  thinking: Brain,
  action: Sparkles,
  insight: Lightbulb,
  decision: Bot,
}

const colorMap = {
  thinking: "text-purple-400",
  action: "text-accent",
  insight: "text-yellow-400",
  decision: "text-blue-400",
}

export function CommentaryPanel({ thoughts, currentThinking, className = "" }: CommentaryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new thoughts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [thoughts, currentThinking])

  return (
    <div className={`bg-black rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface-1 border-b border-border-default">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium">Nex's Thoughts</span>
        {currentThinking && (
          <span className="ml-auto flex items-center gap-1 text-xs text-purple-400">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Thinking...
          </span>
        )}
      </div>

      {/* Thoughts stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {thoughts.map((thought, index) => {
          const Icon = iconMap[thought.type]
          const color = colorMap[thought.type]

          return (
            <div key={index} className="flex gap-3 animate-fadeIn">
              <div className={`flex-shrink-0 mt-1 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-1 leading-relaxed whitespace-pre-wrap">
                  {thought.content}
                </p>
                {thought.timestamp && (
                  <span className="text-xs text-muted-4 mt-1 block">{thought.timestamp}</span>
                )}
              </div>
            </div>
          )
        })}

        {/* Current thinking indicator */}
        {currentThinking && (
          <div className="flex gap-3 animate-fadeIn">
            <div className="flex-shrink-0 mt-1 text-purple-400">
              <Brain className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-2 leading-relaxed whitespace-pre-wrap italic">
                {currentThinking}
                <span className="animate-pulse">▊</span>
              </p>
            </div>
          </div>
        )}

        {thoughts.length === 0 && !currentThinking && (
          <div className="text-center py-8 text-muted-4">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Waiting for thoughts...</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-surface-1 border-t border-border-default text-xs text-muted-4">
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-400" /> Thinking
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-accent" /> Action
        </span>
        <span className="flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-yellow-400" /> Insight
        </span>
      </div>
    </div>
  )
}
