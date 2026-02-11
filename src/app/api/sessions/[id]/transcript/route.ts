import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Speaker } from "@prisma/client"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { updates } = await req.json() as {
      updates: { id: string; speaker: Speaker }[]
    }

    if (!updates?.length) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    // Batch update transcript entries by grouping by speaker
    const byRole = updates.reduce(
      (acc, u) => {
        if (!acc[u.speaker]) acc[u.speaker] = []
        acc[u.speaker].push(u.id)
        return acc
      },
      {} as Record<string, string[]>
    )

    await Promise.all(
      Object.entries(byRole).map(([speaker, ids]) =>
        prisma.transcriptEntry.updateMany({
          where: { id: { in: ids }, sessionId: id },
          data: { speaker: speaker as Speaker },
        })
      )
    )

    return NextResponse.json({ updated: updates.length })
  } catch (error) {
    console.error("Failed to update transcript speakers:", error)
    return NextResponse.json(
      { error: "Failed to update speakers" },
      { status: 500 }
    )
  }
}

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
        ...(body.id ? { id: body.id } : {}),
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
