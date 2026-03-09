import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { mapSessionDocumentRecord } from "@/lib/documents/server"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toStringArray(value: unknown): string[] {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : []
    } catch {
      return []
    }
  }
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function collectSignedPathRanges<T extends { storagePaths: unknown }>(items: T[]) {
  const allPaths: string[] = []
  const ranges = items.map((item) => {
    const paths = toStringArray(item.storagePaths)
    const range = { start: allPaths.length, count: paths.length }
    allPaths.push(...paths)
    return range
  })

  return { allPaths, ranges }
}

function applySignedUrls<T extends { imageUrls: unknown }>(
  items: T[],
  ranges: Array<{ start: number; count: number }>,
  signedUrlResults: Array<{ signedUrl?: string }>
) {
  return items.map((item, index) => {
    const range = ranges[index]
    if (!range || range.count === 0) return item

    const freshUrls = signedUrlResults
      .slice(range.start, range.start + range.count)
      .map((result) => result.signedUrl)
      .filter((url): url is string => !!url)

    return {
      ...item,
      imageUrls: freshUrls.length > 0 ? freshUrls : toStringArray(item.imageUrls),
    }
  })
}

function applySignedAudioUrls<T extends { storagePath: string }>(
  items: T[],
  signedUrlResults: Array<{ signedUrl?: string }>
) {
  return items.map((item, index) => ({
    ...item,
    audioUrl: signedUrlResults[index]?.signedUrl || null,
  }))
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const requestStartedAt = performance.now()
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const queryStartedAt = performance.now()
    const [session, transcriptEntries, notes, researchMessages, recordingSegments] =
      await Promise.all([
        prisma.session.findUnique({
          where: { id, userId: user.id },
          include: {
            insights: true,
            record: true,
            patientHandout: true,
            sessionDocuments: {
              include: {
                templateVersion: true,
              },
              orderBy: { updatedAt: "desc" },
            },
            checklistItems: { orderBy: { sortOrder: "asc" } },
            diagnoses: { orderBy: { sortOrder: "asc" } },
          },
        }),
        prisma.transcriptEntry.findMany({
          where: { sessionId: id, isFinal: true },
          orderBy: [{ createdAt: "asc" }, { startTime: "asc" }],
        }),
        prisma.note.findMany({
          where: { sessionId: id },
          orderBy: { createdAt: "asc" },
        }),
        prisma.researchMessage.findMany({
          where: { sessionId: id },
          orderBy: { createdAt: "asc" },
        }),
        prisma.recordingSegment.findMany({
          where: { sessionId: id },
          orderBy: { startedAt: "desc" },
        }),
      ])
    const queryMs = performance.now() - queryStartedAt

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { allPaths: notePaths, ranges: notePathRanges } =
      collectSignedPathRanges(notes)
    const { allPaths: researchPaths, ranges: researchPathRanges } =
      collectSignedPathRanges(researchMessages)
    const recordingPaths = recordingSegments.map((segment) => segment.storagePath)
    const allPaths = [...notePaths, ...researchPaths]

    const signedUrlStartedAt = performance.now()
    const [signedUrlResults, recordingSignedUrlResults] = await Promise.all([
      allPaths.length > 0
        ? supabaseAdmin.storage.from("medical-images").createSignedUrls(allPaths, 3600).then((r) => r.data || [])
        : Promise.resolve([] as { signedUrl: string }[]),
      recordingPaths.length > 0
        ? supabaseAdmin.storage.from("medical-recordings").createSignedUrls(recordingPaths, 3600).then((r) => r.data || [])
        : Promise.resolve([] as { signedUrl?: string }[]),
    ])
    const signedUrlMs = performance.now() - signedUrlStartedAt

    const notesWithUrls = applySignedUrls(notes, notePathRanges, signedUrlResults)
    const researchMessagesWithUrls = applySignedUrls(
      researchMessages,
      researchPathRanges.map((range) => ({
        start: range.start + notePaths.length,
        count: range.count,
      })),
      signedUrlResults
    )
    const recordingSegmentsWithUrls = applySignedAudioUrls(
      recordingSegments,
      recordingSignedUrlResults
    )

    const totalMs = performance.now() - requestStartedAt
    logger.info("Session full fetch timing", {
      sessionId: id,
      queryMs: Number(queryMs.toFixed(1)),
      signedUrlMs: Number(signedUrlMs.toFixed(1)),
      totalMs: Number(totalMs.toFixed(1)),
      transcriptCount: transcriptEntries.length,
      noteCount: notes.length,
      researchCount: researchMessages.length,
      recordingCount: recordingSegments.length,
      handoutExists: !!session.patientHandout,
      signedPathCount: allPaths.length,
      recordingPathCount: recordingPaths.length,
    })

    logAudit({ userId: user.id, action: "READ", resource: "session_full", sessionId: id })
    return NextResponse.json({
      session: {
        ...session,
        sessionDocuments: session.sessionDocuments.map(mapSessionDocumentRecord),
      },
      transcriptEntries,
      notes: notesWithUrls,
      researchMessages: researchMessagesWithUrls,
      recordingSegments: recordingSegmentsWithUrls,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch full session:", error)
    return NextResponse.json(
      { error: "Failed to fetch full session" },
      { status: 500 }
    )
  }
}
