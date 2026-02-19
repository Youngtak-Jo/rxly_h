import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const session = await prisma.session.findUnique({
      where: { id, userId: user.id },
      include: {
        insights: true,
        record: true,
        patientHandout: true,
        checklistItems: { orderBy: { sortOrder: "asc" } },
        diagnoses: { orderBy: { sortOrder: "asc" } },
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const [transcriptEntries, notes, researchMessages] = await Promise.all([
      prisma.transcriptEntry.findMany({
        where: { sessionId: id, isFinal: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.note.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.researchMessage.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: "asc" },
      }),
    ])
    const queryMs = performance.now() - queryStartedAt

    // Batch signed URL generation for all notes
    const allPaths: string[] = []
    const notePathRanges: { start: number; count: number }[] = []

    for (const note of notes) {
      const paths = note.storagePaths as string[]
      if (paths && paths.length > 0) {
        notePathRanges.push({ start: allPaths.length, count: paths.length })
        allPaths.push(...paths)
      } else {
        notePathRanges.push({ start: 0, count: 0 })
      }
    }

    const signedUrlStartedAt = performance.now()
    let signedUrlResults: { signedUrl: string }[] = []
    if (allPaths.length > 0) {
      const { data } = await supabaseAdmin.storage
        .from("medical-images")
        .createSignedUrls(allPaths, 3600)
      signedUrlResults = data || []
    }
    const signedUrlMs = performance.now() - signedUrlStartedAt

    const notesWithUrls = notes.map((note, i) => {
      const range = notePathRanges[i]
      if (range.count === 0) return note
      const freshUrls = signedUrlResults
        .slice(range.start, range.start + range.count)
        .map((r) => r.signedUrl)
        .filter(Boolean)
      return {
        ...note,
        imageUrls: freshUrls.length > 0 ? freshUrls : note.imageUrls,
      }
    })

    const totalMs = performance.now() - requestStartedAt
    logger.info("Session full fetch timing", {
      sessionId: id,
      queryMs: Number(queryMs.toFixed(1)),
      signedUrlMs: Number(signedUrlMs.toFixed(1)),
      totalMs: Number(totalMs.toFixed(1)),
      transcriptCount: transcriptEntries.length,
      noteCount: notes.length,
      researchCount: researchMessages.length,
      handoutExists: !!session.patientHandout,
      signedPathCount: allPaths.length,
    })

    logAudit({ userId: user.id, action: "READ", resource: "session_full", sessionId: id })
    return NextResponse.json({
      session,
      transcriptEntries,
      notes: notesWithUrls,
      researchMessages,
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
