import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getUserInsights } from "@/lib/insights"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const insights = await getUserInsights(user.id, startDate, endDate)

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Get insights error:", error)
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 })
  }
}
