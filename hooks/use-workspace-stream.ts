"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import html2canvas from "html2canvas"

interface UseWorkspaceStreamOptions {
  roomId: string
  authToken: string
  fps?: number
  quality?: number
}

interface StreamState {
  isStreaming: boolean
  isConnected: boolean
  error: string | null
  viewerCount: number
}

export function useWorkspaceStream(
  workspaceRef: React.RefObject<HTMLElement>,
  options: UseWorkspaceStreamOptions
) {
  const { roomId, authToken, fps = 15, quality = 0.8 } = options
  
  const [state, setState] = useState<StreamState>({
    isStreaming: false,
    isConnected: false,
    error: null,
    viewerCount: 0
  })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hmsRef = useRef<any>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1920
    canvas.height = 1080
    canvasRef.current = canvas
    return () => {
      canvasRef.current = null
    }
  }, [])

  // Capture workspace to canvas
  const captureFrame = useCallback(async () => {
    if (!workspaceRef.current || !canvasRef.current) return

    try {
      const canvas = await html2canvas(workspaceRef.current, {
        canvas: canvasRef.current,
        backgroundColor: "#0a0a0a",
        scale: 1,
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      return canvas
    } catch (error) {
      console.error("Capture error:", error)
      return null
    }
  }, [workspaceRef])

  // Start streaming
  const startStream = useCallback(async () => {
    if (!canvasRef.current) {
      setState(s => ({ ...s, error: "Canvas not initialized" }))
      return
    }

    try {
      setState(s => ({ ...s, isStreaming: true, error: null }))

      // Create MediaStream from canvas
      const stream = canvasRef.current.captureStream(fps)
      streamRef.current = stream

      // Start capture loop
      const captureLoop = async () => {
        await captureFrame()
      }
      
      captureIntervalRef.current = setInterval(captureLoop, 1000 / fps)

      // Initialize 100ms connection
      // Note: In production, this would use the 100ms React SDK
      const hmsModule = await import("@100mslive/hms-video-store")
      const hmsStore = new hmsModule.HMSReactiveStore()
      const hmsActions = hmsStore.getHMSActions()
      hmsRef.current = { store: hmsStore, actions: hmsActions }

      // Join room
      await hmsActions.join({
        authToken,
        userName: "Nex AI",
        settings: {
          isAudioMuted: true,
          isVideoMuted: true
        }
      })

      setState(s => ({ ...s, isConnected: true }))

      // Add canvas track
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        await hmsActions.addTrack(videoTrack, "screen")
      }

      console.log("🎬 Workspace stream started")

    } catch (error) {
      console.error("Stream start error:", error)
      setState(s => ({ 
        ...s, 
        isStreaming: false, 
        error: error instanceof Error ? error.message : "Failed to start stream" 
      }))
    }
  }, [authToken, captureFrame, fps])

  // Stop streaming
  const stopStream = useCallback(async () => {
    try {
      // Stop capture loop
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
        captureIntervalRef.current = null
      }

      // Stop media stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Leave 100ms room
      if (hmsRef.current?.actions) {
        await hmsRef.current.actions.leave()
      }

      setState({
        isStreaming: false,
        isConnected: false,
        error: null,
        viewerCount: 0
      })

      console.log("🛑 Workspace stream stopped")

    } catch (error) {
      console.error("Stream stop error:", error)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isStreaming) {
        stopStream()
      }
    }
  }, [state.isStreaming, stopStream])

  return {
    ...state,
    startStream,
    stopStream,
    canvasRef
  }
}
