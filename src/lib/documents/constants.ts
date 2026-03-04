import type {
  DocumentGenerationConfig,
  DocumentTemplateRenderer,
  DocumentTemplateSchema,
  InstalledDocumentSummary,
  WorkspaceTabId,
} from "@/types/document"

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
  iconKey: string
  category: string
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
    iconKey: "file-text",
    category: "documentation",
    schema: EMPTY_SCHEMA,
    generationConfig: EMPTY_GENERATION_CONFIG,
  },
  {
    id: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
    slug: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
    title: "Patient Handout",
    description: "Create patient-friendly handouts that explain diagnoses and follow-up guidance.",
    renderer: "BUILT_IN_PATIENT_HANDOUT",
    iconKey: "receipt-text",
    category: "patient-education",
    schema: EMPTY_SCHEMA,
    generationConfig: {
      ...EMPTY_GENERATION_CONFIG,
      audience: "patient",
      outputTone: "plain-language",
      contextSources: ["transcript", "doctorNotes", "insights", "ddx"],
    },
  },
]

export const DEFAULT_DOCUMENT_TEMPLATE_IDS = BUILT_IN_DOCUMENTS.map(
  (document) => document.id
)

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
