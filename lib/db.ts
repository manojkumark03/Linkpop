import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL, {
  fetchOptions: {
    // Prevent aggressive caching on serverless functions
    cache: "no-store",
  },
  // Set reasonable timeout to prevent hanging connections
  fullResults: false,
})

export async function queryWithTimeout<T>(queryFn: () => Promise<T>, timeoutMs = 5000, retries = 2): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Database query timeout")), timeoutMs)
      })

      const result = await Promise.race([queryFn(), timeoutPromise])
      return result
    } catch (error) {
      lastError = error as Error
      console.error(`[v0] Database query attempt ${attempt + 1} failed:`, error)

      // Don't retry on the last attempt
      if (attempt < retries) {
        // Exponential backoff: 100ms, 200ms
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error("Database query failed after retries")
}
