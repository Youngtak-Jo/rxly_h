import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const entries = await prisma.transcriptEntry.findMany({
      where: { sessionId: id, isFinal: true },
      orderBy: { startTime: "asc" },
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error("Failed to fetch transcript:", error)
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

    const entry = await prisma.transcriptEntry.create({
      data: {
        sessionId: id,
        speaker: body.speaker || "UNKNOWN",
        text: body.text,
        startTime: body.startTime,
        endTime: body.endTime,
        confidence: body.confidence || 0,
        isFinal: true,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Failed to save transcript entry:", error)
    return NextResponse.json(
      { error: "Failed to save transcript entry" },
      { status: 500 }
    )
  }
}
