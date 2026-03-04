import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import {
  getRecordingExtension,
  normalizeRecordingMimeType,
} from "@/lib/audio-recordings"
import { prisma } from "@/lib/prisma"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

function isValidDate(value: string | null): value is string {
  return !!value && !Number.isNaN(new Date(value).getTime())
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "upload")
    if (!allowed) return rateLimitResponse()

    const formData = await req.formData()
    const file = formData.get("file")
    const segmentId = formData.get("id")
    const startedAt = formData.get("startedAt")
    const endedAt = formData.get("endedAt")
    const durationMsValue = formData.get("durationMs")
    const startedAtValue = typeof startedAt === "string" ? startedAt : null
    const endedAtValue = typeof endedAt === "string" ? endedAt : null

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No recording file provided" }, { status: 400 })
    }

    if (typeof segmentId !== "string" || !segmentId.trim()) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    if (!isValidDate(startedAtValue)) {
      return NextResponse.json({ error: "startedAt is required" }, { status: 400 })
    }

    if (!isValidDate(endedAtValue)) {
      return NextResponse.json({ error: "endedAt is required" }, { status: 400 })
    }

    const durationMs = Number(durationMsValue)
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return NextResponse.json({ error: "durationMs must be a positive number" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Recording must be under 50MB" }, { status: 400 })
    }

    const normalizedMimeType = normalizeRecordingMimeType(file.type)
    const ext = getRecordingExtension(normalizedMimeType)
    if (!ext) {
      return NextResponse.json({ error: "Unsupported audio format" }, { status: 400 })
    }

    const storagePath = `${id}/${segmentId}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from("medical-recordings")
      .upload(storagePath, buffer, {
        contentType: normalizedMimeType,
        upsert: false,
      })

    if (uploadError) {
      logger.error("Supabase recording upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload recording" },
        { status: 500 }
      )
    }

    const segment = await prisma.recordingSegment.create({
      data: {
        id: segmentId,
        sessionId: id,
        storagePath,
        mimeType: normalizedMimeType,
        fileSizeBytes: file.size,
        durationMs: Math.round(durationMs),
        startedAt: new Date(startedAtValue),
        endedAt: new Date(endedAtValue),
      },
    })

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "recording",
      resourceId: segment.id,
      sessionId: id,
      metadata: { storagePath },
    })

    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from("medical-recordings")
        .createSignedUrl(storagePath, 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      logger.error("Recording signed URL error:", signedUrlError)
      return NextResponse.json({
        ...segment,
        audioUrl: null,
      })
    }

    return NextResponse.json({
      ...segment,
      audioUrl: signedUrlData.signedUrl,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to create recording segment:", error)
    return NextResponse.json(
      { error: "Failed to create recording segment" },
      { status: 500 }
    )
  }
}
