import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@supabase/supabase-js"

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
    const notes = await prisma.note.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: "asc" },
    })

    // Generate fresh signed URLs for any notes with storage paths
    const notesWithFreshUrls = await Promise.all(
      notes.map(async (note) => {
        const paths = note.storagePaths as string[]
        if (!paths || paths.length === 0) return note

        const freshUrls: string[] = []
        for (const path of paths) {
          const { data } = await supabaseAdmin.storage
            .from("medical-images")
            .createSignedUrl(path, 3600)
          if (data?.signedUrl) {
            freshUrls.push(data.signedUrl)
          }
        }

        return { ...note, imageUrls: freshUrls.length > 0 ? freshUrls : note.imageUrls }
      })
    )

    return NextResponse.json(notesWithFreshUrls)
  } catch (error) {
    console.error("Failed to fetch notes:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json()

    const note = await prisma.note.create({
      data: {
        sessionId: id,
        content: body.content || "",
        imageUrls: body.imageUrls || [],
        storagePaths: body.storagePaths || [],
        source: body.source || "MANUAL",
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Failed to create note:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}
