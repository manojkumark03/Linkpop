import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { reorderBioLinks } from "@/lib/bio-links"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { linkIds } = await request.json()

    if (!Array.isArray(linkIds)) {
      return NextResponse.json({ error: "linkIds must be an array" }, { status: 400 })
    }

    await reorderBioLinks(user.id, linkIds)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder bio links error:", error)
    return NextResponse.json({ error: "Failed to reorder bio links" }, { status: 500 })
  }
}
