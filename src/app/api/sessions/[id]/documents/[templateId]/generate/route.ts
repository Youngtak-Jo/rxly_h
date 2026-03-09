import { NextResponse } from "next/server"
import { generateObject, type UserContent } from "ai"
import { createClient } from "@supabase/supabase-js"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DEFAULT_MODEL } from "@/lib/xai"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"
import {
  createEmptySessionDocumentGenerationInputs,
  resolveClinicalContextMode,
} from "@/lib/documents/generation-config"
import { getConfirmedDiagnosisRequirement } from "@/lib/documents/generation-requirements"
import {
  buildDocumentContentSchema,
  normalizeDocumentContentForStorage,
  normalizeStoredDocumentGenerationConfig,
  sessionDocumentGenerationInputsSchema,
} from "@/lib/documents/schema"
import {
  getSessionDocumentForUser,
  upsertSessionDocument,
} from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"
import { genericStructuredContentToRichTextDocument } from "@/lib/documents/rich-text"
import type {
  DocumentGenerationConfig,
  SessionDocumentGenerationInputs,
} from "@/types/document"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type SessionWithDocumentContext = {
  id: string
  title: string | null
  patientName: string | null
  mode: string
  startedAt: Date
  insights: {
    summary: string
    keyFindings: unknown
    redFlags: unknown
    diagnosticKeywords: unknown
  } | null
}

type TranscriptContextEntry = {
  speaker: string
  text: string
}

type NoteContextEntry = {
  content: string
  imageUrls: unknown
  storagePaths: unknown
  createdAt: Date
}

type UploadedImageEntry = {
  caption: string
  storagePath: string | null
  imageUrl: string | null
  createdAt: Date
}

function buildConfirmedDiagnosesText(
  generationInputs: SessionDocumentGenerationInputs
) {
  if (generationInputs.confirmedDiagnoses.length === 0) {
    return ""
  }

  return generationInputs.confirmedDiagnoses
    .map((diagnosis) =>
      JSON.stringify({
        icdCode: diagnosis.icdCode,
        diseaseName: diagnosis.diseaseName,
        source: diagnosis.source,
      })
    )
    .join("\n")
}

function buildRegionGuidance(region: string) {
  if (region === "global") {
    return "Keep the document globally applicable. Avoid country-specific regulatory assumptions unless the template explicitly requires them."
  }

  if (region === "kr") {
    return "Use Korean clinical and administrative conventions when region-specific wording matters."
  }

  return "Use United States clinical and administrative conventions when region-specific wording matters."
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function hasNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0
}

function buildDoctorNotesText(notes: NoteContextEntry[]): string {
  return notes
    .map((note) => note.content.trim())
    .filter(Boolean)
    .join("\n")
}

function buildTranscriptText(transcriptEntries: TranscriptContextEntry[]): string {
  return transcriptEntries.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n")
}

function insightsHaveContent(session: SessionWithDocumentContext) {
  return (
    !!session.insights &&
    (session.insights.summary.trim().length > 0 ||
      hasNonEmptyArray(session.insights.keyFindings) ||
      hasNonEmptyArray(session.insights.redFlags) ||
      hasNonEmptyArray(session.insights.diagnosticKeywords))
  )
}

function buildUploadedImageCandidates(notes: NoteContextEntry[]): UploadedImageEntry[] {
  return notes
    .flatMap((note) => {
      const imageUrls = toStringArray(note.imageUrls)
      const storagePaths = toStringArray(note.storagePaths)
      const itemCount = Math.max(imageUrls.length, storagePaths.length)

      return Array.from({ length: itemCount }, (_, index) => ({
        caption: note.content.trim() || "Doctor note image",
        storagePath: storagePaths[index] ?? null,
        imageUrl: imageUrls[index] ?? null,
        createdAt: note.createdAt,
      }))
    })
    .filter((item) => item.storagePath || item.imageUrl)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
}

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

