"use client"

import { useState } from "react"
import {
  useHMSActions,
  useHMSStore,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectIsLocalScreenShared,
} from "@100mslive/react-sdk"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff } from "lucide-react"

interface ControlsProps {
  sessionId: string
  isHost: boolean
}

export function Controls({ sessionId, isHost }: ControlsProps) {
  const hmsActions = useHMSActions()
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled)
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled)
  const isLocalScreenShared = useHMSStore(selectIsLocalScreenShared)

  const toggleAudio = async () => {
    await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled)
  }

  const toggleVideo = async () => {
    await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled)
  }

  const toggleScreenShare = async () => {
    if (isLocalScreenShared) {
      await hmsActions.setScreenShareEnabled(false)
    } else {
      await hmsActions.setScreenShareEnabled(true)
    }
  }

  return (
    <div className="flex items-center justify-center gap-3 p-4">
      {/* Microphone */}
      <Button
        variant={isLocalAudioEnabled ? "secondary" : "ghost"}
        size="lg"
        onClick={toggleAudio}
        className={!isLocalAudioEnabled ? "text-red-500 hover:text-red-400" : ""}
      >
        {isLocalAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
      </Button>

      {/* Camera */}
      <Button
        variant={isLocalVideoEnabled ? "secondary" : "ghost"}
        size="lg"
        onClick={toggleVideo}
        className={!isLocalVideoEnabled ? "text-red-500 hover:text-red-400" : ""}
      >
        {isLocalVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
      </Button>

      {/* Screen Share (only for host/presenter) */}
      {isHost && (
        <Button
          variant={isLocalScreenShared ? "primary" : "secondary"}
          size="lg"
          onClick={toggleScreenShare}
        >
          {isLocalScreenShared ? (
            <MonitorOff size={20} />
          ) : (
            <Monitor size={20} />
          )}
        </Button>
      )}
    </div>
  )
}
