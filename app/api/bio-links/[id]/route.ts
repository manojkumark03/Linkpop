import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { updateBioLink, deleteBioLink } from "@/lib/bio-links"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { title, url, icon, isVisible, block_data } = await request.json()

    console.log("[v0] Updating bio link with block_data:", block_data)

    // Validate URL if provided and not empty
    if (url && url.trim() !== "") {
      try {
        new URL(url)
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
      }
    }

    const link = await updateBioLink(id, user.id, title, url, icon, isVisible, block_data)

    console.log("[v0] Updated bio link:", link)

    return NextResponse.json({ link })
  } catch (error) {
    console.error("Update bio link error:", error)
    return NextResponse.json({ error: "Failed to update bio link" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await deleteBioLink(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete bio link error:", error)
    return NextResponse.json({ error: "Failed to delete bio link" }, { status: 500 })
  }
}
