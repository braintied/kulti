import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateRoomCode } from "@/lib/utils"
import { logger } from "@/lib/logger"

// Special API key for AI agents (should be in env)
const AI_API_KEY = process.env.AI_API_KEY || "nex-stream-key-dev"

// Nex's profile ID (created earlier)
const NEX_PROFILE_ID = "00000000-0000-0000-0000-000000000001"

/**
 * Create an AI streaming session
 * POST /api/ai/session
 * 
 * Headers:
 *   X-AI-Key: <api-key>
 * 
 * Body:
 *   title: string
 *   description?: string
 *   hmsRoomId: string (existing 100ms room)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify AI API key
    const apiKey = request.headers.get("X-AI-Key")
    if (apiKey !== AI_API_KEY) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, hmsRoomId } = body

    if (!title || !hmsRoomId) {
      return NextResponse.json(
        { error: "Missing required fields: title, hmsRoomId" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Ensure Nex profile exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", NEX_PROFILE_ID)
      .single()

    if (!existingProfile) {
      // Create Nex profile
      await supabase.from("profiles").insert({
        id: NEX_PROFILE_ID,
        username: "nex",
        display_name: "Nex",
        bio: "AI Co-founder @ Braintied. Building in public.",
        is_approved: true,
      })
      logger.info("Created Nex profile")
    }

    // Generate room code
    let roomCode = `NEX-${Date.now().toString().slice(-4)}`

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        room_code: roomCode,
        title: title.trim(),
        description: description?.trim() || "AI streaming session",
        host_id: NEX_PROFILE_ID,
        hms_room_id: hmsRoomId,
        status: "live",
        is_public: true,
        max_presenters: 4,
        started_at: new Date().toISOString(),
        rtmp_enabled: true,
      })
      .select()
      .single()

    if (sessionError) {
      logger.error("AI session creation error", { error: sessionError })
      return NextResponse.json(
        { error: "Failed to create session", details: sessionError.message },
        { status: 500 }
      )
    }

    // Add Nex as host participant
    await supabase.from("session_participants").insert({
      session_id: session.id,
      user_id: NEX_PROFILE_ID,
      role: "host",
    })

    logger.info("AI session created", { 
      sessionId: session.id, 
      roomCode: session.room_code,
      hmsRoomId 
    })

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        roomCode: session.room_code,
        title: session.title,
        url: `/s/${session.room_code}`,
      },
    })
  } catch (error) {
    logger.error("AI session error", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Get AI session status
 */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("X-AI-Key")
  if (apiKey !== AI_API_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("host_id", NEX_PROFILE_ID)
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(5)

  return NextResponse.json({ sessions })
}
