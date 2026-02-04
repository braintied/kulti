import { NextRequest, NextResponse } from "next/server"

// In-memory state store (for demo - would use Redis in production)
let workspaceState = {
  terminal: [] as string[],
  files: [] as Array<{ filename: string; language: string; content: string }>,
  thoughts: [] as Array<{ type: string; content: string; timestamp?: string }>,
  currentThinking: "",
  status: "idle" as "idle" | "working" | "streaming"
}

// Subscribers for real-time updates
const subscribers = new Set<(state: typeof workspaceState) => void>()

export async function GET() {
  return NextResponse.json(workspaceState)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "terminal.push":
        workspaceState.terminal.push(data.line)
        // Keep last 100 lines
        if (workspaceState.terminal.length > 100) {
          workspaceState.terminal = workspaceState.terminal.slice(-100)
        }
        break

      case "terminal.clear":
        workspaceState.terminal = []
        break

      case "code.update":
        const fileIndex = workspaceState.files.findIndex(f => f.filename === data.filename)
        if (fileIndex >= 0) {
          workspaceState.files[fileIndex] = data
        } else {
          workspaceState.files.push(data)
        }
        break

      case "thought.add":
        workspaceState.thoughts.push({
          ...data,
          timestamp: new Date().toLocaleTimeString()
        })
        // Keep last 50 thoughts
        if (workspaceState.thoughts.length > 50) {
          workspaceState.thoughts = workspaceState.thoughts.slice(-50)
        }
        break

      case "thinking.set":
        workspaceState.currentThinking = data.content
        break

      case "thinking.clear":
        workspaceState.currentThinking = ""
        break

      case "status.set":
        workspaceState.status = data.status
        break

      case "state.reset":
        workspaceState = {
          terminal: [],
          files: [],
          thoughts: [],
          currentThinking: "",
          status: "idle"
        }
        break

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    // Notify subscribers (for WebSocket broadcast)
    subscribers.forEach(callback => callback(workspaceState))

    return NextResponse.json({ success: true, state: workspaceState })
  } catch (error) {
    console.error("Stream state error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Export for WebSocket server to subscribe
export { subscribers, workspaceState }
