import { z } from "zod"
import type {
  DocumentBuilderDraft,
  DocumentBuilderLocalSnapshot,
  DocumentFieldNode,
  DocumentGenerationConfig,
  DocumentGroupNode,
  DocumentSchemaNode,
  DocumentTemplateSchema,
} from "@/types/document"
import {
  DOCUMENT_CLINICAL_CONTEXT_MODES,
  DOCUMENT_CONFIRMED_DIAGNOSIS_SELECTION_MODES,
  DOCUMENT_EMPTY_VALUE_POLICIES,
  DOCUMENT_FIELD_TYPES,
  DOCUMENT_GENERATION_REQUIREMENT_TYPES,
  DOCUMENT_TEMPLATE_LANGUAGES,
  DOCUMENT_TEMPLATE_REGIONS,
  DOCUMENT_TEMPLATE_RENDERERS,
  DOCUMENT_TEMPLATE_SOURCE_KINDS,
  DOCUMENT_TEMPLATE_VERSION_STATUSES,
  DOCUMENT_TEMPLATE_VISIBILITIES,
} from "@/types/document"
import {
  DOCUMENT_CATEGORIES,
  normalizeDocumentCategory,
} from "@/lib/documents/categories"
import {
  resolveDocumentLanguage,
  resolveDocumentRegion,
} from "@/lib/documents/language-region"
import {
  DEFAULT_DOCUMENT_GENERATION_CONFIG,
  createDocumentGenerationConfig,
  createEmptySessionDocumentGenerationInputs,
} from "@/lib/documents/generation-config"

const MAX_SCHEMA_DEPTH = 3
const MAX_SCHEMA_FIELDS = 60
const DOCUMENT_BUILDER_STORAGE_STEPS = [
  "start",
  "structure",
  "settings",
  "schema",
  "review",
] as const

const documentKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/)

const documentNodeBaseSchema = z.object({
  key: documentKeySchema,
  label: z.string().trim().min(1).max(120),
  helpText: z.string().max(500).default(""),
  required: z.boolean().default(false),
  placeholder: z.string().max(200).default(""),
})
const documentRepeatableItemLabelSchema = z.string().trim().min(1).max(120)
const documentClinicalContextModeSchema = z.enum(
  DOCUMENT_CLINICAL_CONTEXT_MODES
)
const documentConfirmedDiagnosisSelectionModeSchema = z.enum(
  DOCUMENT_CONFIRMED_DIAGNOSIS_SELECTION_MODES
)

const documentFieldNodeSchema = documentNodeBaseSchema.extend({
  type: z.enum(DOCUMENT_FIELD_TYPES),
})

export type DocumentFieldNodeInput = z.infer<typeof documentFieldNodeSchema>

type DocumentGroupNodeInput = DocumentGroupNode & {
  children: DocumentSchemaNodeInput[]
}

type DocumentSchemaNodeInput = DocumentFieldNodeInput | DocumentGroupNodeInput

const documentSchemaNodeSchema: z.ZodType<DocumentSchemaNodeInput> = z.lazy(() =>
  z.union([
    documentFieldNodeSchema,
    documentNodeBaseSchema.extend({
      type: z.literal("group"),
      children: z.array(documentSchemaNodeSchema).max(30),
    }),
    documentNodeBaseSchema.extend({
      type: z.literal("repeatableGroup"),
      itemLabel: documentRepeatableItemLabelSchema.optional(),
      children: z.array(documentSchemaNodeSchema).max(30),
    }),
  ])
)

function countFieldNodes(
  nodes: DocumentSchemaNodeInput[],
  depth = 1,
  seenKeys = new Set<string>()
): number {
  if (depth > MAX_SCHEMA_DEPTH) {
    throw new Error(`Schema depth must be ${MAX_SCHEMA_DEPTH} or less`)
  }

  let count = 0
  for (const node of nodes) {
    if (seenKeys.has(node.key)) {
      throw new Error(`Duplicate document key: ${node.key}`)
    }
    seenKeys.add(node.key)

    if ("children" in node) {
      count += countFieldNodes(node.children, depth + 1, seenKeys)
    } else {
      count += 1
    }
  }
  return count
}

