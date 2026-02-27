import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

const eventSchema = z.object({
  eventType: z.enum([
    "tab_switched",
    "recording_started",
    "recording_stopped",
    "note_submitted",
    "image_uploaded",
    "export_clicked",
    "analysis_triggered",
    "analysis_completed",
    "analysis_failed",
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

    await prisma.clientEvent.create({
      data: {
        userId: user.id,
        sessionId: parsed.data.sessionId ?? null,
        eventType: parsed.data.eventType,
        feature: parsed.data.feature,
        metadata: parsed.data.metadata as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to save client event", error)
    return NextResponse.json({ error: "Failed to save event" }, { status: 500 })
  }
}
