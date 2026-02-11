import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const record = await prisma.consultationRecord.findUnique({
      where: { sessionId: id },
    })
    return NextResponse.json(record)
  } catch (error) {
    console.error("Failed to fetch record:", error)
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

    const record = await prisma.consultationRecord.upsert({
      where: { sessionId: id },
      update: {
        patientName: body.patientName,
        chiefComplaint: body.chiefComplaint,
        hpiText: body.hpiText,
        rosText: body.rosText,
        pmh: body.pmh,
        socialHistory: body.socialHistory,
        familyHistory: body.familyHistory,
        vitals: body.vitals,
        physicalExam: body.physicalExam,
        labsStudies: body.labsStudies,
        assessment: body.assessment,
        plan: body.plan,
      },
      create: {
        sessionId: id,
        date: new Date(),
        patientName: body.patientName,
        chiefComplaint: body.chiefComplaint,
        hpiText: body.hpiText,
        rosText: body.rosText,
        pmh: body.pmh,
        socialHistory: body.socialHistory,
        familyHistory: body.familyHistory,
        vitals: body.vitals,
        physicalExam: body.physicalExam,
        labsStudies: body.labsStudies,
        assessment: body.assessment,
        plan: body.plan,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error("Failed to update record:", error)
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    )
  }
}
