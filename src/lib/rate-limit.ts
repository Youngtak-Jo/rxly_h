import { NextResponse } from "next/server"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  ai: { windowMs: 60_000, maxRequests: 30 },
  data: { windowMs: 60_000, maxRequests: 60 },
  upload: { windowMs: 60_000, maxRequests: 10 },
  token: { windowMs: 60_000, maxRequests: 5 },
}

// In-memory store: userId -> { count, resetAt }
const store = new Map<string, { count: number; resetAt: number }>()

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store) {
    if (value.resetAt < now) {
      store.delete(key)
    }
  }
}, 60_000)

export function checkRateLimit(
  userId: string,
  category: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const config = RATE_LIMITS[category]
  if (!config) return { allowed: true, remaining: Infinity, retryAfterMs: 0 }

  const key = `${userId}:${category}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterMs: 0 }
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: config.maxRequests - entry.count, retryAfterMs: 0 }
}

export function rateLimitResponse(retryAfterMs?: number): NextResponse {
  const retryAfterSec = retryAfterMs ? Math.ceil(retryAfterMs / 1000) : 60
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Remaining": "0",
      },
    }
  )
}
