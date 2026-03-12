import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import {
  getSessionDocumentForUser,
  legacyPatientHandoutToSessionDocumentContent,
  sessionDocumentToLegacyPatientHandout,
  upsertSessionDocument,
} from "@/lib/documents/server"
import { BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID } from "@/lib/documents/constants"
import type { PatientHandoutDocument } from "@/types/patient-handout"

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

    const context = await getSessionDocumentForUser({
      userId: user.id,
      sessionId: id,
      templateId: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
    }).catch(() => null)

    const handout = context?.sessionDocument
      ? sessionDocumentToLegacyPatientHandout({
          sessionId: id,
          sessionDocument: context.sessionDocument,
        })
      : null

    logAudit({
      userId: user.id,
      action: "READ",
      resource: "patient_handout",
      sessionId: id,
    })

    return NextResponse.json(handout)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to fetch patient handout:", error)
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

    if (!body || !Array.isArray(body.conditions) || !Array.isArray(body.entries)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const language = body.language === "ko" ? "ko" : "en"
    const generatedAt = body.generatedAt ? new Date(body.generatedAt) : new Date()

    const context = await getSessionDocumentForUser({
      userId: user.id,
      sessionId: id,
      templateId: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
    })

    const templateVersionId =
      context.sessionDocument?.templateVersionId ??
      context.installedDocument?.installedVersionId

    if (!templateVersionId) {
      return NextResponse.json(
        { error: "Document version not found" },
        { status: 400 }
      )
    }

    const handout: PatientHandoutDocument = {
      id: context.sessionDocument?.id ?? `legacy-handout:${id}`,
      sessionId: id,
      language,
      conditions: body.conditions as PatientHandoutDocument["conditions"],
      entries: body.entries as PatientHandoutDocument["entries"],
      documentJson:
        body.documentJson !== undefined
          ? (body.documentJson as PatientHandoutDocument["documentJson"])
          : null,
      generatedAt: generatedAt.toISOString(),
    }

    const sessionDocument = await upsertSessionDocument({
      sessionId: id,
      templateId: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
      templateVersionId,
      contentJson: legacyPatientHandoutToSessionDocumentContent(
        handout
      ) as Record<string, unknown>,
      generationInputs: {
        clinicalContextMode: null,
        confirmedDiagnoses: handout.conditions,
      },
      generatedAt: handout.generatedAt,
    })

    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "patient_handout",
      sessionId: id,
    })

    return NextResponse.json(
      sessionDocumentToLegacyPatientHandout({
        sessionId: id,
        sessionDocument,
      })
    )
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to update patient handout:", error)
    return NextResponse.json(
      { error: "Failed to update patient handout" },
      { status: 500 }
    )
  }
}
