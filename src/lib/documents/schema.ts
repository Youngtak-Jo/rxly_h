import { z } from "zod"
import type {
  DocumentFieldNode,
  DocumentGenerationConfig,
  DocumentGroupNode,
  DocumentSchemaNode,
  DocumentTemplateSchema,
} from "@/types/document"
import {
  DOCUMENT_CONTEXT_SOURCES,
  DOCUMENT_EMPTY_VALUE_POLICIES,
  DOCUMENT_FIELD_TYPES,
  DOCUMENT_GROUP_TYPES,
  DOCUMENT_TEMPLATE_LANGUAGES,
  DOCUMENT_TEMPLATE_REGIONS,
  DOCUMENT_TEMPLATE_RENDERERS,
  DOCUMENT_TEMPLATE_SOURCE_KINDS,
  DOCUMENT_TEMPLATE_VERSION_STATUSES,
  DOCUMENT_TEMPLATE_VISIBILITIES,
} from "@/types/document"
import { DOCUMENT_CATEGORIES } from "@/lib/documents/categories"

const MAX_SCHEMA_DEPTH = 3
const MAX_SCHEMA_FIELDS = 60

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
      type: z.enum(DOCUMENT_GROUP_TYPES),
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

export const documentGenerationConfigSchema = z.object({
  audience: z.string().trim().min(1).max(120),
  outputTone: z.string().trim().min(1).max(120),
  contextSources: z
    .array(z.enum(DOCUMENT_CONTEXT_SOURCES))
    .min(1)
    .max(DOCUMENT_CONTEXT_SOURCES.length),
  systemInstructions: z.string().max(4000).default(""),
  emptyValuePolicy: z.enum(DOCUMENT_EMPTY_VALUE_POLICIES).default("BLANK"),
})

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
  iconKey: z.string().trim().min(1).max(64).default("file-text"),
  category: z.enum(DOCUMENT_CATEGORIES).default("clinical-documentation"),
  language: z.enum(DOCUMENT_TEMPLATE_LANGUAGES).default("en"),
  region: z.enum(DOCUMENT_TEMPLATE_REGIONS).default("global"),
  visibility: z.enum(DOCUMENT_TEMPLATE_VISIBILITIES).default("PRIVATE"),
  schema: documentTemplateSchemaSchema,
  generationConfig: documentGenerationConfigSchema,
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
    changelog: z.string().max(1000).optional(),
  })
  .merge(documentTemplatePreviewPayloadSchema)

export const documentInstallSchema = z.object({
  versionId: z.string().min(1).optional(),
})

export const documentWorkspaceLayoutPatchSchema = z.object({
  tabOrder: z.array(z.string().min(1)).max(100),
})

export const sessionDocumentSaveSchema = z.object({
  templateVersionId: z.string().min(1).optional(),
  contentJson: z.record(z.string(), z.unknown()),
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
  config: DocumentGenerationConfig
): DocumentGenerationConfig {
  return documentGenerationConfigSchema.parse(config)
}

export function buildDocumentContentSchema(schema: DocumentTemplateSchema): z.ZodObject<z.ZodRawShape> {
  const buildShape = (nodes: DocumentSchemaNode[]): z.ZodRawShape => {
    const shape: Record<string, z.ZodTypeAny> = {}

    for (const node of nodes) {
      if ("children" in node) {
        const childSchema = z.object(buildShape(node.children))
        shape[node.key] =
          node.type === "repeatableGroup"
            ? z.array(childSchema)
            : childSchema
        continue
      }

      let fieldSchema: z.ZodTypeAny
      if (node.type === "stringList") {
        fieldSchema = z.array(z.string())
      } else {
        fieldSchema = z.string()
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
    children: node.children.map((child) =>
      "children" in child
        ? cloneDocumentGroupNode(child)
        : cloneDocumentFieldNode(child)
    ),
  }
}
