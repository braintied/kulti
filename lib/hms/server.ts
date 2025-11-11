import jwt from "jsonwebtoken"

const HMS_APP_ACCESS_KEY = process.env.HMS_APP_ACCESS_KEY!
const HMS_APP_SECRET = process.env.HMS_APP_SECRET!

export async function createHMSRoom(name: string, description?: string) {
  try {
    const response = await fetch("https://api.100ms.live/v2/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${HMS_APP_ACCESS_KEY}:${HMS_APP_SECRET}`,
      },
      body: JSON.stringify({
        name,
        description: description || "",
        recording_info: {
          enabled: false,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("HMS create room error:", error)
      throw new Error("Failed to create HMS room")
    }

    const data = await response.json()
    return data.id
  } catch (error) {
    console.error("Error creating HMS room:", error)
    throw error
  }
}

export function generateHMSToken(
  roomId: string,
  userId: string,
  role: "host" | "presenter" | "viewer" = "viewer"
) {
  const payload = {
    access_key: HMS_APP_ACCESS_KEY,
    room_id: roomId,
    user_id: userId,
    role: role,
    type: "app",
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
  }

  const token = jwt.sign(payload, HMS_APP_SECRET, {
    algorithm: "HS256",
    expiresIn: "24h",
    jwtid: `${userId}-${Date.now()}`,
  })

  return token
}

export async function endHMSRoom(roomId: string) {
  try {
    const response = await fetch(
      `https://api.100ms.live/v2/rooms/${roomId}/end`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HMS_APP_ACCESS_KEY}:${HMS_APP_SECRET}`,
        },
        body: JSON.stringify({
          lock: true,
          reason: "Session ended by host",
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to end HMS room")
    }

    return true
  } catch (error) {
    console.error("Error ending HMS room:", error)
    throw error
  }
}

// RTMP Ingestion - allows OBS to stream into 100ms rooms
export async function createStreamKey(roomId: string) {
  try {
    const response = await fetch(
      `https://api.100ms.live/v2/stream-key/room/${roomId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HMS_APP_ACCESS_KEY}:${HMS_APP_SECRET}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("HMS create stream key error:", error)
      throw new Error("Failed to create stream key")
    }

    const data = await response.json()
    return {
      id: data.id,
      streamKey: data.key,
      rtmpUrl: data.rtmp_ingest_url || "rtmp://ingest.100ms.live/live",
    }
  } catch (error) {
    console.error("Error creating stream key:", error)
    throw error
  }
}

export async function getStreamKey(roomId: string) {
  try {
    const response = await fetch(
      `https://api.100ms.live/v2/stream-key/room/${roomId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HMS_APP_ACCESS_KEY}:${HMS_APP_SECRET}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const error = await response.text()
      console.error("HMS get stream key error:", error)
      throw new Error("Failed to get stream key")
    }

    const data = await response.json()
    return {
      id: data.id,
      streamKey: data.key,
      rtmpUrl: data.rtmp_ingest_url || "rtmp://ingest.100ms.live/live",
      active: data.enabled,
    }
  } catch (error) {
    console.error("Error getting stream key:", error)
    throw error
  }
}

export async function disableStreamKey(streamKeyId: string) {
  try {
    const response = await fetch(
      `https://api.100ms.live/v2/stream-key/${streamKeyId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HMS_APP_ACCESS_KEY}:${HMS_APP_SECRET}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to disable stream key")
    }

    return true
  } catch (error) {
    console.error("Error disabling stream key:", error)
    throw error
  }
}
