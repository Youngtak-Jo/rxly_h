import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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
    return NextResponse.json(notes)
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
