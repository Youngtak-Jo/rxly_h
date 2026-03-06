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
  children: DocumentSchemaNode[]
}

export type DocumentSchemaNode = DocumentFieldNode | DocumentGroupNode

export interface DocumentTemplateSchema {
  nodes: DocumentSchemaNode[]
}

export const DOCUMENT_CONTEXT_SOURCES = [
  "sessionMeta",
  "transcript",
  "doctorNotes",
  "insights",
  "ddx",
  "research",
  "record",
  "patientHandout",
] as const
export type DocumentGenerationContextSource =
  (typeof DOCUMENT_CONTEXT_SOURCES)[number]

export const DOCUMENT_EMPTY_VALUE_POLICIES = [
  "BLANK",
  "NOT_PROVIDED",
] as const
export type DocumentEmptyValuePolicy =
  (typeof DOCUMENT_EMPTY_VALUE_POLICIES)[number]

export interface DocumentGenerationConfig {
  audience: string
  outputTone: string
  contextSources: DocumentGenerationContextSource[]
  systemInstructions: string
  emptyValuePolicy: DocumentEmptyValuePolicy
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
  iconKey: string
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
  iconKey: string
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
  iconKey: string
  category: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
  authorName: string
  installCount: number
  installedVersionId: string
  installedVersionNumber: number
  latestPublishedVersionId: string | null
  latestPublishedVersionNumber: number | null
  hasUpdate: boolean
}

export type SystemWorkspaceTabId = "insights" | "ddx" | "research"
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
  templateVersionId: string
  contentJson: Record<string, unknown>
  generatedAt: string | null
  updatedAt: string
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
  iconKey: string
  category: string
  language: DocumentTemplateLanguage
  region: DocumentTemplateRegion
  visibility: DocumentTemplateVisibility
  schema: DocumentTemplateSchema
  generationConfig: DocumentGenerationConfig
}

export type DocumentBuilderDialogMode = "create" | "edit"

export const DOCUMENT_BUILDER_STEPS = [
  "start",
  "structure",
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
