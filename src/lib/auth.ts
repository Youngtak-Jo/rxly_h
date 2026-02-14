import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export interface AuthUser {
  id: string
  email?: string
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

  return { id: user.id, email: user.email ?? undefined }
}

/**
 * Verify user owns the session. Returns the session id or throws 404.
 */
export async function requireSessionOwnership(
  sessionId: string,
  userId: string
): Promise<{ id: string }> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId, userId },
    select: { id: true },
  })

  if (!session) {
    throw NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return session
}
