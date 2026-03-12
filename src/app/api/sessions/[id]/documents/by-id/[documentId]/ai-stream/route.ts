import { NextResponse } from "next/server"
import { generateObject, streamText, type UserContent } from "ai"
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
import { BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID } from "@/lib/documents/constants"
import {
  isSystemBlankDocumentTitle,
  resolveBlankDocumentTitle,
} from "@/lib/documents/blank-document"
import {
  createEmptySessionDocumentGenerationInputs,
  resolveAutomaticClinicalContext,
} from "@/lib/documents/generation-config"
import {
  normalizeStoredDocumentGenerationConfig,
  sessionDocumentAiReviseSchema,
} from "@/lib/documents/schema"
import {
  getSessionDocumentByIdForUser,
  upsertSessionDocument,
} from "@/lib/documents/server"
import {
  createRichTextExtensions,
  normalizeRichTextDocument,
} from "@/lib/documents/rich-text"
import { sanitizeFinalStreamingHtml, sanitizeStreamingHtml } from "@/lib/documents/streaming-html"
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

type StreamEvent =
  | { type: "title"; title: string }
  | { type: "delta"; html: string }
  | { type: "complete"; sessionDocument: Awaited<ReturnType<typeof upsertSessionDocument>> }
  | { type: "error"; error: string }

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

async function generateBlankTitle(args: {
  userId: string
  sessionId: string
  modelId: string
  messageContent: UserContent
  generationConfig: Pick<DocumentGenerationConfig, "systemInstructions">
}) {
  const generated = await withAiTelemetry(
    {
      userId: args.userId,
      sessionId: args.sessionId,
      feature: "ai_document",
      model: args.modelId,
    },
    async () => {
      const model = getModel(args.modelId)
      const result = await generateObject({
        model,
        schema: z.object({
          title: z.string().trim().min(1).max(160),
        }),
        system: [
          "Generate a concise, user-facing title for the consultation document draft.",
          "When the request is short, infer the likely document type and keep the title practical.",
          "Return only the title field.",
          "Use the same language as the user's request unless the context strongly implies another language.",
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
        ...buildGenerationOptions(args.modelId, { temperature: 0.1 }),
      })

      return {
        result: result.object.title,
        usage: result.usage
          ? {
              inputTokens: result.usage.inputTokens,
              outputTokens: result.usage.outputTokens,
            }
          : undefined,
      }
    }
  )

  return generated.trim()
}

async function buildBlankDocumentStream(args: {
  userId: string
  sessionId: string
  documentId: string
  templateId: string
  instanceKey: string
  templateVersionId: string
  currentTitle: string | null
  messageContent: UserContent
  modelId: string
  generationConfig: Pick<
    DocumentGenerationConfig,
    | "clinicalContextDefault"
    | "systemInstructions"
    | "emptyValuePolicy"
  >
  generationInputs: SessionDocumentGenerationInputs
  abortSignal: AbortSignal
}) {
  const model = getModel(args.modelId)
  const encoder = new TextEncoder()

  let resolvedTitle = args.currentTitle?.trim() || ""
  const shouldGenerateTitle =
    !resolvedTitle || isSystemBlankDocumentTitle(resolvedTitle)
  const titlePromise = shouldGenerateTitle
    ? generateBlankTitle({
        userId: args.userId,
        sessionId: args.sessionId,
        modelId: args.modelId,
        messageContent: args.messageContent,
        generationConfig: args.generationConfig,
      })
        .then((aiTitle) => {
          const nextTitle =
            resolveBlankDocumentTitle({
              currentTitle: args.currentTitle,
              aiTitle,
            }) ?? aiTitle
          resolvedTitle = nextTitle
          return nextTitle
        })
        .catch(() => resolvedTitle)
    : Promise.resolve(resolvedTitle)

  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const writeEvent = (event: StreamEvent) => {
        if (closed) return
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      try {
        void titlePromise.then((title) => {
          if (!title.trim()) return
          writeEvent({ type: "title", title })
        })

        const result = streamText({
          model,
          system: [
            "Create or revise the current freeform consultation document to satisfy the user's request.",
            "When the current document is blank or nearly blank, treat the request as a request to draft a complete first version of the document.",
            "Short prompts such as 진단서, 소견서, school note, work excuse, or referral letter should still produce a complete, editable draft.",
            "Return only a single semantic HTML fragment.",
            "Use only body-safe tags such as h1, h2, h3, p, ul, ol, li, blockquote, hr, table, thead, tbody, tr, th, td, strong, em, u, a, and img.",
            "Do not wrap the HTML in markdown fences.",
            "Do not invent unsupported facts.",
            "Keep the output directly editable in a rich-text editor.",
            "Use the same language as the user's request unless the clinical context clearly indicates otherwise.",
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
          abortSignal: args.abortSignal,
        })

        let rawHtml = ""
        let sanitizedHtml = ""
        for await (const delta of result.textStream) {
          rawHtml += delta
          const nextSanitizedHtml = sanitizeStreamingHtml(rawHtml)
          const emittedHtml = nextSanitizedHtml.slice(sanitizedHtml.length)
          sanitizedHtml = nextSanitizedHtml
          if (emittedHtml) {
            writeEvent({ type: "delta", html: emittedHtml })
          }
        }

        const finalTitle = (await titlePromise).trim() || resolvedTitle
        const document = normalizeRichTextDocument(
          generateJSON(
            sanitizeFinalStreamingHtml(sanitizedHtml),
            createRichTextExtensions({ includePlaceholder: false })
          )
        )

        if (!documentHasMeaningfulContent(document as Record<string, unknown>)) {
          writeEvent({
            type: "error",
            error: "Failed to generate a document draft.",
          })
          controller.close()
          return
        }

        const sessionDocument = await upsertSessionDocument({
          documentId: args.documentId,
          sessionId: args.sessionId,
          templateId: args.templateId,
          instanceKey: args.instanceKey,
          templateVersionId: args.templateVersionId,
          title: finalTitle,
          contentJson: document as Record<string, unknown>,
          generationInputs: args.generationInputs,
          generatedAt: new Date().toISOString(),
        })

        writeEvent({ type: "complete", sessionDocument })
        closed = true
        controller.close()
      } catch (error) {
        writeEvent({
          type: "error",
          error:
            error instanceof Error && error.message.trim()
              ? error.message
              : "Failed to revise session document with AI",
        })
        closed = true
        controller.close()
      }
    },
  })

  return {
    stream: responseStream,
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
    if (context.template.id !== BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID) {
      return NextResponse.json(
        { error: "Streaming is supported only for blank documents" },
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
      prisma.session.findFirstOrThrow({
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

    const generationConfig = normalizeStoredDocumentGenerationConfig(
      activeVersion.generationConfigJson
    )
    const effectiveGenerationInputs =
      parsed.data.generationInputs ??
      context.sessionDocument.generationInputs ??
      createEmptySessionDocumentGenerationInputs()
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

    const { stream } = await buildBlankDocumentStream({
      userId: user.id,
      sessionId: id,
      documentId: context.sessionDocument.id,
      templateId: context.sessionDocument.templateId,
      instanceKey: context.sessionDocument.instanceKey,
      templateVersionId: activeVersion.id,
      currentTitle: context.sessionDocument.title,
      messageContent,
      modelId,
      generationConfig,
      generationInputs: effectiveGenerationInputs,
      abortSignal: req.signal,
    })

    logAudit({
      userId: user.id,
      action: "UPDATE",
      resource: "session_document",
      resourceId: context.sessionDocument.id,
      sessionId: id,
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to stream session document with AI", error)
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
