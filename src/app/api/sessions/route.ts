import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Failed to fetch sessions:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const session = await prisma.session.create({
      data: {
        title: body.title || "New Consultation",
        patientName: body.patientName || null,
        insights: {
          create: {
            summary: "",
            keyFindings: [],
            redFlags: [],
          },
        },
        record: {
          create: {
            date: new Date(),
          },
        },
      },
      include: {
        insights: true,
        record: true,
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error("Failed to create session:", error)
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    )
  }
}
