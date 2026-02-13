import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const diagnoses = await prisma.diagnosis.findMany({
      where: { sessionId: id },
      orderBy: { sortOrder: "asc" },
    })
    return NextResponse.json(diagnoses)
  } catch (error) {
    console.error("Failed to fetch diagnoses:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { diagnoses } = await req.json()

    await prisma.$transaction(async (tx) => {
      await tx.diagnosis.deleteMany({
        where: { sessionId: id },
      })

      if (diagnoses && diagnoses.length > 0) {
        await tx.diagnosis.createMany({
          data: diagnoses.map(
            (
              dx: {
                icdCode: string
                icdUri?: string
                diseaseName: string
                confidence: string
                evidence: string
                citations: unknown[]
                sortOrder: number
              },
              index: number
            ) => ({
              sessionId: id,
              icdCode: dx.icdCode,
              icdUri: dx.icdUri || null,
              diseaseName: dx.diseaseName,
              confidence:
                dx.confidence?.toUpperCase() === "HIGH"
                  ? "HIGH"
                  : dx.confidence?.toUpperCase() === "LOW"
                    ? "LOW"
                    : "MODERATE",
              evidence: dx.evidence,
              citations: dx.citations || [],
              sortOrder: dx.sortOrder ?? index,
            })
          ),
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Failed to update diagnoses:", error)
    return NextResponse.json(
      { error: "Failed to update diagnoses" },
      { status: 500 }
    )
  }
}
