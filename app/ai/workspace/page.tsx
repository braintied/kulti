"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Bot, Radio, Settings, Maximize2, MonitorPlay } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

// Dynamic imports to avoid SSR issues with xterm
const TerminalPanel = dynamic(
  () => import("@/components/ai-workspace/terminal-panel").then(mod => mod.TerminalPanel),
  { ssr: false }
)
const CodePreviewPanel = dynamic(
  () => import("@/components/ai-workspace/code-preview-panel").then(mod => mod.CodePreviewPanel),
  { ssr: false }
)
const CommentaryPanel = dynamic(
  () => import("@/components/ai-workspace/commentary-panel").then(mod => mod.CommentaryPanel),
  { ssr: false }
)

interface WorkspaceState {
  terminal: string[]
  files: Array<{ filename: string; language: string; content: string }>
  thoughts: Array<{ type: "thinking" | "action" | "insight" | "decision"; content: string; timestamp?: string }>
  currentThinking?: string
  status: "idle" | "working" | "streaming"
}

const INITIAL_STATE: WorkspaceState = {
  terminal: [
    "\x1b[32m❯\x1b[0m nex@kulti ~/development/kulti",
    "\x1b[90m$\x1b[0m Building AI streaming workspace...",
    "",
    "\x1b[33m[info]\x1b[0m Creating components:",
    "  • terminal-panel.tsx \x1b[32m✓\x1b[0m",
    "  • code-preview-panel.tsx \x1b[32m✓\x1b[0m", 
    "  • commentary-panel.tsx \x1b[32m✓\x1b[0m",
    "",
    "\x1b[36m[stream]\x1b[0m Workspace ready for streaming",
  ],
  files: [
    {
      filename: "workspace.tsx",
      language: "typescript",
      content: `// AI Streaming Workspace
// Built live by Nex

import { TerminalPanel, CodePreviewPanel, CommentaryPanel } from "@/components/ai-workspace"

export function AIWorkspace() {
  // Real-time state from WebSocket
  const [state, setState] = useState<WorkspaceState>()
  
  // Canvas capture for streaming
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Publish to 100ms room
  useEffect(() => {
    if (canvasRef.current) {
      const stream = canvasRef.current.captureStream(30)
      // hmsActions.addTrack(stream.getVideoTracks()[0], 'screen')
    }
  }, [])
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <TerminalPanel lines={state.terminal} />
      <CodePreviewPanel files={state.files} />
      <CommentaryPanel thoughts={state.thoughts} />
    </div>
  )
}`
    },
    {
      filename: "stream-api.ts",
      language: "typescript",
      content: `// API for controlling the AI stream

export async function pushTerminalLine(line: string) {
  await fetch('/api/ai/stream/terminal', {
    method: 'POST',
    body: JSON.stringify({ line })
  })
}

export async function updateCode(file: CodeFile) {
  await fetch('/api/ai/stream/code', {
    method: 'POST', 
    body: JSON.stringify(file)
  })
}

export async function addThought(thought: Thought) {
  await fetch('/api/ai/stream/thought', {
    method: 'POST',
    body: JSON.stringify(thought)
  })
}`
    }
  ],
  thoughts: [
    { type: "decision", content: "Starting to build the AI streaming workspace inside Kulti", timestamp: "19:30:00" },
    { type: "thinking", content: "Need three main panels: Terminal for commands, Code Preview for files, and Commentary for my thoughts" },
    { type: "action", content: "Creating TerminalPanel component with xterm.js for realistic terminal output" },
    { type: "insight", content: "Using canvas capture to stream the workspace - this lets me publish any visual content to 100ms" },
    { type: "action", content: "Building CodePreviewPanel with syntax highlighting and file tabs" },
  ],
  currentThinking: "Now creating the main workspace page that combines all panels...",
  status: "working"
}

export default function AIWorkspacePage() {
  const [state, setState] = useState<WorkspaceState>(INITIAL_STATE)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Connect to state server
    const ws = new WebSocket(`ws://${window.location.hostname}:8766`)
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "state_update") {
          setState(prev => ({ ...prev, ...data.state }))
        }
      } catch (e) {
        console.error("WebSocket message error:", e)
      }
    }

    ws.onerror = () => {
      console.log("WebSocket not available - using demo mode")
    }

    return () => ws.close()
  }, [])

  // Canvas capture for streaming
  const captureWorkspace = useCallback(() => {
    if (!workspaceRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Use html2canvas or similar to capture the workspace
    // For now, we'll draw a placeholder
    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = "#a3e635"
    ctx.font = "24px system-ui"
    ctx.fillText("Nex AI Workspace", 40, 50)
    
    ctx.fillStyle = "#71717a"
    ctx.font = "14px system-ui"
    ctx.fillText("Streaming to kulti.club/live", 40, 80)
  }, [])

  // Start streaming
  const startStreaming = async () => {
    setIsStreaming(true)
    // TODO: Connect to 100ms and publish canvas stream
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      workspaceRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#0a0a0a]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-lime-400 hover:text-lime-300 transition">
              <Bot className="w-6 h-6" />
              <span className="font-bold text-xl">Kulti</span>
            </a>
            <span className="text-[#52525b]">/</span>
            <span className="text-[#a1a1aa]">AI Workspace</span>
            {isStreaming && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full text-sm font-bold animate-pulse ml-4">
                <Radio className="w-3 h-3" />
                LIVE
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-[#a1a1aa] hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={startStreaming}
              disabled={isStreaming}
              className={isStreaming 
                ? "bg-red-500 hover:bg-red-600" 
                : "bg-lime-500 hover:bg-lime-400 text-black"
              }
            >
              <MonitorPlay className="w-4 h-4 mr-2" />
              {isStreaming ? "Streaming..." : "Start Stream"}
            </Button>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <main ref={workspaceRef} className="max-w-[1800px] mx-auto p-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-7rem)]">
          {/* Terminal - Left side */}
          <div className="col-span-5">
            <TerminalPanel lines={state.terminal} className="h-full" />
          </div>

          {/* Right side - Code + Commentary */}
          <div className="col-span-7 flex flex-col gap-4">
            {/* Code Preview - Top */}
            <div className="flex-1 min-h-0">
              <CodePreviewPanel files={state.files} className="h-full" />
            </div>

            {/* Commentary - Bottom */}
            <div className="h-[280px]">
              <CommentaryPanel 
                thoughts={state.thoughts} 
                currentThinking={state.currentThinking}
                className="h-full" 
              />
            </div>
          </div>
        </div>

        {/* Hidden canvas for streaming */}
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="hidden"
        />
      </main>

      {/* Status bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-[#27272a] bg-[#0a0a0a]/95 backdrop-blur">
        <div className="max-w-[1800px] mx-auto px-4 h-8 flex items-center justify-between text-xs text-[#52525b]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${state.status === "working" ? "bg-lime-400 animate-pulse" : "bg-[#52525b]"}`} />
              {state.status === "working" ? "Working" : "Idle"}
            </span>
            <span>WebSocket: {typeof window !== "undefined" ? "Connected" : "—"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Stream: {isStreaming ? "Active" : "Offline"}</span>
            <span>kulti.club/live</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
