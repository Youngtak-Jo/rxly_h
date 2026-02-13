import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
      where: { id, userId: user.id },
      select: { id: true },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { messages } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      )
    }

    const created = await prisma.researchMessage.createMany({
      data: messages.map(
        (m: { role: string; content: string; citations?: unknown[] }) => ({
          sessionId: id,
          role: m.role,
          content: m.content,
          citations: JSON.stringify(m.citations || []),
        })
      ),
    })

    return NextResponse.json({ count: created.count })
  } catch (error) {
    console.error("Failed to save research messages:", error)
    return NextResponse.json(
      { error: "Failed to save research messages" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await prisma.session.findUnique({
      where: { id, userId: user.id },
      select: { id: true },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    await prisma.researchMessage.deleteMany({
      where: { sessionId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete research messages:", error)
    return NextResponse.json(
      { error: "Failed to delete research messages" },
      { status: 500 }
    )
  }
}
