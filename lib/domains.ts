import { sql } from "./db"
import { verifyDNSRecords } from "./cloudflare"

export interface DomainVerificationResult {
  verified: boolean
  records: {
    type: string
    name: string
    value: string
    found: boolean
    currentValue?: string
  }[]
  message?: string
}

export async function isDomainAvailable(domain: string): Promise<boolean> {
  const result = await sql`
    SELECT id FROM users WHERE custom_domain = ${domain} AND domain_verified = true
  `
  return result.length === 0
}

export async function getUserByDomain(domain: string): Promise<any | null> {
  const result = await sql`
    SELECT username FROM users WHERE custom_domain = ${domain} AND domain_verified = true
  `

  if (result.length === 0) {
    return null
  }

  return result[0]
}

export async function verifyDomainDNS(domain: string): Promise<DomainVerificationResult> {
  try {
    const expectedCNAME = process.env.NEXT_PUBLIC_APP_DOMAIN || "linkpop.space"

    console.log("[v0] Starting DNS verification for:", domain)

    // Use Cloudflare DNS verification
    const result = await verifyDNSRecords(domain, expectedCNAME)

    console.log("[v0] DNS verification result:", result)

    return result
  } catch (error) {
    console.error("[v0] Domain verification error:", error)
    return {
      verified: false,
      records: [
        {
          type: "CNAME",
          name: domain,
          value: process.env.NEXT_PUBLIC_APP_DOMAIN || "linkpop.space",
          found: false,
        },
      ],
      message: `Verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function updateDomainVerification(userId: string, verified: boolean): Promise<void> {
  await sql`
    UPDATE users
    SET domain_verified = ${verified},
        domain_deployment_status = ${verified ? "dns_verified" : "pending"},
        updated_at = NOW()
    WHERE id = ${userId}
  `

  console.log("[v0] Updated domain verification for user:", userId, "verified:", verified)
}

export async function updateDomainDeploymentStatus(
  userId: string,
  status: "pending" | "dns_verified" | "deploying" | "active" | "failed",
): Promise<void> {
  await sql`
    UPDATE users
    SET domain_deployment_status = ${status},
        updated_at = NOW()
    WHERE id = ${userId}
  `

  console.log("[v0] Updated domain deployment status for user:", userId, "status:", status)
}

export async function checkDomainActive(domain: string): Promise<boolean> {
  try {
    console.log("[v0] Checking if domain is active:", domain)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "manual",
    })

    clearTimeout(timeoutId)

    // Consider 2xx, 3xx, and 404 as "active" (server is responding)
    const isActive = response.status < 500

    console.log("[v0] Domain active check:", domain, "status:", response.status, "isActive:", isActive)
    return isActive
  } catch (error) {
    console.log("[v0] Domain not yet active:", domain, error instanceof Error ? error.message : String(error))
    return false
  }
}

export async function getUserBySubdomain(subdomain: string): Promise<any | null> {
  const result = await sql`
    SELECT username, id FROM users WHERE subdomain = ${subdomain}
  `

  if (result.length === 0) {
    return null
  }

  return result[0]
}

export async function updateUserSubdomain(userId: string, subdomain: string): Promise<void> {
  await sql`
    UPDATE users
    SET subdomain = ${subdomain},
        updated_at = NOW()
    WHERE id = ${userId}
  `
}
