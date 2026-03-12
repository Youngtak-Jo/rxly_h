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
import { createDocumentGenerationConfig } from "@/lib/documents/generation-config"
import { buildConfirmedDiagnosisRequirement } from "@/lib/documents/generation-requirements"

export const BUILT_IN_RECORD_TEMPLATE_ID = "record"
export const BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID = "patient-handout"
export const BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID = "blank-document"
export const DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY = "default"

export const SYSTEM_WORKSPACE_TAB_IDS = [
  "insights",
  "ddx",
  "documents",
  "research",
] as const

export const DEFAULT_WORKSPACE_TAB_ORDER: WorkspaceTabId[] = [
  "insights",
  "ddx",
  "documents",
  "research",
  `document:${BUILT_IN_RECORD_TEMPLATE_ID}`,
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
  hiddenInCatalog?: boolean
  schema: DocumentTemplateSchema
  generationConfig: DocumentGenerationConfig
}

const BUILT_IN_RECORD_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    {
      key: "patient_name",
      label: "Patient Name",
      helpText: "Patient name when it is known from the current consultation.",
      required: false,
      placeholder: "",
      type: "shortText",
    },
    {
      key: "chief_complaint",
      label: "Chief Complaint",
      helpText: "Primary reason for the visit in clinician-facing language.",
      required: false,
      placeholder: "",
      type: "longText",
    },
    {
      key: "hpi_text",
      label: "History of Present Illness",
      helpText: "Chronologic HPI based on the consultation context.",
      required: false,
      placeholder: "",
      type: "longText",
    },
    {
      key: "principal_diagnosis",
      label: "Confirmed Diagnoses",
      helpText:
        "List clinician-confirmed diagnoses when they are available or selected.",
      required: false,
      placeholder: "",
      type: "stringList",
    },
    {
      key: "medications",
      label: "Medications",
      helpText: "Medication list discussed during the visit.",
      required: false,
      placeholder: "",
      type: "stringList",
    },
    {
      key: "ros_text",
      label: "Review of Systems",
      helpText: "Relevant review-of-systems details for the encounter.",
      required: false,
      placeholder: "",
      type: "longText",
    },
    {
      key: "pmh",
      label: "Past Medical History",
      helpText: "Pertinent past medical history for the visit.",
      required: false,
      placeholder: "",
      type: "longText",
    },
    {
      key: "social_history",
      label: "Social History",
      helpText: "Relevant social history items that affect assessment or plan.",
      required: false,
      placeholder: "",
      type: "longText",
    },
    {
      key: "family_history",
      label: "Family History",
      helpText: "Relevant family history items for the visit.",
      required: false,
      placeholder: "",
      type: "longText",
    },
    {
      key: "vitals",
      label: "Vitals",
      helpText: "Structured vital signs when they are available.",
      required: false,
      placeholder: "",
      type: "group",
      children: [
        {
          key: "bp",
          label: "Blood Pressure",
          helpText: "",
          required: false,
          placeholder: "",
          type: "shortText",
        },
        {
          key: "hr",
          label: "Heart Rate",
          helpText: "",
          required: false,
          placeholder: "",
          type: "shortText",
        },
        {
          key: "temp",
          label: "Temperature",
          helpText: "",
          required: false,
          placeholder: "",
          type: "shortText",
        },
        {
          key: "rr",
          label: "Respiratory Rate",
          helpText: "",
          required: false,
          placeholder: "",
          type: "shortText",
        },
        {
          key: "spo2",
          label: "SpO2",
          helpText: "",
          required: false,
          placeholder: "",
          type: "shortText",
        },
      ],
    },
    {
      key: "physical_exam",
      label: "Physical Examination",
      helpText: "Pertinent exam findings.",
      required: false,
      placeholder: "",
      type: "longText",
    },
    {
      key: "labs_studies",
      label: "Labs and Studies",
      helpText: "Studies, labs, or imaging findings discussed during the visit.",
      required: false,
      placeholder: "",
      type: "stringList",
    },
    {
      key: "assessment",
      label: "Assessment",
      helpText: "Ordered list of key assessment points.",
      required: false,
      placeholder: "",
      type: "stringList",
    },
    {
      key: "plan",
      label: "Plan",
      helpText: "Follow-up, treatment, and next-step plan.",
      required: false,
      placeholder: "",
      type: "longText",
    },
  ],
}

const BUILT_IN_RECORD_GENERATION_CONFIG: DocumentGenerationConfig =
  createDocumentGenerationConfig({
    includeSourceImages: true,
    emptyValuePolicy: "NOT_PROVIDED",
    systemInstructions:
      "Generate a clinician-facing consultation record. Use standard medical documentation language. When confirmed diagnoses are selected, reflect them in the record without inventing unsupported findings.",
    generationRequirements: [
      buildConfirmedDiagnosisRequirement({
        required: false,
        selectionMode: "multiple",
        allowIcd11Search: true,
      }),
    ],
  })

