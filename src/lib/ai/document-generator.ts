import type { UserContent } from "ai"
import {
  createEmptySessionDocumentGenerationInputs,
  resolveAutomaticClinicalContext,
} from "@/lib/documents/generation-config"
import {
  buildDocumentContentSchema,
  normalizeDocumentContentForStorage,
  normalizeStoredDocumentGenerationConfig,
  sessionDocumentGenerationInputsSchema,
} from "@/lib/documents/schema"
import type {
  DocumentGenerationConfig,
  SessionDocumentGenerationInputs,
} from "@/types/document"

export type SessionWithDocumentContext = {
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

export type TranscriptContextEntry = {
  speaker: string
  text: string
}

export type NoteContextEntry = {
  content: string
  imageUrls: unknown
  storagePaths: unknown
  createdAt: Date
}

export type UploadedImageEntry = {
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

export function buildDoctorNotesText(notes: NoteContextEntry[]): string {
  return notes
    .map((note) => note.content.trim())
    .filter(Boolean)
    .join("\n")
}

function buildTranscriptText(transcriptEntries: TranscriptContextEntry[]): string {
  return transcriptEntries.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n")
}

export function insightsHaveContent(session: SessionWithDocumentContext) {
  return (
    !!session.insights &&
    (session.insights.summary.trim().length > 0 ||
      hasNonEmptyArray(session.insights.keyFindings) ||
      hasNonEmptyArray(session.insights.redFlags) ||
      hasNonEmptyArray(session.insights.diagnosticKeywords))
  )
}

export function buildUploadedImageCandidates(
  notes: NoteContextEntry[]
): UploadedImageEntry[] {
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

export function buildDocumentContextMessage(args: {
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
}): UserContent {
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
    `Document title: ${args.sessionDocumentTemplate.title}`,
    `Description: ${args.sessionDocumentTemplate.description}`,
    `Document category: ${args.sessionDocumentTemplate.category}`,
    `Document language: ${args.sessionDocumentTemplate.language}`,
    `Document region: ${args.sessionDocumentTemplate.region}`,
    `Empty value policy: ${args.generationConfig.emptyValuePolicy}`,
    `Clinical basis: ${clinicalBasisLabel}`,
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
    args.uploadedImages.forEach((image) => {
      content.push({
        type: "image",
        image: new URL(image.resolvedUrl),
      })
    })
  }

  return content
}

export function resolveDocumentGenerationInputs(
  generationInputs: unknown,
  fallbackGenerationInputs: SessionDocumentGenerationInputs | null | undefined
) {
  const parsed =
    generationInputs !== undefined
      ? sessionDocumentGenerationInputsSchema.nullable().safeParse(generationInputs)
      : null

  if (parsed && !parsed.success) {
    return {
      error: "Invalid document generation inputs",
      effectiveGenerationInputs: null,
    }
  }

  return {
    error: null,
    effectiveGenerationInputs:
      parsed && parsed.success
        ? parsed.data ?? createEmptySessionDocumentGenerationInputs()
        : fallbackGenerationInputs ?? createEmptySessionDocumentGenerationInputs(),
  }
}

export function normalizeGeneratedDocumentContent(args: {
  schemaJson: { nodes: Array<Record<string, unknown>> }
  generated: Record<string, unknown>
}) {
  return normalizeDocumentContentForStorage(
    {
      nodes: args.schemaJson.nodes as never,
    },
    args.generated
  )
}

export function buildDocumentObjectSchema(schemaJson: {
  nodes: Array<Record<string, unknown>>
}) {
  return buildDocumentContentSchema(schemaJson as never)
}

export { normalizeStoredDocumentGenerationConfig }
