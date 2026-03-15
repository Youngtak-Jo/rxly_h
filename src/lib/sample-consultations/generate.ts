import { generateObject, generateText } from "ai"
import { SCENARIOS } from "@/data/scenarios"
import { CLAUDE_MODEL } from "@/lib/anthropic"
import { getModel } from "@/lib/ai-provider"
import { buildGenerationOptions } from "@/lib/ai-request-options"
import {
  buildDdxSystemPrompt,
  buildDdxUserPrompt,
  parseDdxResponse,
} from "@/lib/ai/ddx-generator"
import {
  buildDiagnosticKeywordsPrompt,
  buildDiagnosticKeywordsSystemPrompt,
  parseDiagnosticKeywordsResponse,
} from "@/lib/ai/diagnostic-keywords-generator"
import {
  buildDocumentContextMessage,
  buildDocumentObjectSchema,
  normalizeGeneratedDocumentContent,
  normalizeStoredDocumentGenerationConfig,
} from "@/lib/ai/document-generator"
import {
  buildInsightsGenerationContent,
  buildInsightsSystemPrompt,
  parseInsightsResponse,
} from "@/lib/ai/insights-generator"
import {
  buildPatientHandoutPrompt,
  buildPatientHandoutSystemPrompt,
  normalizePatientHandoutResponse,
} from "@/lib/ai/patient-handout-generator"
import {
  buildRecordGenerationContent,
  buildRecordSystemPrompt,
  RECORD_OUTPUT_SCHEMA,
} from "@/lib/ai/record-generator"
import {
  buildResearchMessages,
  buildResearchSystemPrompt,
} from "@/lib/ai/research-generator"
import { SEEDED_PUBLIC_DOCUMENTS } from "@/lib/documents/seeded-public-documents"
import { genericStructuredContentToRichTextDocument } from "@/lib/documents/rich-text"
import { parseResearchCitations } from "@/lib/research-citations"
import {
  SAMPLE_CONSULTATION_SOURCE_CONFIG,
  SAMPLE_PUBLIC_TEMPLATE_IDS,
  type SampleConsultationSourceConfig,
} from "@/lib/sample-consultations/source-config"
import {
  SAMPLE_PACK_VERSION,
  type SampleArtifactMetadata,
  type SampleConsultationFixture,
  type SampleConsultationFixturePack,
  type SampleDiagnosisFixture,
  type SampleDocumentFixture,
  type SamplePatientHandoutFixture,
  type SampleRecordFixture,
  type SampleResearchExchangeFixture,
} from "@/lib/sample-consultations/types"
import type { ConnectorState, InsightsResponse } from "@/types/insights"
import type { ConsultationRecord } from "@/types/record"
import type { SelectedDiagnosisCondition } from "@/types/diagnosis-selection"
import type { DiagnosticKeyword } from "@/types/session"
import { DEFAULT_MODEL } from "@/lib/xai"
import { safeParseAIJson } from "@/lib/validations"

const ENABLED_CONNECTORS: ConnectorState = {
  pubmed: true,
  icd11: true,
  europe_pmc: true,
  openfda: true,
  clinical_trials: true,
  dailymed: true,
}

const PROMPT_FAMILIES = {
  insights: "insights",
  diagnosticKeywords: "diagnostic-keywords",
  ddx: "ddx",
  research: "research",
  record: "record",
  patientHandout: "patient-handout",
  document: "document",
} as const

const ARTIFACT_TIMEOUT_MS = 120_000

function logGeneration(message: string) {
  if (process.env.RXLY_SAMPLE_FIXTURE_VERBOSE === "1") {
    console.log(message)
  }
}

