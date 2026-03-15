import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DEFAULT_MODEL } from "@/lib/xai"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"
import { getConfirmedDiagnosisRequirement } from "@/lib/documents/generation-requirements"
import {
  buildDocumentContextMessage,
  buildDocumentObjectSchema,
  buildDoctorNotesText,
  buildUploadedImageCandidates,
  insightsHaveContent,
  normalizeGeneratedDocumentContent,
  normalizeStoredDocumentGenerationConfig,
  resolveDocumentGenerationInputs,
  type UploadedImageEntry,
} from "@/lib/ai/document-generator"
import {
  getSessionDocumentForUser,
  upsertSessionDocument,
} from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"
import { genericStructuredContentToRichTextDocument } from "@/lib/documents/rich-text"
import type { SessionDocumentGenerationInputs } from "@/types/document"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function resolveUploadedImages(
  candidates: UploadedImageEntry[]
): Promise<Array<UploadedImageEntry & { resolvedUrl: string }>> {
  const latestCandidates = candidates.slice(0, 6)
  const pathsToSign = latestCandidates
    .map((item) => item.storagePath)
    .filter((value): value is string => Boolean(value))

  let signedUrlByPath = new Map<string, string>()
  if (pathsToSign.length > 0) {
    try {
      const { data } = await supabaseAdmin.storage
        .from("medical-images")
        .createSignedUrls(pathsToSign, 3600)

      signedUrlByPath = new Map(
        pathsToSign.map((path, index) => [path, data?.[index]?.signedUrl ?? ""])
      )
    } catch (error) {
      logger.warn("Failed to sign uploaded image URLs for document generation", {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const deduped: Array<UploadedImageEntry & { resolvedUrl: string }> = []
  const seenUrls = new Set<string>()

  for (const candidate of latestCandidates) {
    const resolvedUrl =
      (candidate.storagePath ? signedUrlByPath.get(candidate.storagePath) : null) ||
      candidate.imageUrl

    if (!resolvedUrl || seenUrls.has(resolvedUrl)) continue

    try {
      new URL(resolvedUrl)
    } catch {
      continue
    }

    seenUrls.add(resolvedUrl)
    deduped.push({
      ...candidate,
      resolvedUrl,
    })
  }

  return deduped
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  const { id, templateId } = await params
  try {
    const user = await requireAuth()
    await requireSessionOwnership(id, user.id)
    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const body = (await req.json().catch(() => ({}))) as {
      model?: string
      generationInputs?: SessionDocumentGenerationInputs | null
    }
    const modelId = body.model || DEFAULT_MODEL
    if (!isSupportedModel(modelId)) {
      return NextResponse.json({ error: "Unsupported model id" }, { status: 400 })
    }

    const sessionDocumentContext = await getSessionDocumentForUser({
      userId: user.id,
      sessionId: id,
      templateId,
    })
    if (sessionDocumentContext.template.renderer !== "GENERIC_STRUCTURED") {
      return NextResponse.json(
        { error: "Only generic structured documents can be generated" },
        { status: 400 }
      )
    }

    const activeVersionId =
      sessionDocumentContext.installedDocument?.installedVersionId ?? null
    if (!activeVersionId) {
      return NextResponse.json({ error: "Document not installed" }, { status: 400 })
    }

    const activeVersion = await prisma.documentTemplateVersion.findUnique({
      where: { id: activeVersionId },
    })
    if (!activeVersion || activeVersion.templateId !== templateId) {
      return NextResponse.json({ error: "Document version not found" }, { status: 404 })
    }

    const [session, transcriptEntries, notes] = await Promise.all([
      prisma.session.findUniqueOrThrow({
        where: { id, userId: user.id },
        include: {
          insights: true,
        },
      }),
      prisma.transcriptEntry.findMany({
        where: { sessionId: id, isFinal: true },
        orderBy: [{ createdAt: "asc" }, { startTime: "asc" }],
        select: {
          speaker: true,
          text: true,
        },
      }),
      prisma.note.findMany({
        where: { sessionId: id },
        orderBy: { createdAt: "asc" },
        select: {
          content: true,
          imageUrls: true,
          storagePaths: true,
          createdAt: true,
        },
      }),
    ])

    const schemaJson = activeVersion.schemaJson as {
      nodes: Array<Record<string, unknown>>
    }
    const generationConfig = normalizeStoredDocumentGenerationConfig(
      activeVersion.generationConfigJson
    )
    const { error: generationInputsError, effectiveGenerationInputs } =
      resolveDocumentGenerationInputs(
        body.generationInputs,
        sessionDocumentContext.sessionDocument?.generationInputs
      )
    if (generationInputsError || !effectiveGenerationInputs) {
      return NextResponse.json(
        { error: generationInputsError ?? "Invalid document generation inputs" },
        { status: 400 }
      )
    }

    const confirmedDiagnosisRequirement =
      getConfirmedDiagnosisRequirement(generationConfig)
    if (confirmedDiagnosisRequirement?.required) {
      const selectedCount = effectiveGenerationInputs.confirmedDiagnoses.length
      if (selectedCount === 0) {
        return NextResponse.json(
          { error: "Confirmed diagnosis selection is required before generation" },
          { status: 400 }
        )
      }
      if (
        confirmedDiagnosisRequirement.selectionMode === "single" &&
        selectedCount !== 1
      ) {
        return NextResponse.json(
          { error: "Exactly one confirmed diagnosis must be selected" },
          { status: 400 }
        )
      }
    }

    const requestedClinicalContextMode =
      effectiveGenerationInputs.clinicalContextMode
    if (
      requestedClinicalContextMode === "transcript" &&
      transcriptEntries.length === 0
    ) {
      return NextResponse.json(
        { error: "Transcript source is not ready yet for this document" },
        { status: 400 }
      )
    }
    if (
      requestedClinicalContextMode === "insights" &&
      !insightsHaveContent(session)
    ) {
      return NextResponse.json(
        { error: "Insights source is not ready yet for this document" },
        { status: 400 }
      )
    }

    const doctorNotesText = buildDoctorNotesText(notes)
    const uploadedImages = generationConfig.includeSourceImages
      ? await resolveUploadedImages(buildUploadedImageCandidates(notes))
      : []

    const model = getModel(modelId)
    const messageContent = buildDocumentContextMessage({
      session,
      transcriptEntries,
      doctorNotesText,
      generationInputs: effectiveGenerationInputs,
      sessionDocumentTemplate: {
        title: sessionDocumentContext.template.title,
        description: sessionDocumentContext.template.description,
        category: sessionDocumentContext.template.category,
        language: sessionDocumentContext.template.language,
        region: sessionDocumentContext.template.region,
      },
      generationConfig,
      uploadedImages,
    })

    const objectSchema = buildDocumentObjectSchema(schemaJson)
    const generated = await withAiTelemetry(
      {
        userId: user.id,
        sessionId: id,
        feature: "ai_document",
        model: modelId,
      },
      async () => {
        const result = await generateObject({
          model,
          schema: objectSchema,
          system: [
            "Generate a structured medical document matching the supplied schema.",
            "Return only valid structured output.",
            "Honor the requested document language and region.",
            "Use the template title, description, category, schema, and custom instructions to infer the document's intended purpose and writing style.",
            "INSTRUCTION: Use only the supplied metadata, doctor notes, selected clinical basis, clinician-confirmed diagnoses, and attached note images when available. Do not infer unsupported facts.",
            "Doctor notes and clinician-selected confirmed diagnoses are authoritative when present.",
            generationConfig.systemInstructions || "",
          ]
            .filter(Boolean)
            .join("\n\n"),
          messages: [
            {
              role: "user",
              content: messageContent,
            },
          ],
          ...buildGenerationOptions(modelId, { temperature: 0.2 }),
        })

        return {
          result: result.object,
          usage: result.usage
            ? {
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
              }
            : undefined,
        }
      }
    )

    const normalizedContent = normalizeGeneratedDocumentContent({
      schemaJson,
      generated,
    })
    const richTextDocument = genericStructuredContentToRichTextDocument({
      contentJson: normalizedContent,
      schemaNodes: schemaJson.nodes as never,
    })

    const sessionDocument = await upsertSessionDocument({
      sessionId: id,
      templateId,
      templateVersionId: activeVersion.id,
      contentJson: richTextDocument as Record<string, unknown>,
      generationInputs: effectiveGenerationInputs,
      generatedAt: new Date().toISOString(),
    })

    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "ai_document",
      resourceId: templateId,
      sessionId: id,
      metadata: {
        templateId,
        templateVersionId: activeVersion.id,
      },
    })

    return NextResponse.json({
      sessionDocument,
      templateVersionId: activeVersion.id,
      activeVersion,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to generate structured document", error)
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to generate document",
      },
      { status: 500 }
    )
  }
}
