/**
 * Cloudflare DNS and SSL utilities for custom domain management
 *
 * This implementation uses Cloudflare's FREE services:
 * - DNS-over-HTTPS (DoH) for DNS verification
 * - No API key required for DNS lookups
 *
 * For SSL certificates on Vercel:
 * - SSL is automatically handled by Vercel when domain is added
 * - No Cloudflare API needed for SSL management
 * - Vercel provisions Let's Encrypt certificates automatically
 */

import fetch from "node-fetch"

export interface DNSRecord {
  type: string
  name: string
  value: string
  ttl?: number
}

export interface DNSVerificationResult {
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

/**
 * Verify DNS records using Cloudflare's free DNS-over-HTTPS API
 * No API key required - completely free service
 */
export async function verifyDNSRecords(domain: string, expectedCNAME: string): Promise<DNSVerificationResult> {
  try {
    console.log("[v0] Verifying DNS for domain:", domain, "expected CNAME:", expectedCNAME)

    // Use Cloudflare's free DNS-over-HTTPS resolver
    const dnsUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`

    const response = await fetch(dnsUrl, {
      headers: {
        Accept: "application/dns-json",
      },
    })

    if (!response.ok) {
      console.error("[v0] DNS query failed with status:", response.status)
      return {
        verified: false,
        records: [
          {
            type: "CNAME",
            name: domain,
            value: expectedCNAME,
            found: false,
          },
        ],
        message: `DNS lookup failed with status ${response.status}`,
      }
    }

    const data: any = await response.json()
    console.log("[v0] DNS response:", JSON.stringify(data, null, 2))

    let found = false
    let currentValue: string | undefined

    // Check if CNAME record exists and points to our domain
    if (data.Answer && Array.isArray(data.Answer)) {
      for (const answer of data.Answer) {
        if (answer.type === 5) {
          // Type 5 is CNAME
          currentValue = answer.data
          // Remove trailing dot if present (DNS convention)
          const normalizedCurrent = currentValue.endsWith(".") ? currentValue.slice(0, -1) : currentValue
          const normalizedExpected = expectedCNAME.endsWith(".") ? expectedCNAME.slice(0, -1) : expectedCNAME

          console.log("[v0] Found CNAME:", normalizedCurrent, "expected:", normalizedExpected)

          if (normalizedCurrent === normalizedExpected) {
            found = true
            break
          }
        }
      }
    }

    // Also check for A records (in case user used A record instead of CNAME)
    if (!found && data.Answer && Array.isArray(data.Answer)) {
      for (const answer of data.Answer) {
        if (answer.type === 1) {
          // Type 1 is A record
          currentValue = answer.data
          console.log("[v0] Found A record instead of CNAME:", currentValue)
        }
      }
    }

    const records = [
      {
        type: "CNAME",
        name: domain,
        value: expectedCNAME,
        found,
        currentValue,
      },
    ]

    return {
      verified: found,
      records,
      message: found
        ? "DNS records verified successfully"
        : currentValue
          ? `Found DNS record but it points to ${currentValue} instead of ${expectedCNAME}`
          : "No CNAME record found. Please add the CNAME record to your DNS settings.",
    }
  } catch (error) {
    console.error("[v0] DNS verification error:", error)
    return {
      verified: false,
      records: [
        {
          type: "CNAME",
          name: domain,
          value: expectedCNAME,
          found: false,
        },
      ],
      message: `DNS verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Check if domain is properly configured for SSL
 * On Vercel, SSL is automatic once DNS is pointed correctly
 */
export async function checkSSLStatus(domain: string): Promise<{
  active: boolean
  message: string
}> {
  try {
    // Try to fetch from HTTPS endpoint
    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      redirect: "manual",
    })

    return {
      active: true,
      message: "SSL certificate is active",
    }
  } catch (error) {
    console.log("[v0] SSL check failed (expected during setup):", error)
    return {
      active: false,
      message: "SSL certificate provisioning in progress (can take 5-10 minutes after DNS verification)",
    }
  }
}

/**
 * Get detailed DNS information for debugging
 */
export async function getDNSInfo(domain: string): Promise<{
  cnameRecords: any[]
  aRecords: any[]
  txtRecords: any[]
}> {
  const results = {
    cnameRecords: [],
    aRecords: [],
    txtRecords: [],
  }

  try {
    // Check CNAME
    const cnameResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=CNAME`,
      {
        headers: { Accept: "application/dns-json" },
      },
    )
    if (cnameResponse.ok) {
      const data: any = await cnameResponse.json()
      results.cnameRecords = data.Answer || []
    }

    // Check A records
    const aResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
      headers: { Accept: "application/dns-json" },
    })
    if (aResponse.ok) {
      const data: any = await aResponse.json()
      results.aRecords = data.Answer || []
    }

    // Check TXT records (for verification purposes)
    const txtResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`,
      {
        headers: { Accept: "application/dns-json" },
      },
    )
    if (txtResponse.ok) {
      const data: any = await txtResponse.json()
      results.txtRecords = data.Answer || []
    }
  } catch (error) {
    console.error("[v0] Failed to get DNS info:", error)
  }

  return results
}
