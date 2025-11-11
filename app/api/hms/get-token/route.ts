import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateHMSToken } from "@/lib/hms/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { roomId, sessionId } = body

    if (!roomId || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get session and participant info
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Get or create participant
    const { data: participant } = await supabase
      .from("session_participants")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", user.id)
      .single()

    let role: "host" | "presenter" | "viewer" = "viewer"

    if (session.host_id === user.id) {
      role = "host"
    } else if (participant?.role === "presenter") {
      role = "presenter"
    }

    // If not already a participant, add them
    if (!participant) {
      await supabase.from("session_participants").insert({
        session_id: sessionId,
        user_id: user.id,
        role: role,
      })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single()

    // Generate HMS token
    const token = generateHMSToken(roomId, user.id, role)

    return NextResponse.json({
      token,
      userName: profile?.display_name || "User",
      role,
    })
  } catch (error) {
    console.error("Token generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    )
  }
}
