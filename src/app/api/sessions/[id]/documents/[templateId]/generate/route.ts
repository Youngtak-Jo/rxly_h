import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { requireAuth, requireSessionOwnership } from "@/lib/auth"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { getModel, isSupportedModel } from "@/lib/ai-provider"
import { DEFAULT_MODEL } from "@/lib/xai"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import { withAiTelemetry } from "@/lib/telemetry/ai"
import {
  buildDocumentContentSchema,
  normalizeDocumentGenerationConfig,
  normalizeDocumentContentForStorage,
} from "@/lib/documents/schema"
import { getSessionDocumentForUser, upsertSessionDocument } from "@/lib/documents/server"
import { logAudit } from "@/lib/audit"

function buildContextPrompt(args: {
  session: {
    id: string
    title: string | null
    patientName: string | null
    mode: string
    startedAt: Date
    insights: unknown
    diagnoses: unknown
    record: unknown
    patientHandout: unknown
  }
  transcriptEntries: Array<{ speaker: string; text: string }>
  notes: Array<{ content: string }>
  researchMessages: Array<{ role: string; content: string }>
  sessionDocumentTemplate: {
    title: string
    description: string
    language: string
    region: string
  }
  generationConfig: {
    contextSources: string[]
    systemInstructions: string
    emptyValuePolicy: string
  }
}) {
  const parts: string[] = [
    `Document title: ${args.sessionDocumentTemplate.title}`,
    `Description: ${args.sessionDocumentTemplate.description}`,
    `Document language: ${args.sessionDocumentTemplate.language}`,
    `Document region: ${args.sessionDocumentTemplate.region}`,
    `Empty value policy: ${args.generationConfig.emptyValuePolicy}`,
  ]

  if (args.sessionDocumentTemplate.region === "global") {
    parts.push(
      "Region guidance: Keep the document globally applicable. Avoid country-specific regulatory assumptions unless the template explicitly requires them."
    )
  } else if (args.sessionDocumentTemplate.region === "kr") {
    parts.push(
      "Region guidance: Use Korean clinical and administrative conventions when region-specific wording matters."
    )
  } else if (args.sessionDocumentTemplate.region === "us") {
    parts.push(
      "Region guidance: Use United States clinical and administrative conventions when region-specific wording matters."
    )
  }

  const sourceSet = new Set(args.generationConfig.contextSources)
  if (sourceSet.has("sessionMeta")) {
    parts.push(`Session metadata:\n${JSON.stringify({
      sessionId: args.session.id,
      title: args.session.title,
      patientName: args.session.patientName,
      mode: args.session.mode,
      startedAt: args.session.startedAt,
    })}`)
  }
  if (sourceSet.has("transcript")) {
    parts.push(
      `Transcript:\n${args.transcriptEntries.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n") || "(empty)"}`
    )
  }
  if (sourceSet.has("doctorNotes")) {
    parts.push(
      `Doctor notes:\n${args.notes.map((note) => note.content).filter(Boolean).join("\n") || "(empty)"}`
    )
  }
  if (sourceSet.has("insights")) {
    parts.push(`Insights:\n${JSON.stringify(args.session.insights ?? null)}`)
  }
  if (sourceSet.has("ddx")) {
    parts.push(`Differential diagnoses:\n${JSON.stringify(args.session.diagnoses ?? [])}`)
  }
  if (sourceSet.has("research")) {
    parts.push(
      `Research:\n${args.researchMessages.map((message) => `${message.role}: ${message.content}`).join("\n") || "(empty)"}`
    )
  }
  if (sourceSet.has("record")) {
    parts.push(`Consultation record:\n${JSON.stringify(args.session.record ?? null)}`)
  }
  if (sourceSet.has("patientHandout")) {
    parts.push(`Patient handout:\n${JSON.stringify(args.session.patientHandout ?? null)}`)
  }

  return parts.join("\n\n")
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

    const body = (await req.json().catch(() => ({}))) as { model?: string }
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
      return NextResponse.json({ error: "Only generic structured documents can be generated" }, { status: 400 })
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

    const [session, transcriptEntries, notes, researchMessages] =
      await Promise.all([
        prisma.session.findUniqueOrThrow({
          where: { id, userId: user.id },
          include: {
            insights: true,
            diagnoses: { orderBy: { sortOrder: "asc" } },
            record: true,
            patientHandout: true,
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
          select: { content: true },
        }),
        prisma.researchMessage.findMany({
          where: { sessionId: id },
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true },
        }),
      ])

    const schemaJson = activeVersion.schemaJson as {
      nodes: Array<Record<string, unknown>>
    }
    const generationConfig = normalizeDocumentGenerationConfig(
      activeVersion.generationConfigJson
    )

    // Ensure transcript is always available as a fallback context source
    // to prevent complete hallucinations due to empty insights on newly seeded templates
    if (!generationConfig.contextSources.includes("transcript")) {
      generationConfig.contextSources.push("transcript")
    }

    const model = getModel(modelId)
    const prompt = buildContextPrompt({
      session,
      transcriptEntries,
      notes,
      researchMessages,
      sessionDocumentTemplate: {
        title: sessionDocumentContext.template.title,
        description: sessionDocumentContext.template.description,
        language: sessionDocumentContext.template.language,
        region: sessionDocumentContext.template.region,
      },
      generationConfig,
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
            "INSTRUCTION: Base your extraction on the provided context (transcript, insights, notes). If specific medical conditions or treatments are not mentioned in the context, do not invent them. However, do your best to infer and summarize the available information into the requested schema fields.",
            generationConfig.systemInstructions || "",
          ]
            .filter(Boolean)
            .join("\n\n"),
          prompt,
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

    const normalizedContent = normalizeDocumentContentForStorage({
      nodes: schemaJson.nodes as never,
    }, generated)

    const sessionDocument = await upsertSessionDocument({
      sessionId: id,
      templateId,
      templateVersionId: activeVersion.id,
      contentJson: normalizedContent,
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
    logger.error("Failed to generate session document", error)
    return NextResponse.json(
      { error: "Failed to generate session document" },
      { status: 500 }
    )
  }
}
