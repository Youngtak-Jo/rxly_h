import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export interface AuthUser {
  id: string
  email?: string
  role?: string
}

/**
 * Authenticate the request using Supabase server-side auth.
 * Returns the user or throws a NextResponse with 401.
 */
export async function requireAuth(): Promise<AuthUser> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role =
    typeof user.app_metadata?.role === "string"
      ? user.app_metadata.role
      : undefined

  return { id: user.id, email: user.email ?? undefined, role }
}

/**
 * Authenticate and require admin role from Supabase app_metadata.role.
 * Throws 401/403 JSON NextResponse when denied.
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== "admin") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return user
}

/**
 * Verify user owns the session. Returns the session id or throws 404.
 */
export async function requireSessionOwnership(
  sessionId: string,
  userId: string
): Promise<{ id: string }> {
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  })

  if (!session) {
    throw NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return session
}
