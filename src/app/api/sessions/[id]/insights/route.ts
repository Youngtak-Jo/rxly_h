import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const insights = await prisma.insights.findUnique({
      where: { sessionId: id },
    })
    return NextResponse.json(insights)
  } catch (error) {
    console.error("Failed to fetch insights:", error)
    return NextResponse.json(null, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json()

    const insights = await prisma.insights.upsert({
      where: { sessionId: id },
      update: {
        summary: body.summary,
        keyFindings: body.keyFindings,
        redFlags: body.redFlags,
        lastProcessedAt: new Date(),
      },
      create: {
        sessionId: id,
        summary: body.summary || "",
        keyFindings: body.keyFindings || [],
        redFlags: body.redFlags || [],
        lastProcessedAt: new Date(),
      },
    })

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Failed to update insights:", error)
    return NextResponse.json(
      { error: "Failed to update insights" },
      { status: 500 }
    )
  }
}
