"use client"

import {
  useHMSStore,
  selectPeers,
  selectLocalPeer,
  selectPeerScreenSharing,
} from "@100mslive/react-sdk"
import { VideoTile } from "./video-tile"

export function VideoGrid() {
  const peers = useHMSStore(selectPeers)
  const localPeer = useHMSStore(selectLocalPeer)
  const peerScreenSharing = useHMSStore(selectPeerScreenSharing)

  if (peerScreenSharing) {
    // Screen share layout
    return (
      <div className="h-full flex gap-4">
        {/* Main screen share */}
        <div className="flex-1 bg-surfaceElevated rounded-lg overflow-hidden">
          <VideoTile peer={peerScreenSharing} isScreenShare />
        </div>

        {/* Participant strip */}
        <div className="w-64 space-y-3 overflow-y-auto">
          {peers.map((peer) => (
            <div key={peer.id} className="aspect-video">
              <VideoTile peer={peer} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Regular grid layout
  const gridCols =
    peers.length === 1
      ? "grid-cols-1"
      : peers.length === 2
      ? "grid-cols-2"
      : peers.length <= 4
      ? "grid-cols-2"
      : "grid-cols-3"

  return (
    <div className={`h-full grid ${gridCols} gap-4 content-center`}>
      {peers.map((peer) => (
        <div key={peer.id} className="aspect-video">
          <VideoTile peer={peer} isLocal={peer.id === localPeer?.id} />
        </div>
      ))}
    </div>
  )
}
