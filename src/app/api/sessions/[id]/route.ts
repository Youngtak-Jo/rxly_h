import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET(
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
      include: {
        insights: true,
        record: true,
        checklistItems: { orderBy: { sortOrder: "asc" } },
      },
    })
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }
    return NextResponse.json(session)
  } catch (error) {
    console.error("Failed to fetch session:", error)
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const existing = await prisma.session.findUnique({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const body = await req.json()
    const session = await prisma.session.update({
      where: { id },
      data: {
        title: body.title,
        patientName: body.patientName,
      },
    })
    return NextResponse.json(session)
  } catch (error) {
    console.error("Failed to update session:", error)
    return NextResponse.json(
      { error: "Failed to update session" },
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

    const existing = await prisma.session.findUnique({
      where: { id, userId: user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    await prisma.session.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete session:", error)
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    )
  }
}
