/**
 * Vercel API Integration for Custom Domain Management
 *
 * This module handles adding custom domains to the Vercel project deployment.
 * When a user verifies their domain DNS, we programmatically add it to Vercel
 * so that Vercel knows to route requests to our app.
 *
 * Required Environment Variables:
 * - VERCEL_API_TOKEN: Your Vercel API token (from vercel.com/account/tokens)
 * - VERCEL_PROJECT_ID: Your project ID (found in project settings)
 * - VERCEL_TEAM_ID: Your team ID (optional, only if using team account)
 */

interface VercelDomainResponse {
  name: string
  verified: boolean
  verification?: {
    type: string
    domain: string
    value: string
    reason: string
  }[]
}

interface VercelErrorResponse {
  error: {
    code: string
    message: string
  }
}

export class VercelAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
  ) {
    super(message)
    this.name = "VercelAPIError"
  }
}

/**
 * Add a custom domain to the Vercel project
 * This makes Vercel aware of the domain and routes traffic accordingly
 */
export async function addDomainToVercel(domain: string): Promise<VercelDomainResponse> {
  const apiToken = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!apiToken) {
    throw new VercelAPIError("VERCEL_API_TOKEN environment variable is not set", "MISSING_TOKEN")
  }

  if (!projectId) {
    throw new VercelAPIError("VERCEL_PROJECT_ID environment variable is not set", "MISSING_PROJECT_ID")
  }

  console.log("[v0] Adding domain to Vercel:", domain)

  // Build the API URL
  const url = teamId
    ? `https://api.vercel.com/v10/projects/${projectId}/domains?teamId=${teamId}`
    : `https://api.vercel.com/v10/projects/${projectId}/domains`

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: domain,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as VercelErrorResponse

      // Handle specific error cases
      if (errorData.error?.code === "domain_already_in_use") {
        console.log("[v0] Domain already added to Vercel project:", domain)
        // Domain is already added, this is actually fine
        // We can proceed as if it was successful
        return { name: domain, verified: true }
      }

      if (errorData.error?.code === "forbidden") {
        throw new VercelAPIError("Invalid Vercel API token or insufficient permissions", "FORBIDDEN", 403)
      }

      if (errorData.error?.code === "not_found") {
        throw new VercelAPIError("Vercel project not found. Check VERCEL_PROJECT_ID", "PROJECT_NOT_FOUND", 404)
      }

      throw new VercelAPIError(
        errorData.error?.message || "Failed to add domain to Vercel",
        errorData.error?.code,
        response.status,
      )
    }

    console.log("[v0] Successfully added domain to Vercel:", domain)
    return data as VercelDomainResponse
  } catch (error) {
    if (error instanceof VercelAPIError) {
      throw error
    }

    console.error("[v0] Vercel API error:", error)
    throw new VercelAPIError(
      `Failed to communicate with Vercel API: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

/**
 * Remove a domain from the Vercel project
 * Useful when user removes their custom domain
 */
export async function removeDomainFromVercel(domain: string): Promise<void> {
  const apiToken = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!apiToken || !projectId) {
    throw new VercelAPIError("Vercel API credentials not configured")
  }

  console.log("[v0] Removing domain from Vercel:", domain)

  const url = teamId
    ? `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}?teamId=${teamId}`
    : `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const data = await response.json()
      throw new VercelAPIError(
        data.error?.message || "Failed to remove domain from Vercel",
        data.error?.code,
        response.status,
      )
    }

    console.log("[v0] Successfully removed domain from Vercel:", domain)
  } catch (error) {
    if (error instanceof VercelAPIError) {
      throw error
    }

    console.error("[v0] Vercel API error:", error)
    throw new VercelAPIError(
      `Failed to communicate with Vercel API: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

/**
 * Check if a domain is already added to the Vercel project
 */
export async function checkDomainInVercel(domain: string): Promise<boolean> {
  const apiToken = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!apiToken || !projectId) {
    return false
  }

  const url = teamId
    ? `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}?teamId=${teamId}`
    : `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error("[v0] Error checking domain in Vercel:", error)
    return false
  }
}
