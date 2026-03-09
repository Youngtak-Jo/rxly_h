import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

const eventSchema = z.object({
  eventType: z.enum([
    "workspace_opened",
    "tab_switched",
    "recording_started",
    "recording_stopped",
    "note_submitted",
    "image_uploaded",
    "export_clicked",
    "analysis_triggered",
    "analysis_completed",
    "analysis_failed",
    "document_feedback_submitted",
  ]),
  feature: z.string().min(1).max(64),
  sessionId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const body = await req.json()
    const parsed = eventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event payload" }, { status: 400 })
    }

    const baseData = {
      userId: user.id,
      sessionId: parsed.data.sessionId ?? null,
      eventType: parsed.data.eventType,
      feature: parsed.data.feature,
      metadata: parsed.data.metadata as Prisma.InputJsonValue,
    }

    try {
      await prisma.clientEvent.create({
        data: baseData,
      })
    } catch (error) {
      const isMissingSessionForeignKey =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003" &&
        parsed.data.sessionId

      if (!isMissingSessionForeignKey) {
        throw error
      }

      logger.warn("Client event arrived before session persisted; storing without session id", {
        userId: user.id,
        sessionId: parsed.data.sessionId,
        eventType: parsed.data.eventType,
        feature: parsed.data.feature,
      })

      await prisma.clientEvent.create({
        data: {
          ...baseData,
          sessionId: null,
          metadata: {
            ...(parsed.data.metadata ?? {}),
            droppedSessionId: parsed.data.sessionId,
            sessionIdFallbackReason: "session_not_persisted",
          } as Prisma.InputJsonValue,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to save client event", error)
    return NextResponse.json({ error: "Failed to save event" }, { status: 500 })
  }
}
