import type {
  DocumentGenerationConfig,
  DocumentTemplateLanguage,
  DocumentTemplateRegion,
  DocumentTemplateRenderer,
  DocumentTemplateSchema,
  InstalledDocumentSummary,
  WorkspaceTabId,
} from "@/types/document"
import {
  DEFAULT_DOCUMENT_LANGUAGE,
  DEFAULT_DOCUMENT_REGION,
} from "@/lib/documents/language-region"
import type { UiLocale } from "@/i18n/config"

export const BUILT_IN_RECORD_TEMPLATE_ID = "record"
export const BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID = "patient-handout"

export const SYSTEM_WORKSPACE_TAB_IDS = [
  "insights",
  "ddx",
  "research",
] as const

export const DEFAULT_WORKSPACE_TAB_ORDER: WorkspaceTabId[] = [
  "insights",
  "ddx",
  `document:${BUILT_IN_RECORD_TEMPLATE_ID}`,
  "research",
  `document:${BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID}`,
]

export interface BuiltInDocumentDefinition {
  id: string
  slug: string
  title: string
  description: string
  renderer: DocumentTemplateRenderer
  category: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
  authorName?: string
  featuredInstallCount?: number
  schema: DocumentTemplateSchema
  generationConfig: DocumentGenerationConfig
}

const EMPTY_SCHEMA: DocumentTemplateSchema = {
  nodes: [],
}

const EMPTY_GENERATION_CONFIG: DocumentGenerationConfig = {
  audience: "clinician",
  outputTone: "clinical",
  contextSources: ["transcript", "doctorNotes", "insights"],
  systemInstructions: "",
  emptyValuePolicy: "NOT_PROVIDED",
}

export const BUILT_IN_DOCUMENTS: BuiltInDocumentDefinition[] = [
  {
    id: BUILT_IN_RECORD_TEMPLATE_ID,
    slug: BUILT_IN_RECORD_TEMPLATE_ID,
    title: "Consultation Record",
    description: "Generate and edit a structured visit note for the current consultation.",
    renderer: "BUILT_IN_RECORD",
    category: "clinical-documentation",
    language: DEFAULT_DOCUMENT_LANGUAGE,
    region: DEFAULT_DOCUMENT_REGION,
    authorName: "Rxly",
    featuredInstallCount: 1248,
    schema: EMPTY_SCHEMA,
    generationConfig: EMPTY_GENERATION_CONFIG,
  },
  {
    id: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
    slug: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
    title: "Patient Handout",
    description: "Create patient-friendly handouts that explain diagnoses and follow-up guidance.",
    renderer: "BUILT_IN_PATIENT_HANDOUT",
    category: "patient-education",
    language: DEFAULT_DOCUMENT_LANGUAGE,
    region: DEFAULT_DOCUMENT_REGION,
    authorName: "Rxly",
    featuredInstallCount: 982,
    schema: EMPTY_SCHEMA,
    generationConfig: {
      ...EMPTY_GENERATION_CONFIG,
      audience: "patient",
      outputTone: "plain-language",
      contextSources: ["transcript", "doctorNotes", "insights", "ddx"],
    },
  },
]

const BUILT_IN_DOCUMENT_DISPLAY_METADATA: Record<
  string,
  Record<
    UiLocale,
    {
      title: string
      description: string
    }
  >
> = {
  [BUILT_IN_RECORD_TEMPLATE_ID]: {
    en: {
      title: "Consultation Record",
      description:
        "Generate and edit a structured visit note for the current consultation.",
    },
    ko: {
      title: "진료 기록",
      description:
        "현재 상담 내용을 바탕으로 구조화된 진료 기록을 생성하고 수정합니다.",
    },
  },
  [BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID]: {
    en: {
      title: "Patient Handout",
      description:
        "Create patient-friendly handouts that explain diagnoses and follow-up guidance.",
    },
    ko: {
      title: "환자 안내문",
      description:
        "진단 내용과 추적 관리 계획을 환자 친화적인 안내문으로 생성합니다.",
    },
  },
}

export const DEFAULT_DOCUMENT_TEMPLATE_IDS = BUILT_IN_DOCUMENTS.map(
  (document) => document.id
)

export function getBuiltInDocumentDisplayMetadata(
  templateId: string,
  locale: UiLocale
): {
  title: string
  description: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
} | null {
  const localized = BUILT_IN_DOCUMENT_DISPLAY_METADATA[templateId]?.[locale]
  if (!localized) return null

  return {
    title: localized.title,
    description: localized.description,
    language: locale,
    region: DEFAULT_DOCUMENT_REGION,
  }
}

export function buildDocumentTabId(templateId: string): `document:${string}` {
  return `document:${templateId}`
}

export function getTemplateIdFromTabId(tabId: WorkspaceTabId): string | null {
  return tabId.startsWith("document:") ? tabId.slice("document:".length) : null
}

export function isDocumentTabId(tabId: string): tabId is `document:${string}` {
  return tabId.startsWith("document:")
}

export function isSystemWorkspaceTabId(
  tabId: string
): tabId is (typeof SYSTEM_WORKSPACE_TAB_IDS)[number] {
  return (SYSTEM_WORKSPACE_TAB_IDS as readonly string[]).includes(tabId)
}

export function createDefaultTabOrder(
  installedDocuments: InstalledDocumentSummary[]
): WorkspaceTabId[] {
  const installedDocumentIds = new Set(
    installedDocuments.map((document) => document.templateId)
  )
  const seeded = DEFAULT_WORKSPACE_TAB_ORDER.filter((tabId) => {
    const templateId = getTemplateIdFromTabId(tabId)
    return templateId ? installedDocumentIds.has(templateId) : true
  })
  const remaining = installedDocuments
    .map((document) => buildDocumentTabId(document.templateId))
    .filter((tabId) => !seeded.includes(tabId))

  return [...seeded, ...remaining]
}