async function withTimeout<T>(
  label: string,
  promise: Promise<T>,
  timeoutMs = ARTIFACT_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Timed out while generating ${label}`))
        }, timeoutMs)
        if (typeof timer.unref === "function") {
          timer.unref()
        }
      }),
    ])
  } finally {
    if (timer) {
      clearTimeout(timer)
    }
  }
}

const PUBLIC_TEMPLATES = SAMPLE_PUBLIC_TEMPLATE_IDS.map((templateId) => {
  const template = SEEDED_PUBLIC_DOCUMENTS.find((candidate) => candidate.id === templateId)
  if (!template) {
    throw new Error(`Missing seeded public template: ${templateId}`)
  }

  return template
})

function findScenario(source: SampleConsultationSourceConfig) {
  const scenario = SCENARIOS.find((candidate) => candidate.id === source.scenarioId)
  if (!scenario) {
    throw new Error(`Scenario not found: ${source.scenarioId}`)
  }

  return scenario
}

function resolveSpeaker(rawSpeakerId: number): "DOCTOR" | "PATIENT" | "UNKNOWN" {
  if (rawSpeakerId === 0) return "DOCTOR"
  if (rawSpeakerId === 1) return "PATIENT"
  return "UNKNOWN"
}

function buildTranscriptContext(source: SampleConsultationSourceConfig) {
  const scenario = findScenario(source)
  const transcriptEntries = scenario.entries.map((entry) => ({
    speaker: resolveSpeaker(entry.rawSpeakerId),
    text: entry.text,
  }))

  return {
    scenario,
    transcriptEntries,
    transcriptText: transcriptEntries
      .map((entry) => `${entry.speaker}: ${entry.text}`)
      .join("\n"),
  }
}

function createArtifactMetadata(
  modelId: string,
  promptFamily: (typeof PROMPT_FAMILIES)[keyof typeof PROMPT_FAMILIES]
): SampleArtifactMetadata {
  return {
    modelId,
    promptFamily,
    generatedAt: new Date().toISOString(),
  }
}

function normalizeChecklistItems(response: InsightsResponse) {
  return response.checklist.map((item) => ({
    label: item.label,
    isChecked: item.checked,
    isAutoChecked: item.checked,
    doctorNote: null,
    source: "AI" as const,
  }))
}

function normalizeRecordFixture(args: {
  source: SampleConsultationSourceConfig
  generatedAt: string
  parsed: unknown
}): SampleRecordFixture {
  const parsed = args.parsed as Record<string, unknown>

  return {
    date: args.source.startedAt,
    patientName: args.source.patientName,
    chiefComplaint:
      typeof parsed.chiefComplaint === "string" ? parsed.chiefComplaint : null,
    hpiText: typeof parsed.hpiText === "string" ? parsed.hpiText : null,
    medications: Array.isArray(parsed.medications)
      ? parsed.medications.filter((value): value is string => typeof value === "string").join("\n")
      : typeof parsed.medications === "string"
        ? parsed.medications
        : null,
    rosText: typeof parsed.rosText === "string" ? parsed.rosText : null,
    pmh: typeof parsed.pmh === "string" ? parsed.pmh : null,
    socialHistory:
      typeof parsed.socialHistory === "string" ? parsed.socialHistory : null,
    familyHistory:
      typeof parsed.familyHistory === "string" ? parsed.familyHistory : null,
    vitals:
      parsed.vitals && typeof parsed.vitals === "object"
        ? (parsed.vitals as ConsultationRecord["vitals"])
        : null,
    physicalExam:
      typeof parsed.physicalExam === "string" ? parsed.physicalExam : null,
    labsStudies: Array.isArray(parsed.labsStudies)
      ? parsed.labsStudies
          .filter((value): value is string => typeof value === "string")
          .join("\n")
      : typeof parsed.labsStudies === "string"
        ? parsed.labsStudies
        : null,
    assessment: Array.isArray(parsed.assessment)
      ? parsed.assessment
          .filter((value): value is string => typeof value === "string")
          .map((value, index) => `${index + 1}. ${value}`)
          .join("\n")
      : typeof parsed.assessment === "string"
        ? parsed.assessment
        : null,
    plan: typeof parsed.plan === "string" ? parsed.plan : null,
    metadata: {
      modelId: DEFAULT_MODEL,
      promptFamily: PROMPT_FAMILIES.record,
      generatedAt: args.generatedAt,
    },
  }
}

function buildConfirmedDiagnosisSelection(
  source: SampleConsultationSourceConfig,
  diagnoses: SampleDiagnosisFixture[]
): SelectedDiagnosisCondition[] {
  const diseaseNameMatchers: Record<string, RegExp> = {
    "chest-pain": /angina|ischemic|coronary/i,
    diabetes: /diabetes/i,
    "low-back-pain": /back pain|lumbar|strain|sprain|mechanical/i,
  }

  const preferredDiagnosis =
    diagnoses.find((diagnosis) =>
      diseaseNameMatchers[source.key]?.test(diagnosis.diseaseName)
    ) ?? diagnoses[0]

  if (!preferredDiagnosis) {
    throw new Error(`No diagnoses generated for sample ${source.key}`)
  }

  return [
    {
      id: `${source.key}:${preferredDiagnosis.icdCode}`,
      icdCode: preferredDiagnosis.icdCode,
      diseaseName: preferredDiagnosis.diseaseName,
      source: "ddx",
    },
  ]
}

async function generateInsightsArtifact(args: {
  transcriptText: string
}): Promise<{
  response: InsightsResponse
  diagnosticKeywords: DiagnosticKeyword[]
  metadata: SampleArtifactMetadata
}> {
  const metadata = createArtifactMetadata(DEFAULT_MODEL, PROMPT_FAMILIES.insights)
  const [insightsResult, diagnosticKeywordsResult] = await Promise.all([
    withTimeout(
      "insights",
      generateText({
        model: getModel(DEFAULT_MODEL),
        system: buildInsightsSystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildInsightsGenerationContent({
              transcript: args.transcriptText,
              currentInsights: {
                summary: "",
                keyFindings: [],
                redFlags: [],
                checklistItems: [],
              },
            }),
          },
        ],
        ...buildGenerationOptions(DEFAULT_MODEL, { temperature: 0.3 }),
      })
    ),
    withTimeout(
      "diagnostic keywords",
      generateText({
        model: getModel(DEFAULT_MODEL),
        system: buildDiagnosticKeywordsSystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildDiagnosticKeywordsPrompt(args.transcriptText),
          },
        ],
        ...buildGenerationOptions(DEFAULT_MODEL, {
          temperature: 0.1,
          maxOutputTokens: 1000,
        }),
      })
    ),
  ])

  return {
    response: parseInsightsResponse(insightsResult.text),
    diagnosticKeywords: parseDiagnosticKeywordsResponse(diagnosticKeywordsResult.text),
    metadata,
  }
}

async function generateDiagnosesArtifact(args: {
  transcriptText: string
  insights: InsightsResponse
}): Promise<SampleDiagnosisFixture[]> {
  const prompt = await withTimeout(
    "differential diagnosis context",
    buildDdxUserPrompt(
      {
        transcript: args.transcriptText,
        doctorNotes: "",
        currentInsights: {
          summary: args.insights.summary,
          keyFindings: args.insights.keyFindings,
          redFlags: args.insights.redFlags,
        },
        enabledConnectors: ENABLED_CONNECTORS,
      },
      CLAUDE_MODEL
    )
  )

  const result = await withTimeout(
    "differential diagnosis",
    generateText({
      model: getModel(CLAUDE_MODEL),
      system: buildDdxSystemPrompt(),
      prompt,
      ...buildGenerationOptions(CLAUDE_MODEL, { temperature: 0.3 }),
    })
  )

  return parseDdxResponse(result.text).slice(0, 3)
}

async function generateRecordArtifact(args: {
  source: SampleConsultationSourceConfig
  transcriptText: string
  insights: InsightsResponse
}): Promise<SampleRecordFixture> {
  const generatedAt = new Date().toISOString()
  const result = await withTimeout(
    "consultation record",
    generateObject({
      model: getModel(DEFAULT_MODEL),
      schema: RECORD_OUTPUT_SCHEMA,
      system: buildRecordSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildRecordGenerationContent({
            transcript: args.transcriptText,
            doctorNotes: "",
            insights: {
              summary: args.insights.summary,
              keyFindings: args.insights.keyFindings,
              redFlags: args.insights.redFlags,
            },
          }),
        },
      ],
      ...buildGenerationOptions(DEFAULT_MODEL, { temperature: 0.2 }),
    })
  )

  return normalizeRecordFixture({
    source: args.source,
    generatedAt,
    parsed: result.object,
  })
}

async function generatePatientHandoutArtifact(args: {
  transcriptText: string
  insights: InsightsResponse
  diagnoses: SampleDiagnosisFixture[]
  selectedConditions: SelectedDiagnosisCondition[]
}): Promise<SamplePatientHandoutFixture> {
  const metadata = createArtifactMetadata(
    DEFAULT_MODEL,
    PROMPT_FAMILIES.patientHandout
  )
  const result = await withTimeout(
    "patient handout",
    generateText({
      model: getModel(DEFAULT_MODEL),
      system: buildPatientHandoutSystemPrompt(),
      prompt: buildPatientHandoutPrompt({
        transcript: args.transcriptText,
        insights: {
          summary: args.insights.summary,
          keyFindings: args.insights.keyFindings,
          redFlags: args.insights.redFlags,
        },
        diagnoses: args.diagnoses,
        selectedConditions: args.selectedConditions,
        language: "en",
      }),
      ...buildGenerationOptions(DEFAULT_MODEL, { temperature: 0.2 }),
    })
  )

  const parsedResult = safeParseAIJson<{
    language?: string
    conditions?: unknown
    entries?: unknown
  }>(result.text)
  if (parsedResult.error || !parsedResult.data) {
    throw new Error("Invalid patient handout response format")
  }

  const normalized = normalizePatientHandoutResponse(
    args.selectedConditions,
    parsedResult.data
  )

  return {
    ...normalized,
    generatedAt: metadata.generatedAt,
    metadata,
  }
}

async function generateResearchArtifacts(args: {
  source: SampleConsultationSourceConfig
  insights: InsightsResponse
}): Promise<SampleResearchExchangeFixture[]> {
  const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
  const research: SampleResearchExchangeFixture[] = []

  for (const [index, question] of args.source.researchQuestions.entries()) {
    logGeneration(`[${args.source.key}] research question ${index + 1}/3`)
    const metadata = createArtifactMetadata(CLAUDE_MODEL, PROMPT_FAMILIES.research)
    const messages = await withTimeout(
      `research context: ${question}`,
      buildResearchMessages(
        {
          question,
          conversationHistory,
          enabledConnectors: ENABLED_CONNECTORS,
          insightsContext: {
            summary: args.insights.summary,
            keyFindings: args.insights.keyFindings,
            redFlags: args.insights.redFlags,
          },
        },
        CLAUDE_MODEL
      )
    )

    const result = await withTimeout(
      `research question: ${question}`,
      generateText({
        model: getModel(CLAUDE_MODEL),
        system: buildResearchSystemPrompt(question),
        messages,
        ...buildGenerationOptions(CLAUDE_MODEL, { temperature: 0.3 }),
      })
    )
    const answer = result.text.trim()

    research.push({
      question,
      answer,
      citations: parseResearchCitations(answer),
      metadata,
    })

    conversationHistory.push({ role: "user", content: question })
    conversationHistory.push({ role: "assistant", content: answer })
  }

  return research
}

async function generateDocumentArtifacts(args: {
  source: SampleConsultationSourceConfig
  transcriptEntries: Array<{ speaker: string; text: string }>
  insights: InsightsResponse
  diagnosticKeywords: DiagnosticKeyword[]
  selectedConditions: SelectedDiagnosisCondition[]
}): Promise<SampleDocumentFixture[]> {
  const session = {
    id: `sample:${args.source.key}`,
    title: args.source.sessionTitle,
    patientName: args.source.patientName,
    mode: "DOCTOR",
    startedAt: new Date(args.source.startedAt),
    insights: {
      summary: args.insights.summary,
      keyFindings: args.insights.keyFindings,
      redFlags: args.insights.redFlags,
      diagnosticKeywords: args.diagnosticKeywords,
    },
  }

  const generationInputs = {
    clinicalContextMode: null,
    confirmedDiagnoses: args.selectedConditions,
  }

  const documents = await Promise.all(
    PUBLIC_TEMPLATES.map(async (template) => {
      const generationConfig = normalizeStoredDocumentGenerationConfig(
        template.generationConfig
      )
      const metadata = createArtifactMetadata(DEFAULT_MODEL, PROMPT_FAMILIES.document)
      const schemaJson = template.schema as unknown as {
        nodes: Array<Record<string, unknown>>
      }
      const result = await withTimeout(
        `document: ${template.id}`,
        generateObject({
          model: getModel(DEFAULT_MODEL),
          schema: buildDocumentObjectSchema(schemaJson),
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
              content: buildDocumentContextMessage({
                session,
                transcriptEntries: args.transcriptEntries,
                doctorNotesText: "",
                generationInputs,
                sessionDocumentTemplate: {
                  title: template.title,
                  description: template.description,
                  category: template.category,
                  language: template.language ?? "en",
                  region: template.region ?? "global",
                },
                generationConfig,
                uploadedImages: [],
              }),
            },
          ],
          ...buildGenerationOptions(DEFAULT_MODEL, { temperature: 0.2 }),
        })
      )

      const normalizedContent = normalizeGeneratedDocumentContent({
        schemaJson,
        generated: result.object as Record<string, unknown>,
      })
      const richTextDocument = genericStructuredContentToRichTextDocument({
        contentJson: normalizedContent,
        schemaNodes: schemaJson.nodes as never,
      })

      return {
        templateId: template.id,
        title: null,
        contentJson: JSON.parse(JSON.stringify(richTextDocument)) as Record<
          string,
          unknown
        >,
        generationInputs,
        metadata,
      } satisfies SampleDocumentFixture
    })
  )

  return documents
}

export async function generateSampleConsultationFixture(
  source: SampleConsultationSourceConfig
): Promise<SampleConsultationFixture> {
  const { transcriptEntries, transcriptText } = buildTranscriptContext(source)
  logGeneration(`[${source.key}] generating insights`)
  const {
    response: insights,
    diagnosticKeywords,
    metadata: insightsMetadata,
  } = await generateInsightsArtifact({
    transcriptText,
  })
  logGeneration(`[${source.key}] generating differential diagnosis`)
  const diagnoses = await generateDiagnosesArtifact({
    transcriptText,
    insights,
  })
  const selectedConditions = buildConfirmedDiagnosisSelection(source, diagnoses)
  logGeneration(`[${source.key}] generating consultation record`)
  const record = await generateRecordArtifact({
    source,
    transcriptText,
    insights,
  })
  logGeneration(`[${source.key}] generating patient handout`)
  const patientHandout = await generatePatientHandoutArtifact({
    transcriptText,
    insights,
    diagnoses,
    selectedConditions,
  })
  logGeneration(`[${source.key}] generating research trace`)
  const research = await generateResearchArtifacts({
    source,
    insights,
  })
  logGeneration(`[${source.key}] generating documents`)
  const documents = await generateDocumentArtifacts({
    source,
    transcriptEntries,
    insights,
    diagnosticKeywords,
    selectedConditions,
  })

  return {
    key: source.key,
    scenarioId: source.scenarioId,
    sessionTitle: source.sessionTitle,
    patientName: source.patientName,
    startedAt: source.startedAt,
    insights: {
      summary: insights.summary,
      keyFindings: insights.keyFindings,
      redFlags: insights.redFlags,
      diagnosticKeywords,
      checklistItems: normalizeChecklistItems(insights),
      metadata: insightsMetadata,
    },
    diagnoses,
    research,
    record,
    patientHandout,
    documents,
  }
}

export async function buildSampleConsultationFixturePack(): Promise<SampleConsultationFixturePack> {
  const samples: SampleConsultationFixture[] = []

  for (const source of SAMPLE_CONSULTATION_SOURCE_CONFIG) {
    samples.push(await generateSampleConsultationFixture(source))
  }

  return {
    version: SAMPLE_PACK_VERSION,
    generatedAt: new Date().toISOString(),
    samples,
  }
}
