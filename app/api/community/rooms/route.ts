import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

/**
 * GET /api/community/rooms
 * Get all public community rooms with membership status
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the database function to get rooms with membership info
    const { data: rooms, error } = await supabase.rpc("get_user_rooms", {
      p_user_id: user.id,
    })

    if (error) {
      logger.error("Failed to fetch community rooms", {
        error,
        userId: user.id
      })
      return NextResponse.json(
        { error: "Failed to fetch rooms" },
        { status: 500 }
      )
    }

    return NextResponse.json({ rooms })
  } catch (error) {
    logger.error("Get community rooms failed", { error })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
