import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { deleteShortenedUrl, isShortCodeAvailable } from "@/lib/url-shortener"
import { sql } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await deleteShortenedUrl(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete URL error:", error)
    return NextResponse.json({ error: "Failed to delete URL" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, shortCode, originalUrl } = body

    // Verify ownership
    const urlCheck = await sql`
      SELECT * FROM shortened_urls WHERE id = ${id} AND user_id = ${user.id}
    `

    if (urlCheck.length === 0) {
      return NextResponse.json({ error: "URL not found or unauthorized" }, { status: 404 })
    }

    const existingUrl = urlCheck[0]

    // Validate shortCode if it's being changed
    if (shortCode && shortCode !== existingUrl.short_code) {
      const available = await isShortCodeAvailable(shortCode)
      if (!available) {
        return NextResponse.json({ error: "Short code already in use or reserved" }, { status: 400 })
      }
    }

    // Update the URL
    const result = await sql`
      UPDATE shortened_urls
      SET 
        title = ${title || null},
        short_code = ${shortCode || existingUrl.short_code},
        original_url = ${originalUrl || existingUrl.original_url},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json({ url: result[0] })
  } catch (error) {
    console.error("Update URL error:", error)
    return NextResponse.json({ error: "Failed to update URL" }, { status: 500 })
  }
}
