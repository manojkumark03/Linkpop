import { NextResponse } from "next/server"
import { sql, queryWithTimeout } from "@/lib/db"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  checks: {
    database: {
      status: "up" | "down" | "slow"
      latency?: number
      error?: string
    }
    api: {
      status: "up"
      uptime: number
    }
  }
  version?: string
}

export async function GET() {
  const startTime = Date.now()
  const checks: HealthStatus["checks"] = {
    database: { status: "down" },
    api: {
      status: "up",
      uptime: process.uptime(),
    },
  }

  // Check database connectivity
  const dbStartTime = Date.now()
  try {
    await queryWithTimeout(async () => {
      return await sql`SELECT 1 as health_check`
    }, 3000)

    const latency = Date.now() - dbStartTime
    checks.database = {
      status: latency > 1000 ? "slow" : "up",
      latency,
    }
  } catch (error) {
    checks.database = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }

  // Determine overall status
  let status: HealthStatus["status"] = "healthy"
  if (checks.database.status === "down") {
    status = "unhealthy"
  } else if (checks.database.status === "slow") {
    status = "degraded"
  }

  const responseTime = Date.now() - startTime
  const healthStatus: HealthStatus = {
    status,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version,
  }

  const httpStatus = status === "healthy" ? 200 : status === "degraded" ? 200 : 503

  return NextResponse.json(healthStatus, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Response-Time": `${responseTime}ms`,
    },
  })
}
