import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, whatBuilding } = body

    if (!email || !whatBuilding) {
      return NextResponse.json(
        { error: "Email and what you're building are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("waitlist")
      .insert({
        email,
        what_building: whatBuilding
      })
      .select("position")
      .single()

    if (error) {
      if (error.code === '23505') { // Duplicate email
        return NextResponse.json(
          { error: "Email already on waitlist" },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      position: data.position
    })

  } catch (error) {
    console.error("Waitlist error:", error)
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    )
  }
}