export const documentTemplateSchemaSchema = z
  .object({
    nodes: z.array(documentSchemaNodeSchema).max(30),
  })
  .superRefine((value, ctx) => {
    try {
      const fieldCount = countFieldNodes(value.nodes)
      if (fieldCount > MAX_SCHEMA_FIELDS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schema supports at most ${MAX_SCHEMA_FIELDS} fields`,
          path: ["nodes"],
        })
      }
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Invalid schema",
        path: ["nodes"],
      })
    }
  })

const documentGenerationRequirementSchema = z
  .array(
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal(DOCUMENT_GENERATION_REQUIREMENT_TYPES[0]),
        required: z.boolean().default(true),
        selectionMode: documentConfirmedDiagnosisSelectionModeSchema,
        allowIcd11Search: z.boolean().default(true),
      }),
    ])
  )
  .default([])

function adaptLegacyDocumentGenerationConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value
  }

  const record = value as Record<string, unknown>
  if (!("contextSources" in record)) {
    return value
  }

  const contextSources = Array.isArray(record.contextSources)
    ? record.contextSources.filter(
        (source): source is string => typeof source === "string"
      )
    : []

  const clinicalContextDefault =
    contextSources.includes("transcript") && !contextSources.includes("insights")
      ? "transcript"
      : "insights"

  return {
    clinicalContextDefault,
    includeSourceImages: contextSources.includes("uploadedImages"),
    systemInstructions:
      typeof record.systemInstructions === "string"
        ? record.systemInstructions
        : DEFAULT_DOCUMENT_GENERATION_CONFIG.systemInstructions,
    emptyValuePolicy:
      record.emptyValuePolicy === "NOT_PROVIDED"
        ? "NOT_PROVIDED"
        : DEFAULT_DOCUMENT_GENERATION_CONFIG.emptyValuePolicy,
    generationRequirements: record.generationRequirements,
  }
}

const documentGenerationConfigObjectSchema = z.object({
  clinicalContextDefault: documentClinicalContextModeSchema.default("insights"),
  includeSourceImages: z.boolean().default(false),
  systemInstructions: z.string().max(4000).default(""),
  emptyValuePolicy: z.enum(DOCUMENT_EMPTY_VALUE_POLICIES).default("BLANK"),
  generationRequirements: documentGenerationRequirementSchema,
})

export const documentGenerationConfigSchema = z.preprocess(
  adaptLegacyDocumentGenerationConfig,
  documentGenerationConfigObjectSchema
)

export const storedDocumentGenerationConfigSchema = z.preprocess(
  adaptLegacyDocumentGenerationConfig,
  documentGenerationConfigObjectSchema
)

export const documentTemplatePreviewPayloadSchema = z.object({
  previewContent: z.record(z.string(), z.unknown()).optional(),
  previewLocale: z.string().trim().min(2).max(20).nullable().optional(),
  previewModelId: z.string().trim().min(1).max(200).nullable().optional(),
  previewGeneratedAt: z.string().datetime().nullable().optional(),
  previewInputChecksum: z.string().trim().min(1).max(128).nullable().optional(),
})

export const documentBuilderDraftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(1000).default(""),
  category: z.enum(DOCUMENT_CATEGORIES).default("clinical-documentation"),
  language: z.enum(DOCUMENT_TEMPLATE_LANGUAGES).default("en"),
  region: z.enum(DOCUMENT_TEMPLATE_REGIONS).default("global"),
  schema: documentTemplateSchemaSchema,
  generationConfig: documentGenerationConfigSchema,
})

const documentBuilderStoredDraftSchema = z.object({
  title: z.string().max(120).default(""),
  description: z.string().max(1000).default(""),
  category: z
    .string()
    .trim()
    .default("clinical-documentation")
    .transform((value) => normalizeDocumentCategory(value)),
  language: z
    .string()
    .trim()
    .default("en")
    .transform((value) => resolveDocumentLanguage(value)),
  region: z
    .string()
    .trim()
    .default("global")
    .transform((value) => resolveDocumentRegion(value)),
  schema: documentTemplateSchemaSchema.catch({ nodes: [] }),
  generationConfig: storedDocumentGenerationConfigSchema.catch(
    createDocumentGenerationConfig()
  ),
})

const documentBuilderStoredStepSchema = z
  .enum(DOCUMENT_BUILDER_STORAGE_STEPS)
  .transform((step) => (step === "structure" ? "settings" : step))

const documentBuilderLocalSnapshotSchema = z.object({
  mode: z.enum(["create", "edit"]).default("create"),
  templateId: z.string().min(1).nullable().default(null),
  step: documentBuilderStoredStepSchema,
  aiPrompt: z.string().default(""),
  draft: documentBuilderStoredDraftSchema,
  resolvedTemplateId: z.string().min(1).nullable().default(null),
  publishedVersionNumber: z.number().int().nullable().default(null),
  installedVersionNumber: z.number().int().nullable().default(null),
  sampleContent: z.record(z.string(), z.unknown()).optional(),
  previewContent: z.record(z.string(), z.unknown()).optional(),
  previewLocale: z.string().trim().min(2).max(20).nullable().optional(),
  previewInputChecksum: z.string().trim().min(1).max(128).nullable().optional(),
  previewGeneratedAt: z.string().datetime().nullable().optional(),
  savedAt: z.string().default(""),
})

export const documentTemplateLanguageSchema = z.enum(
  DOCUMENT_TEMPLATE_LANGUAGES
)
export const documentTemplateRegionSchema = z.enum(DOCUMENT_TEMPLATE_REGIONS)

export const documentTemplateCreateSchema = documentBuilderDraftSchema
  .extend({
    renderer: z.enum(DOCUMENT_TEMPLATE_RENDERERS).default("GENERIC_STRUCTURED"),
  })
  .merge(documentTemplatePreviewPayloadSchema)

export const documentTemplatePatchSchema = documentBuilderDraftSchema
  .partial()
  .extend({
    visibility: z.literal("PRIVATE").optional(),
    changelog: z.string().max(1000).optional(),
  })
  .merge(documentTemplatePreviewPayloadSchema)

export const documentInstallSchema = z.object({
  versionId: z.string().min(1).optional(),
})

export const documentWorkspaceLayoutPatchSchema = z.object({
  tabOrder: z.array(z.string().min(1)).max(100),
})

export const sessionDocumentGenerationInputsSchema = z.object({
  clinicalContextMode: documentClinicalContextModeSchema.nullable().default(null),
  confirmedDiagnoses: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(200),
        icdCode: z.string().trim().min(1).max(200),
        diseaseName: z.string().trim().min(1).max(300),
        source: z.enum(["ddx", "icd11"]),
      })
    )
    .default([]),
}).default(createEmptySessionDocumentGenerationInputs())

export const sessionDocumentSaveSchema = z.object({
  templateVersionId: z.string().min(1).optional(),
  contentJson: z.record(z.string(), z.unknown()),
  generationInputs: sessionDocumentGenerationInputsSchema.nullable().optional(),
  generatedAt: z.string().datetime().nullable().optional(),
})

export const documentAiDraftSchema = z.object({
  prompt: z.string().trim().min(10).max(12000),
  defaultLanguage: z.enum(DOCUMENT_TEMPLATE_LANGUAGES).default("en"),
  defaultRegion: z.enum(DOCUMENT_TEMPLATE_REGIONS).default("global"),
  model: z.string().trim().min(1).max(200).optional(),
})

export const documentAiReviseSchema = z.object({
  prompt: z.string().trim().min(5).max(12000),
  model: z.string().trim().min(1).max(200).optional(),
  draft: documentBuilderDraftSchema,
})

export const documentAiPreviewSchema = z.object({
  draft: documentBuilderDraftSchema,
  model: z.string().trim().min(1).max(200).optional(),
})

export const documentCatalogQuerySchema = z.object({
  q: z.string().max(200).optional(),
  locale: z.string().trim().min(2).max(20).optional(),
})

export const documentTemplateSourceKindSchema = z.enum(
  DOCUMENT_TEMPLATE_SOURCE_KINDS
)
export const documentTemplateRendererSchema = z.enum(
  DOCUMENT_TEMPLATE_RENDERERS
)
export const documentTemplateVisibilitySchema = z.enum(
  DOCUMENT_TEMPLATE_VISIBILITIES
)
export const documentTemplateVersionStatusSchema = z.enum(
  DOCUMENT_TEMPLATE_VERSION_STATUSES
)

export function normalizeDocumentTemplateSchema(
  schema: DocumentTemplateSchema
): DocumentTemplateSchema {
  return documentTemplateSchemaSchema.parse(schema)
}

export function normalizeDocumentGenerationConfig(
  config: unknown
): DocumentGenerationConfig {
  return documentGenerationConfigSchema.parse(config)
}

export function normalizeStoredDocumentGenerationConfig(
  config: unknown
): DocumentGenerationConfig {
  return storedDocumentGenerationConfigSchema.parse(config)
}

export function sanitizeDocumentBuilderDraft(
  draft: unknown
): DocumentBuilderDraft | null {
  const parsed = documentBuilderStoredDraftSchema.safeParse(draft)
  return parsed.success ? parsed.data : null
}

export function sanitizeDocumentBuilderLocalSnapshot(
  snapshot: unknown
): DocumentBuilderLocalSnapshot | null {
  const parsed = documentBuilderLocalSnapshotSchema.safeParse(snapshot)
  return parsed.success ? parsed.data : null
}

export function buildDocumentContentSchema(schema: DocumentTemplateSchema): z.ZodObject<z.ZodRawShape> {
  const buildShape = (nodes: DocumentSchemaNode[]): z.ZodRawShape => {
    const shape: Record<string, z.ZodTypeAny> = {}

    for (const node of nodes) {
      if ("children" in node) {
        const childSchema = z.object(buildShape(node.children))
        let arrayOrObjectSchema: z.ZodTypeAny =
          node.type === "repeatableGroup"
            ? z.array(childSchema)
            : childSchema

        if (node.helpText?.trim()) {
          arrayOrObjectSchema = arrayOrObjectSchema.describe(node.helpText)
        }

        shape[node.key] = arrayOrObjectSchema
        continue
      }

      let fieldSchema: z.ZodTypeAny
      if (node.type === "stringList") {
        fieldSchema = z.array(z.string())
      } else {
        fieldSchema = z.string()
      }

      if (node.helpText?.trim()) {
        fieldSchema = fieldSchema.describe(node.helpText)
      }

      shape[node.key] = node.required ? fieldSchema : fieldSchema.optional()
    }

    return shape
  }

  return z.object(buildShape(schema.nodes))
}

export function createEmptyContentValueForNode(
  node: DocumentSchemaNode
): unknown {
  if ("children" in node) {
    if (node.type === "repeatableGroup") return []

    const nested: Record<string, unknown> = {}
    for (const child of node.children) {
      nested[child.key] = createEmptyContentValueForNode(child)
    }
    return nested
  }

  if (node.type === "stringList") return []
  return ""
}

export function createEmptyDocumentContent(
  schema: DocumentTemplateSchema
): Record<string, unknown> {
  const content: Record<string, unknown> = {}
  for (const node of schema.nodes) {
    content[node.key] = createEmptyContentValueForNode(node)
  }
  return content
}

export function normalizeDocumentContentForStorage(
  schema: DocumentTemplateSchema,
  rawValue: unknown
): Record<string, unknown> {
  const base = createEmptyDocumentContent(schema)
  const parsed = buildDocumentContentSchema(schema).partial().parse(
    rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)
      ? rawValue
      : {}
  )

  return {
    ...base,
    ...parsed,
  }
}

export function cloneDocumentFieldNode(
  node: DocumentFieldNodeInput
): DocumentFieldNode {
  return {
    key: node.key,
    label: node.label,
    helpText: node.helpText,
    required: node.required,
    placeholder: node.placeholder,
    type: node.type,
  }
}

export function cloneDocumentGroupNode(
  node: DocumentGroupNodeInput
): DocumentGroupNode {
  return {
    key: node.key,
    label: node.label,
    helpText: node.helpText,
    required: node.required,
    placeholder: node.placeholder,
    type: node.type,
    ...(node.type === "repeatableGroup" && node.itemLabel
      ? { itemLabel: node.itemLabel }
      : {}),
    children: node.children.map((child) =>
      "children" in child
        ? cloneDocumentGroupNode(child)
        : cloneDocumentFieldNode(child)
    ),
  }
}