const BUILT_IN_PATIENT_HANDOUT_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    {
      key: "conditions",
      label: "Conditions",
      helpText:
        "Repeat one section per confirmed diagnosis selected for the handout.",
      required: false,
      placeholder: "",
      type: "repeatableGroup",
      itemLabel: "Condition",
      children: [
        {
          key: "diagnosis_name",
          label: "Diagnosis Name",
          helpText: "Human-readable diagnosis name for this handout section.",
          required: true,
          placeholder: "",
          type: "shortText",
        },
        {
          key: "diagnosis_codes",
          label: "Diagnosis Code",
          helpText: "ICD or diagnosis code when it is available.",
          required: false,
          placeholder: "",
          type: "shortText",
        },
        {
          key: "condition_overview",
          label: "Condition Overview",
          helpText: "Patient-friendly overview of the condition.",
          required: false,
          placeholder: "",
          type: "longText",
        },
        {
          key: "signs_symptoms",
          label: "Signs and Symptoms",
          helpText: "Common signs or symptoms patients should understand.",
          required: false,
          placeholder: "",
          type: "longText",
        },
        {
          key: "causes_risk_factors",
          label: "Causes and Risk Factors",
          helpText: "Common causes or risk factors in patient-friendly language.",
          required: false,
          placeholder: "",
          type: "longText",
        },
        {
          key: "complications",
          label: "Complications",
          helpText: "Important complications or worsening patterns to know.",
          required: false,
          placeholder: "",
          type: "longText",
        },
        {
          key: "treatment_options",
          label: "Treatment Options",
          helpText: "Treatment and self-care guidance appropriate for the patient.",
          required: false,
          placeholder: "",
          type: "longText",
        },
        {
          key: "when_to_seek_help",
          label: "When to Seek Help",
          helpText: "Clear return precautions and urgent warning signs.",
          required: false,
          placeholder: "",
          type: "longText",
        },
        {
          key: "additional_advice_follow_up",
          label: "Additional Advice and Follow-Up",
          helpText: "Follow-up instructions and practical advice for the patient.",
          required: false,
          placeholder: "",
          type: "longText",
        },
        {
          key: "disclaimer",
          label: "Disclaimer",
          helpText: "Short patient-facing disclaimer when appropriate.",
          required: false,
          placeholder: "",
          type: "longText",
        },
      ],
    },
  ],
}

const BUILT_IN_PATIENT_HANDOUT_GENERATION_CONFIG: DocumentGenerationConfig =
  createDocumentGenerationConfig({
    emptyValuePolicy: "NOT_PROVIDED",
    systemInstructions:
      "Generate a patient-facing handout in clear language. Keep tone supportive, specific, and easy to understand. Each selected diagnosis should get its own section.",
    generationRequirements: [
      buildConfirmedDiagnosisRequirement({
        required: true,
        selectionMode: "multiple",
        allowIcd11Search: true,
      }),
    ],
  })

const BUILT_IN_BLANK_DOCUMENT_SCHEMA: DocumentTemplateSchema = {
  nodes: [],
}

const BUILT_IN_BLANK_DOCUMENT_GENERATION_CONFIG: DocumentGenerationConfig =
  createDocumentGenerationConfig({
    includeSourceImages: false,
    emptyValuePolicy: "BLANK",
    systemInstructions:
      "Create or revise a flexible freeform rich-text document for the current consultation.",
    generationRequirements: [],
  })

export const BUILT_IN_DOCUMENTS: BuiltInDocumentDefinition[] = [
  {
    id: BUILT_IN_RECORD_TEMPLATE_ID,
    slug: BUILT_IN_RECORD_TEMPLATE_ID,
    title: "Consultation Record",
    description: "Generate and edit a structured visit note for the current consultation.",
    renderer: "GENERIC_STRUCTURED",
    category: "clinical-documentation",
    language: DEFAULT_DOCUMENT_LANGUAGE,
    region: DEFAULT_DOCUMENT_REGION,
    authorName: "Rxly",
    featuredInstallCount: 1248,
    schema: BUILT_IN_RECORD_SCHEMA,
    generationConfig: BUILT_IN_RECORD_GENERATION_CONFIG,
  },
  {
    id: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
    slug: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
    title: "Patient Handout",
    description: "Create patient-friendly handouts that explain diagnoses and follow-up guidance.",
    renderer: "GENERIC_STRUCTURED",
    category: "patient-education",
    language: DEFAULT_DOCUMENT_LANGUAGE,
    region: DEFAULT_DOCUMENT_REGION,
    authorName: "Rxly",
    featuredInstallCount: 982,
    schema: BUILT_IN_PATIENT_HANDOUT_SCHEMA,
    generationConfig: BUILT_IN_PATIENT_HANDOUT_GENERATION_CONFIG,
  },
  {
    id: BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID,
    slug: BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID,
    title: "Blank Document",
    description: "Hidden internal template for session-only blank documents.",
    renderer: "GENERIC_STRUCTURED",
    category: "general",
    language: DEFAULT_DOCUMENT_LANGUAGE,
    region: DEFAULT_DOCUMENT_REGION,
    authorName: "Rxly",
    featuredInstallCount: 0,
    hiddenInCatalog: true,
    schema: BUILT_IN_BLANK_DOCUMENT_SCHEMA,
    generationConfig: BUILT_IN_BLANK_DOCUMENT_GENERATION_CONFIG,
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
).filter((templateId) => templateId !== BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID)

export const HIDDEN_BUILT_IN_DOCUMENT_TEMPLATE_IDS = BUILT_IN_DOCUMENTS
  .filter((document) => document.hiddenInCatalog)
  .map((document) => document.id)

export function isHiddenBuiltInDocumentTemplateId(templateId: string): boolean {
  return HIDDEN_BUILT_IN_DOCUMENT_TEMPLATE_IDS.includes(templateId)
}

export function isBlankDocumentTemplateId(templateId: string): boolean {
  return templateId === BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID
}

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
