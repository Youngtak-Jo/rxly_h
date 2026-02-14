import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { noteCreateSchema } from "@/lib/validations"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const notes = await prisma.note.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "asc" },
    })

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

    let signedUrlResults: { signedUrl: string }[] = []
    if (allPaths.length > 0) {
      const { data } = await supabaseAdmin.storage
        .from("medical-images")
        .createSignedUrls(allPaths, 3600)
      signedUrlResults = data || []
    }

    const notesWithFreshUrls = notes.map((note, i) => {
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

    logAudit({ userId: user.id, action: "READ", resource: "note", sessionId: id })
    return NextResponse.json(notesWithFreshUrls)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch notes:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const raw = await req.json()
    const parsed = noteCreateSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        sessionId: id,
        content: parsed.data.content,
        imageUrls: parsed.data.imageUrls,
        storagePaths: parsed.data.storagePaths,
        source: parsed.data.source,
      },
    })

    logAudit({ userId: user.id, action: "CREATE", resource: "note", resourceId: note.id, sessionId: id })
    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to create note:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}
