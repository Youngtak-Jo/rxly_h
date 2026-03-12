import type { SelectedDiagnosisCondition } from "@/types/diagnosis-selection"

export const DOCUMENT_TEMPLATE_SOURCE_KINDS = ["BUILT_IN", "USER"] as const
export type DocumentTemplateSourceKind =
  (typeof DOCUMENT_TEMPLATE_SOURCE_KINDS)[number]

export const DOCUMENT_TEMPLATE_RENDERERS = [
  "BUILT_IN_RECORD",
  "BUILT_IN_PATIENT_HANDOUT",
  "GENERIC_STRUCTURED",
] as const
export type DocumentTemplateRenderer =
  (typeof DOCUMENT_TEMPLATE_RENDERERS)[number]

export const DOCUMENT_TEMPLATE_VISIBILITIES = ["PRIVATE", "PUBLIC"] as const
export type DocumentTemplateVisibility =
  (typeof DOCUMENT_TEMPLATE_VISIBILITIES)[number]

export const DOCUMENT_TEMPLATE_LANGUAGES = ["en", "ko"] as const
export type DocumentTemplateLanguage =
  (typeof DOCUMENT_TEMPLATE_LANGUAGES)[number]

export const DOCUMENT_TEMPLATE_REGIONS = ["global", "kr", "us"] as const
export type DocumentTemplateRegion =
  (typeof DOCUMENT_TEMPLATE_REGIONS)[number]

export const DOCUMENT_TEMPLATE_VERSION_STATUSES = [
  "DRAFT",
  "PUBLISHED",
] as const
export type DocumentTemplateVersionStatus =
  (typeof DOCUMENT_TEMPLATE_VERSION_STATUSES)[number]

export const DOCUMENT_FIELD_TYPES = [
  "shortText",
  "longText",
  "stringList",
] as const
export type DocumentFieldType = (typeof DOCUMENT_FIELD_TYPES)[number]

export const DOCUMENT_GROUP_TYPES = ["group", "repeatableGroup"] as const
export type DocumentGroupType = (typeof DOCUMENT_GROUP_TYPES)[number]

export type DocumentSchemaNodeType = DocumentFieldType | DocumentGroupType

interface DocumentSchemaNodeBase {
  key: string
  label: string
  helpText: string
  required: boolean
  placeholder: string
}

export interface DocumentFieldNode extends DocumentSchemaNodeBase {
  type: DocumentFieldType
}

export interface DocumentGroupNode extends DocumentSchemaNodeBase {
  type: DocumentGroupType
  itemLabel?: string
  children: DocumentSchemaNode[]
}

export type DocumentSchemaNode = DocumentFieldNode | DocumentGroupNode

export interface DocumentTemplateSchema {
  nodes: DocumentSchemaNode[]
}

export const DOCUMENT_CLINICAL_CONTEXT_MODES = [
  "insights",
  "transcript",
] as const
export type DocumentClinicalContextMode =
  (typeof DOCUMENT_CLINICAL_CONTEXT_MODES)[number]

export const DOCUMENT_EMPTY_VALUE_POLICIES = [
  "BLANK",
  "NOT_PROVIDED",
] as const
export type DocumentEmptyValuePolicy =
  (typeof DOCUMENT_EMPTY_VALUE_POLICIES)[number]

export const DOCUMENT_GENERATION_REQUIREMENT_TYPES = [
  "confirmedDiagnosis",
] as const
export type DocumentGenerationRequirementType =
  (typeof DOCUMENT_GENERATION_REQUIREMENT_TYPES)[number]

export const DOCUMENT_CONFIRMED_DIAGNOSIS_SELECTION_MODES = [
  "single",
  "multiple",
] as const
export type DocumentConfirmedDiagnosisSelectionMode =
  (typeof DOCUMENT_CONFIRMED_DIAGNOSIS_SELECTION_MODES)[number]

export interface DocumentConfirmedDiagnosisRequirement {
  type: "confirmedDiagnosis"
  required: boolean
  selectionMode: DocumentConfirmedDiagnosisSelectionMode
  allowIcd11Search: boolean
}

export type DocumentGenerationRequirement =
  DocumentConfirmedDiagnosisRequirement

export interface DocumentGenerationConfig {
  clinicalContextDefault: DocumentClinicalContextMode
  includeSourceImages: boolean
  systemInstructions: string
  emptyValuePolicy: DocumentEmptyValuePolicy
  generationRequirements: DocumentGenerationRequirement[]
}

export interface SessionDocumentGenerationInputs {
  clinicalContextMode: DocumentClinicalContextMode | null
  confirmedDiagnoses: SelectedDiagnosisCondition[]
}

export interface DocumentTemplateVersionRecord {
  id: string
  templateId: string
  versionNumber: number
  status: DocumentTemplateVersionStatus
  schemaJson: DocumentTemplateSchema
  generationConfigJson: DocumentGenerationConfig
  previewContentJson: Record<string, unknown> | null
  previewLocale: string | null
  previewModelId: string | null
  previewGeneratedAt: string | null
  previewInputChecksum: string | null
  changelog: string | null
  createdByUserId: string | null
  createdAt: string
}

