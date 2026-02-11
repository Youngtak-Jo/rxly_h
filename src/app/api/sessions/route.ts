import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()

    const session = await prisma.session.create({
      data: {
        userId: user.id,
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
