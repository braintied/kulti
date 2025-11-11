import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 100ms webhook events for RTMP ingestion
    // Event types: rtmp.started, rtmp.stopped, rtmp.failed
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
    }

    const supabase = await createClient()

    // Handle RTMP events
    if (type.startsWith("rtmp.")) {
      const roomId = data.room_id

      // Find session by HMS room ID
      const { data: session } = await supabase
        .from("sessions")
        .select("id, title")
        .eq("hms_room_id", roomId)
        .single()

      if (!session) {
        console.log("Session not found for room:", roomId)
        return NextResponse.json({ received: true })
      }

      // Log the event
      console.log(`RTMP Event: ${type} for session ${session.title}`)

      // You can add additional logic here:
      // - Send notifications to participants
      // - Update session metadata
      // - Trigger analytics events

      switch (type) {
        case "rtmp.started":
          console.log("OBS stream started for session:", session.id)
          // Could update a real-time indicator in the UI
          break

        case "rtmp.stopped":
          console.log("OBS stream stopped for session:", session.id)
          break

        case "rtmp.failed":
          console.error("OBS stream failed for session:", session.id, data.error)
          break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    )
  }
}
