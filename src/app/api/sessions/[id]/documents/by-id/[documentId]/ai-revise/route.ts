import { NextResponse } from "next/server"
import { generateObject, type UserContent } from "ai"
import { z } from "zod"
import { generateJSON } from "@tiptap/html/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DEFAULT_MODEL } from "@/lib/xai"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"
import {
  BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID,
} from "@/lib/documents/constants"
import { resolveBlankDocumentTitle } from "@/lib/documents/blank-document"
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
  getSessionDocumentByIdForUser,
  upsertSessionDocument,
} from "@/lib/documents/server"
import {
  createRichTextExtensions,
  genericStructuredContentToRichTextDocument,
  normalizeRichTextDocument,
} from "@/lib/documents/rich-text"
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

function stripCodeFences(value: string): string {
  return value
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()
}

function nodeHasMeaningfulContent(
  node: Record<string, unknown> | null | undefined
): boolean {
  if (!node) return false

  if (node.type === "text") {
    return typeof node.text === "string" && node.text.trim().length > 0
  }

  if (node.type === "image") {
    return (
      !!node.attrs &&
      typeof node.attrs === "object" &&
      typeof (node.attrs as { src?: unknown }).src === "string" &&
      !!(node.attrs as { src: string }).src.trim()
    )
  }

  const content = Array.isArray(node.content)
    ? (node.content as Array<Record<string, unknown>>)
    : []

  return content.some((child) => nodeHasMeaningfulContent(child))
}

function documentHasMeaningfulContent(document: Record<string, unknown>): boolean {
  const content = Array.isArray(document.content)
    ? (document.content as Array<Record<string, unknown>>)
    : []
  return content.some((node) => nodeHasMeaningfulContent(node))
}

async function generateBlankRichTextDocument(args: {
  userId: string
  sessionId: string
  modelId: string
  messageContent: UserContent
  generationConfig: Pick<
    DocumentGenerationConfig,
    | "clinicalContextDefault"
    | "systemInstructions"
    | "emptyValuePolicy"
  >
}) {
  const model = getModel(args.modelId)
  const generated = await withAiTelemetry(
    {
      userId: args.userId,
      sessionId: args.sessionId,
      feature: "ai_document",
      model: args.modelId,
    },
    async () => {
      const result = await generateObject({
        model,
        schema: z.object({
          title: z.string().trim().min(1),
          html: z.string().trim().min(1),
        }),
        system: [
          "Create or revise the current freeform consultation document to satisfy the user's request.",
          "When the current document is blank or nearly blank, treat the request as a request to draft a complete first version of the document.",
          "Short prompts such as 진단서, 소견서, school note, or work excuse should still produce a complete, editable draft.",
          "Return a concise document title in the title field and a single semantic HTML fragment in the html field.",
          "Use only body-safe tags such as h1, h2, h3, p, ul, ol, li, blockquote, hr, table, thead, tbody, tr, th, td, strong, em, u, a, and img.",
          "Preserve valid existing content unless the user asks to change it or the supplied context clearly requires an update.",
          "Do not wrap the HTML in markdown fences.",
          "Do not invent unsupported facts.",
          "Keep the output directly editable in a rich-text editor.",
          "Use the same language as the user's request unless the template context clearly indicates otherwise.",
          args.generationConfig.systemInstructions || "",
        ]
          .filter(Boolean)
          .join("\n\n"),
        messages: [
          {
            role: "user",
            content: args.messageContent,
          },
        ],
        ...buildGenerationOptions(args.modelId, { temperature: 0.2 }),
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

  const json = generateJSON(
    stripCodeFences(generated.html),
    createRichTextExtensions({ includePlaceholder: false })
  )

  return {
    title: generated.title.trim(),
    document: normalizeRichTextDocument(json),
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await params
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

    const context = await getSessionDocumentByIdForUser({
      userId: user.id,
      sessionId: id,
      documentId,
    })
    if (context.template.renderer !== "GENERIC_STRUCTURED") {
      return NextResponse.json(
        { error: "Only generic structured documents can be revised" },
        { status: 400 }
      )
    }

    const activeVersion = await prisma.documentTemplateVersion.findUnique({
      where: { id: context.sessionDocument.templateVersionId },
    })
    if (!activeVersion || activeVersion.templateId !== context.template.id) {
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
    const isBlankDocument =
      context.template.id === BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID
    const effectiveGenerationInputs =
      parsed.data.generationInputs ??
      context.sessionDocument.generationInputs ??
      createEmptySessionDocumentGenerationInputs()
    const confirmedDiagnosisRequirement =
      getConfirmedDiagnosisRequirement(generationConfig)
    if (!isBlankDocument && confirmedDiagnosisRequirement?.required) {
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
      !isBlankDocument &&
      requestedClinicalContextMode === "transcript" &&
      transcriptEntries.length === 0
    ) {
      return NextResponse.json(
        { error: "Transcript source is not ready yet for this document" },
        { status: 400 }
      )
    }
    if (
      !isBlankDocument &&
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
      currentDocument: context.sessionDocument.contentJson,
      sessionDocumentTemplate: {
        title: context.sessionDocument.title ?? context.template.title,
        description: context.template.description,
        category: context.template.category,
        language: context.template.language,
        region: context.template.region,
      },
      generationConfig,
    })

    const blankDraft =
      isBlankDocument
        ? await generateBlankRichTextDocument({
            userId: user.id,
            sessionId: id,
            modelId,
            messageContent,
            generationConfig,
          })
        : null

    const structuredDocument =
      !isBlankDocument
        ? await withAiTelemetry(
            {
              userId: user.id,
              sessionId: id,
              feature: "ai_document",
              model: modelId,
            },
            async () => {
              const model = getModel(modelId)
              const result = await generateObject({
                model,
                schema: buildDocumentContentSchema(schemaJson as never),
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
        : null

    const normalizedContent =
      structuredDocument !== null
        ? normalizeDocumentContentForStorage(
            {
              nodes: schemaJson.nodes as never,
            },
            structuredDocument
          )
        : null

    const nextDocument =
      normalizedContent !== null
        ? genericStructuredContentToRichTextDocument({
            contentJson: normalizedContent,
            schemaNodes: schemaJson.nodes as never,
          })
        : blankDraft?.document ?? normalizeRichTextDocument({})

    if (isBlankDocument && !documentHasMeaningfulContent(nextDocument)) {
      return NextResponse.json(
        { error: "Failed to generate a document draft." },
        { status: 422 }
      )
    }

    const nextTitle = isBlankDocument
      ? resolveBlankDocumentTitle({
          currentTitle: context.sessionDocument.title,
          aiTitle: blankDraft?.title ?? null,
        })
      : context.sessionDocument.title

    const sessionDocument = await upsertSessionDocument({
      documentId: context.sessionDocument.id,
      sessionId: id,
      templateId: context.sessionDocument.templateId,
      instanceKey: context.sessionDocument.instanceKey,
      templateVersionId: activeVersion.id,
      title: nextTitle,
      contentJson: nextDocument as Record<string, unknown>,
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
