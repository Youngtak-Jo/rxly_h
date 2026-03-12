import { NextResponse } from "next/server"
import { generateObject, type UserContent } from "ai"
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
  resolveAutomaticClinicalContext,
} from "@/lib/documents/generation-config"
import { getConfirmedDiagnosisRequirement } from "@/lib/documents/generation-requirements"
import {
  buildDocumentContentSchema,
  normalizeDocumentContentForStorage,
  normalizeStoredDocumentGenerationConfig,
  sessionDocumentAiReviseSchema,
} from "@/lib/documents/schema"
import {
  getSessionDocumentForUser,
  upsertSessionDocument,
} from "@/lib/documents/server"
import { genericStructuredContentToRichTextDocument } from "@/lib/documents/rich-text"
import { logAudit } from "@/lib/audit"
import type {
  DocumentGenerationConfig,
  SessionDocumentGenerationInputs,
} from "@/types/document"

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

function getRevisePayloadErrorMessage(issues: Array<{ path: PropertyKey[] }>) {
  const promptIssue = issues.find((issue) => issue.path[0] === "prompt")
  if (promptIssue) {
    return "Enter a request for the document."
  }

  return "Invalid revise payload"
}

function buildRevisionContextMessage(args: {
  session: SessionWithDocumentContext
  transcriptEntries: TranscriptContextEntry[]
  doctorNotesText: string
  generationInputs: SessionDocumentGenerationInputs
  prompt: string
  currentDocument: Record<string, unknown>
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
    | "systemInstructions"
    | "emptyValuePolicy"
  >
}) {
  const clinicalContextMode = resolveAutomaticClinicalContext({
    generationInputs: args.generationInputs,
    insightsAvailable: insightsHaveContent(args.session),
    transcriptAvailable: args.transcriptEntries.length > 0,
  })
  const clinicalBasisLabel =
    clinicalContextMode.mode === "automatic"
      ? "automatic"
      : clinicalContextMode.mode

  const parts: string[] = [
    `Revision request:\n${args.prompt}`,
    `Document title: ${args.sessionDocumentTemplate.title}`,
    `Description: ${args.sessionDocumentTemplate.description}`,
    `Document category: ${args.sessionDocumentTemplate.category}`,
    `Document language: ${args.sessionDocumentTemplate.language}`,
    `Document region: ${args.sessionDocumentTemplate.region}`,
    `Empty value policy: ${args.generationConfig.emptyValuePolicy}`,
    `Clinical basis: ${clinicalBasisLabel}`,
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
    `Current document JSON:\n${JSON.stringify(args.currentDocument)}`,
  ]

  if (clinicalContextMode.includeTranscript) {
    parts.push(`Transcript:\n${buildTranscriptText(args.transcriptEntries)}`)
  }
  if (clinicalContextMode.includeInsights && args.session.insights) {
    parts.push(
      `Insights:\n${JSON.stringify({
        summary: args.session.insights.summary,
        keyFindings: args.session.insights.keyFindings,
        redFlags: args.session.insights.redFlags,
        diagnosticKeywords: args.session.insights.diagnosticKeywords,
      })}`
    )
  }
  if (!clinicalContextMode.includeTranscript && !clinicalContextMode.includeInsights) {
    parts.push(
      "Clinical context:\nNo transcript or insights are ready yet. Use available session metadata and doctor notes only."
    )
  }

  const confirmedDiagnosesText = buildConfirmedDiagnosesText(args.generationInputs)
  if (confirmedDiagnosesText) {
    parts.push(`Confirmed diagnoses:\n${confirmedDiagnosesText}`)
  }

  const content: UserContent = [
    {
      type: "text",
      text: parts.join("\n\n"),
    },
  ]

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

    const parsed = sessionDocumentAiReviseSchema.safeParse(
      await req.json().catch(() => ({}))
    )
    if (!parsed.success) {
      return NextResponse.json(
        { error: getRevisePayloadErrorMessage(parsed.error.issues) },
        { status: 400 }
      )
    }

    const modelId = parsed.data.model || DEFAULT_MODEL
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
        { error: "Only generic structured documents can be revised" },
        { status: 400 }
      )
    }
    if (!sessionDocumentContext.sessionDocument) {
      return NextResponse.json(
        { error: "Document must exist before it can be revised" },
        { status: 400 }
      )
    }

    const activeVersion = await prisma.documentTemplateVersion.findUnique({
      where: { id: sessionDocumentContext.sessionDocument.templateVersionId },
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
        },
      }),
    ])

    const schemaJson = activeVersion.schemaJson as {
      nodes: Array<Record<string, unknown>>
    }
    const generationConfig = normalizeStoredDocumentGenerationConfig(
      activeVersion.generationConfigJson
    )
    const effectiveGenerationInputs =
      parsed.data.generationInputs ??
      sessionDocumentContext.sessionDocument.generationInputs ??
      createEmptySessionDocumentGenerationInputs()
    const confirmedDiagnosisRequirement =
      getConfirmedDiagnosisRequirement(generationConfig)
    if (confirmedDiagnosisRequirement?.required) {
      const selectedCount = effectiveGenerationInputs.confirmedDiagnoses.length
      if (selectedCount === 0) {
        return NextResponse.json(
          { error: "Confirmed diagnosis selection is required before revision" },
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
    const messageContent = buildRevisionContextMessage({
      session,
      transcriptEntries,
      doctorNotesText,
      generationInputs: effectiveGenerationInputs,
      prompt: parsed.data.prompt,
      currentDocument: sessionDocumentContext.sessionDocument.contentJson,
      sessionDocumentTemplate: {
        title: sessionDocumentContext.template.title,
        description: sessionDocumentContext.template.description,
        category: sessionDocumentContext.template.category,
        language: sessionDocumentContext.template.language,
        region: sessionDocumentContext.template.region,
      },
      generationConfig,
    })

    const model = getModel(modelId)
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
            "Revise the existing structured medical document to satisfy the user's request.",
            "Preserve valid existing content unless the user asks to change it or the clinical context clearly requires an update.",
            "Return only valid structured output matching the supplied schema.",
            "Honor the requested document language and region.",
            "Do not invent unsupported facts.",
            "When the current document already contains clinically supported details, keep them unless the revision request or provided context contradicts them.",
            "Clinician-confirmed diagnoses are authoritative when present.",
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
          ...buildGenerationOptions(modelId, { temperature: 0.15 }),
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
      resource: "session_document",
      resourceId: sessionDocument.id,
      sessionId: id,
    })

    return NextResponse.json({ sessionDocument })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to revise session document with AI", error)
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Failed to revise session document with AI",
      },
      { status: 500 }
    )
  }
}
