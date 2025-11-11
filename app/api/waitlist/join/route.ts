import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, twitter_handle, reason } = body

    // Validate input
    if (!email || !name || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id, position")
      .eq("email", email)
      .single()

    if (existing) {
      return NextResponse.json(
        {
          error: "Email already on waitlist",
          position: existing.position
        },
        { status: 400 }
      )
    }

    // Insert into waitlist
    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        email,
        name,
        twitter_handle: twitter_handle || null,
        reason,
      })
      .select("position")
      .single()

    if (error) {
      console.error("Waitlist insert error:", error)
      return NextResponse.json(
        { error: "Failed to join waitlist" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      position: data.position,
    })
  } catch (error) {
    console.error("Waitlist join error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
