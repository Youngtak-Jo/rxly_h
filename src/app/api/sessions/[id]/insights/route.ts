import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const [insights, checklistItems, diagnoses] = await Promise.all([
      prisma.insights.findUnique({
        where: { sessionId: id },
      }),
      prisma.checklistItem.findMany({
        where: { sessionId: id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.diagnosis.findMany({
        where: { sessionId: id },
        orderBy: { sortOrder: "asc" },
      }),
    ])
    return NextResponse.json({ ...insights, checklistItems, diagnoses })
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

    const diagnosticKeywords = body.diagnosticKeywords !== undefined
      ? body.diagnosticKeywords
      : undefined

    const insights = await prisma.$transaction(async (tx) => {
      const result = await tx.insights.upsert({
        where: { sessionId: id },
        update: {
          summary: body.summary,
          keyFindings: body.keyFindings,
          redFlags: body.redFlags,
          lastProcessedAt: new Date(),
          ...(diagnosticKeywords !== undefined && { diagnosticKeywords }),
        },
        create: {
          sessionId: id,
          summary: body.summary || "",
          keyFindings: body.keyFindings || [],
          redFlags: body.redFlags || [],
          lastProcessedAt: new Date(),
          ...(diagnosticKeywords !== undefined && { diagnosticKeywords }),
        },
      })

      // Sync checklist items if provided
      if (body.checklistItems && Array.isArray(body.checklistItems)) {
        await tx.checklistItem.deleteMany({
          where: { sessionId: id },
        })

        if (body.checklistItems.length > 0) {
          await tx.checklistItem.createMany({
            data: body.checklistItems.map(
              (
                item: {
                  label: string
                  isChecked: boolean
                  isAutoChecked: boolean
                  doctorNote: string | null
                  sortOrder: number
                  source: string
                },
                index: number
              ) => ({
                sessionId: id,
                label: item.label,
                isChecked: item.isChecked ?? false,
                isAutoChecked: item.isAutoChecked ?? false,
                doctorNote: item.doctorNote ?? null,
                sortOrder: item.sortOrder ?? index,
                source: item.source === "MANUAL" ? "MANUAL" : "AI",
              })
            ),
          })
        }
      }

      // Sync diagnoses if provided
      if (body.diagnoses && Array.isArray(body.diagnoses)) {
        await tx.diagnosis.deleteMany({
          where: { sessionId: id },
        })

        if (body.diagnoses.length > 0) {
          await tx.diagnosis.createMany({
            data: body.diagnoses.map(
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
      }

      return result
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