export interface DocumentTemplateVersionPreview {
  contentJson: Record<string, unknown> | null
  locale: string | null
  modelId: string | null
  generatedAt: string | null
  inputChecksum: string | null
}

export type DocumentPreviewKind = "AI_GENERATED" | "BUILT_IN_STATIC"

export interface DocumentPreviewPayload {
  versionNumber: number | null
  previewKind: DocumentPreviewKind
  previewLocale: string | null
  previewContent: Record<string, unknown> | null
  builtInPreviewKey?: "record" | "patient-handout"
  generatedAt: string | null
  schemaNodes?: DocumentSchemaNode[]
}

export interface DocumentTemplateRecord {
  id: string
  slug: string
  ownerUserId: string | null
  sourceKind: DocumentTemplateSourceKind
  renderer: DocumentTemplateRenderer
  visibility: DocumentTemplateVisibility
  title: string
  description: string
  category: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
  latestDraftVersionId: string | null
  latestPublishedVersionId: string | null
  createdAt: string
  updatedAt: string
}

export interface DocumentCatalogItem {
  templateId: string
  slug: string
  title: string
  description: string
  renderer: DocumentTemplateRenderer
  visibility: DocumentTemplateVisibility
  sourceKind: DocumentTemplateSourceKind
  category: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
  authorName: string
  installCount: number
  publishedVersionNumber: number | null
  installedVersionNumber: number | null
  isInstalled: boolean
  hasUpdate: boolean
  isEditable: boolean
  isBuiltIn: boolean
  canFork: boolean
  canPublish: boolean
  canInstall: boolean
  canUninstall: boolean
  preview: DocumentPreviewPayload
}

export interface DocumentPreviewResponse extends DocumentPreviewPayload {
  templateId: string
  title: string
  description: string
  renderer: DocumentTemplateRenderer
  sourceKind: DocumentTemplateSourceKind
  visibility: DocumentTemplateVisibility
  authorName: string
  category: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
}

export interface InstalledDocumentSummary {
  templateId: string
  slug: string
  title: string
  description: string
  renderer: DocumentTemplateRenderer
  visibility: DocumentTemplateVisibility
  sourceKind: DocumentTemplateSourceKind
  category: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
  authorName: string
  installCount: number
  installedVersionId: string
  installedVersionNumber: number
  installedVersionSchemaNodes?: DocumentSchemaNode[]
  installedVersionGenerationConfig?: DocumentGenerationConfig
  latestPublishedVersionId: string | null
  latestPublishedVersionNumber: number | null
  hasUpdate: boolean
}

export type SystemWorkspaceTabId =
  | "insights"
  | "ddx"
  | "documents"
  | "research"
export type WorkspaceTabId = SystemWorkspaceTabId | `document:${string}`

export interface DocumentWorkspaceSnapshot {
  tabOrder: WorkspaceTabId[]
  installedDocuments: InstalledDocumentSummary[]
  defaultTemplateIds: string[]
}

export interface SessionDocumentRecord {
  id: string
  sessionId: string
  templateId: string
  instanceKey: string
  templateVersionId: string
  title: string | null
  contentJson: Record<string, unknown>
  generationInputs: SessionDocumentGenerationInputs | null
  templateSchemaNodes?: DocumentSchemaNode[]
  templateVersionNumber?: number | null
  generatedAt: string | null
  updatedAt: string
  localOnly?: boolean
  pendingCreate?: boolean
  createError?: string | null
  needsSync?: boolean
}

export interface GenericDocumentFieldSection {
  kind: "field"
  label: string
  value: string | string[]
}

export interface GenericDocumentGroupSection {
  kind: "group"
  label: string
  children: GenericDocumentSection[]
}

export interface GenericDocumentRepeatableGroupSection {
  kind: "repeatableGroup"
  label: string
  itemLabel?: string
  items: GenericDocumentSection[][]
}

export type GenericDocumentSection =
  | GenericDocumentFieldSection
  | GenericDocumentGroupSection
  | GenericDocumentRepeatableGroupSection

export interface DocumentBuilderDraft {
  templateId?: string
  title: string
  description: string
  category: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
  schema: DocumentTemplateSchema
  generationConfig: DocumentGenerationConfig
}

export type DocumentBuilderDialogMode = "create" | "edit"

export const DOCUMENT_BUILDER_STEPS = [
  "start",
  "settings",
  "schema",
  "review",
] as const
export type DocumentBuilderStep = (typeof DOCUMENT_BUILDER_STEPS)[number]

export interface DocumentBuilderLocalSnapshot {
  mode: DocumentBuilderDialogMode
  templateId: string | null
  step: DocumentBuilderStep
  aiPrompt: string
  draft: DocumentBuilderDraft
  resolvedTemplateId: string | null
  publishedVersionNumber: number | null
  installedVersionNumber: number | null
  sampleContent?: Record<string, unknown>
  previewContent?: Record<string, unknown>
  previewLocale?: string | null
  previewInputChecksum?: string | null
  previewGeneratedAt?: string | null
  savedAt: string
}