function buildContextMessage(args: {
  session: SessionWithDocumentContext
  transcriptEntries: TranscriptContextEntry[]
  doctorNotesText: string
  generationInputs: SessionDocumentGenerationInputs
  sessionDocumentTemplate: {
    title: string
    description: string
    category: string
    language: string
    region: string
  }
  generationConfig: Pick<
    DocumentGenerationConfig,
    | "clinicalContextDefault"
    | "includeSourceImages"
    | "systemInstructions"
    | "emptyValuePolicy"
  >
  uploadedImages: Array<UploadedImageEntry & { resolvedUrl: string }>
}) {
  const clinicalContextMode = resolveClinicalContextMode({
    generationConfig: args.generationConfig,
    generationInputs: args.generationInputs,
  })

  const parts: string[] = [
    `Document title: ${args.sessionDocumentTemplate.title}`,
    `Description: ${args.sessionDocumentTemplate.description}`,
    `Document category: ${args.sessionDocumentTemplate.category}`,
    `Document language: ${args.sessionDocumentTemplate.language}`,
    `Document region: ${args.sessionDocumentTemplate.region}`,
    `Empty value policy: ${args.generationConfig.emptyValuePolicy}`,
    `Clinical basis: ${clinicalContextMode}`,
    `Attach uploaded source images: ${args.generationConfig.includeSourceImages ? "yes" : "no"}`,
    `Region guidance: ${buildRegionGuidance(args.sessionDocumentTemplate.region)}`,
    `Session metadata:\n${JSON.stringify({
      sessionId: args.session.id,
      title: args.session.title,
      patientName: args.session.patientName,
      mode: args.session.mode,
      startedAt: args.session.startedAt,
    })}`,
    args.doctorNotesText
      ? `Doctor notes:\n${args.doctorNotesText}`
      : "Doctor notes:\nNo clinician-authored notes available.",
  ]

  if (clinicalContextMode === "transcript") {
    parts.push(`Transcript:\n${buildTranscriptText(args.transcriptEntries)}`)
  } else if (args.session.insights) {
    parts.push(
      `Insights:\n${JSON.stringify({
        summary: args.session.insights.summary,
        keyFindings: args.session.insights.keyFindings,
        redFlags: args.session.insights.redFlags,
        diagnosticKeywords: args.session.insights.diagnosticKeywords,
      })}`
    )
  }

  const confirmedDiagnosesText = buildConfirmedDiagnosesText(args.generationInputs)
  if (confirmedDiagnosesText) {
    parts.push(`Confirmed diagnoses:\n${confirmedDiagnosesText}`)
  }

  if (args.generationConfig.includeSourceImages && args.uploadedImages.length > 0) {
    parts.push(
      [
        `Uploaded source images (${args.uploadedImages.length}):`,
        ...args.uploadedImages.map((image, index) => {
          const trimmedCaption =
            image.caption.length > 400
              ? `${image.caption.slice(0, 397)}...`
              : image.caption
          return `Image ${index + 1}: ${trimmedCaption}`
        }),
      ].join("\n")
    )
  }

  const content: UserContent = [
    {
      type: "text",
      text: parts.join("\n\n"),
    },
  ]

  if (args.generationConfig.includeSourceImages) {
    for (const uploadedImage of args.uploadedImages) {
      content.push({
        type: "image",
        image: new URL(uploadedImage.resolvedUrl),
      })
    }
  }

  return content
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
    const parsedGenerationInputs =
      body.generationInputs !== undefined
        ? sessionDocumentGenerationInputsSchema
            .nullable()
            .safeParse(body.generationInputs)
        : null
    if (parsedGenerationInputs && !parsedGenerationInputs.success) {
      return NextResponse.json(
        { error: "Invalid document generation inputs" },
        { status: 400 }
      )
    }

    const effectiveGenerationInputs =
      parsedGenerationInputs && parsedGenerationInputs.success
        ? parsedGenerationInputs.data ?? createEmptySessionDocumentGenerationInputs()
        : sessionDocumentContext.sessionDocument?.generationInputs ??
          createEmptySessionDocumentGenerationInputs()
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

    const clinicalContextMode = resolveClinicalContextMode({
      generationConfig,
      generationInputs: effectiveGenerationInputs,
    })
    if (clinicalContextMode === "transcript" && transcriptEntries.length === 0) {
      return NextResponse.json(
        { error: "Transcript source is not ready yet for this document" },
        { status: 400 }
      )
    }
    if (clinicalContextMode === "insights" && !insightsHaveContent(session)) {
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
    const messageContent = buildContextMessage({
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

    const objectSchema = buildDocumentContentSchema(schemaJson as never)
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

    const normalizedContent = normalizeDocumentContentForStorage(
      {
        nodes: schemaJson.nodes as never,
      },
      generated
    )
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
