import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { recordUpdateSchema } from "@/lib/validations"
import {
  getSessionDocumentForUser,
  legacyRecordToSessionDocumentContent,
  sessionDocumentToLegacyRecord,
  upsertSessionDocument,
} from "@/lib/documents/server"
import { BUILT_IN_RECORD_TEMPLATE_ID } from "@/lib/documents/constants"
import type { ConsultationRecord } from "@/types/record"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const [session, context] = await Promise.all([
      prisma.session.findFirst({
        where: { id, userId: user.id },
        select: {
          patientName: true,
        },
      }),
      getSessionDocumentForUser({
        userId: user.id,
        sessionId: id,
        templateId: BUILT_IN_RECORD_TEMPLATE_ID,
      }).catch(() => null),
    ])

    const record = context?.sessionDocument
      ? sessionDocumentToLegacyRecord({
          sessionId: id,
          patientName: session?.patientName ?? null,
          sessionDocument: context.sessionDocument,
        })
      : null

    logAudit({ userId: user.id, action: "READ", resource: "record", sessionId: id })
    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch record:", error)
    return NextResponse.json(null, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const body = await req.json()
    const parsed = recordUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const recordData = {
      patientName: parsed.data.patientName,
      chiefComplaint: parsed.data.chiefComplaint,
      hpiText: parsed.data.hpiText,
      medications: parsed.data.medications,
      rosText: parsed.data.rosText,
      pmh: parsed.data.pmh,
      socialHistory: parsed.data.socialHistory,
      familyHistory: parsed.data.familyHistory,
      vitals: parsed.data.vitals,
      physicalExam: parsed.data.physicalExam,
      labsStudies: parsed.data.labsStudies,
      assessment: parsed.data.assessment,
      plan: parsed.data.plan,
      documentJson:
        parsed.data.documentJson === null
          ? null
          : parsed.data.documentJson !== undefined
            ? parsed.data.documentJson
            : undefined,
    }

    const [session, context] = await Promise.all([
      prisma.session.findFirst({
        where: { id, userId: user.id },
        select: {
          patientName: true,
        },
      }),
      getSessionDocumentForUser({
        userId: user.id,
        sessionId: id,
        templateId: BUILT_IN_RECORD_TEMPLATE_ID,
      }),
    ])

    const templateVersionId =
      context.sessionDocument?.templateVersionId ??
      context.installedDocument?.installedVersionId

    if (!templateVersionId) {
      return NextResponse.json(
        { error: "Document version not found" },
        { status: 400 }
      )
    }

    const legacyRecord: ConsultationRecord = {
      id: context.sessionDocument?.id ?? `legacy-record:${id}`,
      sessionId: id,
      date: context.sessionDocument?.generatedAt ?? new Date().toISOString(),
      patientName:
        recordData.patientName === undefined
          ? session?.patientName ?? null
          : (recordData.patientName ?? null),
      chiefComplaint: recordData.chiefComplaint ?? null,
      hpiText: recordData.hpiText ?? null,
      medications: recordData.medications ?? null,
      rosText: recordData.rosText ?? null,
      pmh: recordData.pmh ?? null,
      socialHistory: recordData.socialHistory ?? null,
      familyHistory: recordData.familyHistory ?? null,
      vitals:
        recordData.vitals === undefined || recordData.vitals === null
          ? null
          : (recordData.vitals as unknown as ConsultationRecord["vitals"]),
      physicalExam: recordData.physicalExam ?? null,
      labsStudies: recordData.labsStudies ?? null,
      assessment: recordData.assessment ?? null,
      plan: recordData.plan ?? null,
      documentJson: recordData.documentJson as ConsultationRecord["documentJson"],
    }

    const sessionDocument = await upsertSessionDocument({
      sessionId: id,
      templateId: BUILT_IN_RECORD_TEMPLATE_ID,
      templateVersionId,
      contentJson: legacyRecordToSessionDocumentContent(
        legacyRecord
      ) as Record<string, unknown>,
      generationInputs: context.sessionDocument?.generationInputs,
      generatedAt: context.sessionDocument?.generatedAt ?? new Date().toISOString(),
    })

    logAudit({ userId: user.id, action: "UPDATE", resource: "record", sessionId: id })
    return NextResponse.json(
      sessionDocumentToLegacyRecord({
        sessionId: id,
        patientName: legacyRecord.patientName,
        sessionDocument,
      })
    )
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update record:", error)
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    )
  }
}
