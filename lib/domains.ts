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
        updated_at = NOW()
    WHERE id = ${userId}
  `

  console.log("[v0] Updated domain verification for user:", userId, "verified:", verified)
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
