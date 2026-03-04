import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  BUILT_IN_DOCUMENTS,
  DEFAULT_DOCUMENT_TEMPLATE_IDS,
  buildDocumentTabId,
  createDefaultTabOrder,
  getTemplateIdFromTabId,
  isSystemWorkspaceTabId,
} from "@/lib/documents/constants"
import { getBuiltInDocumentPreviewAsset } from "@/lib/documents/built-in-preview"
import type {
  DocumentCatalogItem,
  DocumentCatalogPreviewSummary,
  DocumentGenerationConfig,
  DocumentPreviewResponse,
  DocumentTemplateSchema,
  DocumentTemplateVersionPreview,
  DocumentTemplateVersionRecord,
  DocumentWorkspaceSnapshot,
  InstalledDocumentSummary,
  SessionDocumentRecord,
  WorkspaceTabId,
} from "@/types/document"
import {
  createEmptyDocumentContent,
  normalizeDocumentContentForStorage,
} from "@/lib/documents/schema"

type TemplateWithVersions = Prisma.DocumentTemplateGetPayload<{
  include: {
    latestDraftVersion: true
    latestPublishedVersion: true
  }
}>

type InstalledDocumentWithRelations = Prisma.UserInstalledDocumentGetPayload<{
  include: {
    template: {
      include: {
        latestDraftVersion: true
        latestPublishedVersion: true
      }
    }
    installedVersion: true
  }
}>

let builtInTemplateEnsurePromise: Promise<void> | null = null
let hasEnsuredBuiltInTemplates = false
const defaultInstallEnsureByUser = new Map<string, Promise<void>>()
const defaultWorkspaceEnsureByUser = new Map<
  string,
  Promise<DocumentWorkspaceSnapshot>
>()

function toRecord<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function toVersionRecord(
  version: {
    id: string
    templateId: string
    versionNumber: number
    status: string
    schemaJson: unknown
    generationConfigJson: unknown
    previewContentJson: unknown | null
    previewCaseSummary: string | null
    previewLocale: string | null
    previewModelId: string | null
    previewGeneratedAt: Date | null
    previewInputChecksum: string | null
    changelog: string | null
    createdByUserId: string | null
    createdAt: Date
  } | null
): DocumentTemplateVersionRecord | null {
  if (!version) return null

  return {
    id: version.id,
    templateId: version.templateId,
    versionNumber: version.versionNumber,
    status: version.status as DocumentTemplateVersionRecord["status"],
    schemaJson: toRecord(version.schemaJson) as DocumentTemplateSchema,
    generationConfigJson: toRecord(
      version.generationConfigJson
    ) as DocumentGenerationConfig,
    previewContentJson: version.previewContentJson
      ? (toRecord(version.previewContentJson) as Record<string, unknown>)
      : null,
    previewCaseSummary: version.previewCaseSummary,
    previewLocale: version.previewLocale,
    previewModelId: version.previewModelId,
    previewGeneratedAt: version.previewGeneratedAt?.toISOString() ?? null,
    previewInputChecksum: version.previewInputChecksum,
    changelog: version.changelog,
    createdByUserId: version.createdByUserId,
    createdAt: version.createdAt.toISOString(),
  }
}

function toVersionPreview(
  version: {
    previewContentJson: unknown | null
    previewCaseSummary: string | null
    previewLocale: string | null
    previewModelId: string | null
    previewGeneratedAt: Date | null
    previewInputChecksum: string | null
  } | null
): DocumentTemplateVersionPreview | null {
  if (!version) return null

  return {
    contentJson: version.previewContentJson
      ? (toRecord(version.previewContentJson) as Record<string, unknown>)
      : null,
    caseSummary: version.previewCaseSummary,
    locale: version.previewLocale,
    modelId: version.previewModelId,
    generatedAt: version.previewGeneratedAt?.toISOString() ?? null,
    inputChecksum: version.previewInputChecksum,
  }
}

function hasStoredPreview(
  version: {
    previewContentJson: unknown | null
    previewCaseSummary: string | null
  } | null
): boolean {
  return !!version?.previewContentJson || !!version?.previewCaseSummary
}

function toCatalogPreviewSummary(
  templateId: string,
  version:
    | {
        previewContentJson: unknown | null
        previewCaseSummary: string | null
        previewLocale: string | null
        previewGeneratedAt: Date | null
      }
    | null,
  isBuiltIn: boolean
): DocumentCatalogPreviewSummary {
  if (isBuiltIn) {
    const builtInPreview = getBuiltInDocumentPreviewAsset(templateId)
    if (!builtInPreview) {
      return {
        hasPreview: false,
        caseSummary: null,
        locale: null,
        generatedAt: null,
      }
    }

    return {
      hasPreview: true,
      caseSummary: builtInPreview.summary,
      locale: builtInPreview.locale,
      generatedAt: null,
    }
  }

  return {
    hasPreview: hasStoredPreview(version),
    caseSummary: version?.previewCaseSummary ?? null,
    locale: version?.previewLocale ?? null,
    generatedAt: version?.previewGeneratedAt?.toISOString() ?? null,
  }
}

export function mapSessionDocumentRecord(document: {
  id: string
  sessionId: string
  templateId: string
  templateVersionId: string
  contentJson: unknown
  generatedAt: Date | null
  updatedAt: Date
}): SessionDocumentRecord {
  return {
    id: document.id,
    sessionId: document.sessionId,
    templateId: document.templateId,
    templateVersionId: document.templateVersionId,
    contentJson: toRecord(document.contentJson) as Record<string, unknown>,
    generatedAt: document.generatedAt?.toISOString() ?? null,
    updatedAt: document.updatedAt.toISOString(),
  }
}

export async function ensureBuiltInDocumentTemplates(): Promise<void> {
  if (hasEnsuredBuiltInTemplates) return

  if (!builtInTemplateEnsurePromise) {
    builtInTemplateEnsurePromise = (async () => {
      const existingBuiltInTemplates = await prisma.documentTemplate.findMany({
        where: {
          id: { in: DEFAULT_DOCUMENT_TEMPLATE_IDS },
          sourceKind: "BUILT_IN",
          latestPublishedVersionId: { not: null },
        },
        select: { id: true },
      })

      if (existingBuiltInTemplates.length === DEFAULT_DOCUMENT_TEMPLATE_IDS.length) {
        hasEnsuredBuiltInTemplates = true
        return
      }

      for (const builtIn of BUILT_IN_DOCUMENTS) {
        await prisma.documentTemplate.upsert({
          where: { id: builtIn.id },
          update: {
            slug: builtIn.slug,
            sourceKind: "BUILT_IN",
            renderer: builtIn.renderer,
            visibility: "PUBLIC",
            title: builtIn.title,
            description: builtIn.description,
            iconKey: builtIn.iconKey,
            category: builtIn.category,
          },
          create: {
            id: builtIn.id,
            slug: builtIn.slug,
            sourceKind: "BUILT_IN",
            renderer: builtIn.renderer,
            visibility: "PUBLIC",
            title: builtIn.title,
            description: builtIn.description,
            iconKey: builtIn.iconKey,
            category: builtIn.category,
          },
        })

        const publishedVersion = await prisma.documentTemplateVersion.upsert({
          where: {
            templateId_versionNumber: {
              templateId: builtIn.id,
              versionNumber: 1,
            },
          },
          update: {
            status: "PUBLISHED",
            schemaJson: builtIn.schema as unknown as Prisma.InputJsonValue,
            generationConfigJson:
              builtIn.generationConfig as unknown as Prisma.InputJsonValue,
            changelog: "Built-in template",
            createdByUserId: null,
          },
          create: {
            templateId: builtIn.id,
            versionNumber: 1,
            status: "PUBLISHED",
            schemaJson: builtIn.schema as unknown as Prisma.InputJsonValue,
            generationConfigJson:
              builtIn.generationConfig as unknown as Prisma.InputJsonValue,
            changelog: "Built-in template",
            createdByUserId: null,
          },
        })

        await prisma.documentTemplate.update({
          where: { id: builtIn.id },
          data: {
            latestPublishedVersionId: publishedVersion.id,
          },
        })
      }

      hasEnsuredBuiltInTemplates = true
    })().finally(() => {
      builtInTemplateEnsurePromise = null
    })
  }

  await builtInTemplateEnsurePromise
}

async function ensureDefaultInstalledDocumentsExistInternal(
  userId: string
): Promise<void> {
  await ensureBuiltInDocumentTemplates()
  const [existingLayout, existingInstallCount] = await Promise.all([
    prisma.userWorkspaceLayout.findUnique({
      where: { userId },
    }),
    prisma.userInstalledDocument.count({
      where: { userId },
    }),
  ])

  if (!existingLayout && existingInstallCount === 0) {
    const builtInTemplates = await prisma.documentTemplate.findMany({
      where: {
        id: { in: DEFAULT_DOCUMENT_TEMPLATE_IDS },
      },
      include: {
        latestPublishedVersion: true,
        latestDraftVersion: true,
      },
      orderBy: { createdAt: "asc" },
    })

    for (const template of builtInTemplates) {
      if (!template.latestPublishedVersionId) continue
      await prisma.userInstalledDocument.upsert({
        where: {
          userId_templateId: {
            userId,
            templateId: template.id,
          },
        },
        update: {},
        create: {
          userId,
          templateId: template.id,
          installedVersionId: template.latestPublishedVersionId,
        },
      })
    }
  }
}

async function ensureDefaultInstalledDocumentsInternal(
  userId: string
): Promise<DocumentWorkspaceSnapshot> {
  await ensureDefaultInstalledDocumentsExist(userId)

  const [existingLayout, installedDocuments] = await Promise.all([
    prisma.userWorkspaceLayout.findUnique({
      where: { userId },
    }),
    prisma.userInstalledDocument.findMany({
      where: { userId },
      include: {
        template: {
          include: {
            latestDraftVersion: true,
            latestPublishedVersion: true,
          },
        },
        installedVersion: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const mappedInstalledDocuments = installedDocuments.map(mapInstalledDocument)

  const reconciledTabOrder = reconcileWorkspaceTabOrder(
    mappedInstalledDocuments,
    Array.isArray(existingLayout?.tabOrderJson)
      ? (existingLayout?.tabOrderJson as string[])
      : undefined
  )

  const existingTabOrder = Array.isArray(existingLayout?.tabOrderJson)
    ? (existingLayout.tabOrderJson as string[])
    : null

  if (
    !existingLayout ||
    !areTabOrdersEqual(existingTabOrder, reconciledTabOrder)
  ) {
    await prisma.userWorkspaceLayout.upsert({
      where: { userId },
      update: {
        tabOrderJson: reconciledTabOrder,
      },
      create: {
        userId,
        tabOrderJson: reconciledTabOrder,
      },
    })
  }

  return {
    tabOrder: reconciledTabOrder,
    installedDocuments: mappedInstalledDocuments,
    defaultTemplateIds: [...DEFAULT_DOCUMENT_TEMPLATE_IDS],
  }
}

function areTabOrdersEqual(
  left: string[] | null,
  right: WorkspaceTabId[]
): boolean {
  if (!left) return false
  if (left.length !== right.length) return false

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }

  return true
}

export function reconcileWorkspaceTabOrder(
  installedDocuments: InstalledDocumentSummary[],
  currentTabOrder: string[] | null | undefined
): WorkspaceTabId[] {
  const installedDocumentIds = new Set(
    installedDocuments.map((document) => document.templateId)
  )

  const filtered: WorkspaceTabId[] = []
  if (Array.isArray(currentTabOrder)) {
    for (const rawTabId of currentTabOrder) {
      if (typeof rawTabId !== "string") continue
      if (isSystemWorkspaceTabId(rawTabId)) {
        filtered.push(rawTabId)
        continue
      }

      const templateId = getTemplateIdFromTabId(rawTabId as WorkspaceTabId)
      if (templateId && installedDocumentIds.has(templateId)) {
        filtered.push(buildDocumentTabId(templateId))
      }
    }
  }

  if (filtered.length === 0) {
    return createDefaultTabOrder(installedDocuments)
  }

  const deduped = Array.from(new Set(filtered))
  const missingDefaults = createDefaultTabOrder(installedDocuments).filter(
    (tabId) => !deduped.includes(tabId)
  )

  return [...deduped, ...missingDefaults]
}

function mapInstalledDocument(
  record: InstalledDocumentWithRelations
): InstalledDocumentSummary {
  const latestPublishedVersion =
    record.template.latestPublishedVersion ?? null

  return {
    templateId: record.templateId,
    slug: record.template.slug,
    title: record.template.title,
    description: record.template.description,
    renderer: record.template.renderer,
    visibility: record.template.visibility,
    sourceKind: record.template.sourceKind,
    iconKey: record.template.iconKey,
    category: record.template.category,
    installedVersionId: record.installedVersionId,
    installedVersionNumber: record.installedVersion.versionNumber,
    latestPublishedVersionId: latestPublishedVersion?.id ?? null,
    latestPublishedVersionNumber: latestPublishedVersion?.versionNumber ?? null,
    hasUpdate:
      !!latestPublishedVersion &&
      latestPublishedVersion.id !== record.installedVersionId,
  }
}

export async function ensureDefaultInstalledDocuments(
  userId: string
): Promise<DocumentWorkspaceSnapshot> {
  const inFlight = defaultWorkspaceEnsureByUser.get(userId)
  if (inFlight) return inFlight

  const request = ensureDefaultInstalledDocumentsInternal(userId).finally(() => {
    if (defaultWorkspaceEnsureByUser.get(userId) === request) {
      defaultWorkspaceEnsureByUser.delete(userId)
    }
  })

  defaultWorkspaceEnsureByUser.set(userId, request)
  return request
}

async function ensureDefaultInstalledDocumentsExist(
  userId: string
): Promise<void> {
  const inFlight = defaultInstallEnsureByUser.get(userId)
  if (inFlight) return inFlight

  const request = ensureDefaultInstalledDocumentsExistInternal(userId).finally(() => {
    if (defaultInstallEnsureByUser.get(userId) === request) {
      defaultInstallEnsureByUser.delete(userId)
    }
  })

  defaultInstallEnsureByUser.set(userId, request)
  return request
}

export async function getDocumentWorkspaceSnapshot(
  userId: string
): Promise<DocumentWorkspaceSnapshot> {
  return ensureDefaultInstalledDocuments(userId)
}

function getAuthorName(template: TemplateWithVersions, userId: string): string {
  if (template.sourceKind === "BUILT_IN") return "Rxly"
  if (template.ownerUserId === userId) return "You"
  return "Community"
}

export async function getDocumentCatalog(
  userId: string,
  query: string | undefined
): Promise<DocumentCatalogItem[]> {
  await ensureDefaultInstalledDocumentsExist(userId)
  const installedDocuments = await prisma.userInstalledDocument.findMany({
    where: { userId },
    include: {
      template: {
        include: {
          latestDraftVersion: true,
          latestPublishedVersion: true,
        },
      },
      installedVersion: true,
    },
    orderBy: { createdAt: "asc" },
  })
  const installedByTemplateId = new Map(
    installedDocuments.map((document) => [
      document.templateId,
      mapInstalledDocument(document),
    ])
  )

  const q = query?.trim() ?? ""
  const templates = await prisma.documentTemplate.findMany({
    where: {
      AND: [
        {
          OR: [
            { sourceKind: "BUILT_IN" },
            { visibility: "PUBLIC" },
            { ownerUserId: userId },
          ],
        },
        ...(q
          ? [
              {
                OR: [
                  { title: { contains: q, mode: "insensitive" as const } },
                  {
                    description: {
                      contains: q,
                      mode: "insensitive" as const,
                    },
                  },
                  { category: { contains: q, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
      ],
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
    orderBy: [
      { sourceKind: "asc" },
      { updatedAt: "desc" },
    ],
  })

  return templates.map((template) => {
    const installed = installedByTemplateId.get(template.id) ?? null
    const publishedVersion = template.latestPublishedVersion
    const isOwner = template.ownerUserId === userId
    const isBuiltIn = template.sourceKind === "BUILT_IN"
    const previewVersion =
      isOwner && template.latestDraftVersion
        ? template.latestDraftVersion
        : template.latestPublishedVersion
    const canInstall =
      !!template.latestPublishedVersionId && (!installed || !!publishedVersion)

    return {
      templateId: template.id,
      slug: template.slug,
      title: template.title,
      description: template.description,
      renderer: template.renderer,
      visibility: template.visibility,
      sourceKind: template.sourceKind,
      iconKey: template.iconKey,
      category: template.category,
      authorName: getAuthorName(template, userId),
      publishedVersionNumber: publishedVersion?.versionNumber ?? null,
      installedVersionNumber: installed?.installedVersionNumber ?? null,
      isInstalled: !!installed,
      hasUpdate: installed?.hasUpdate ?? false,
      isEditable: !isBuiltIn && isOwner,
      isBuiltIn,
      canFork: !isBuiltIn && !isOwner && template.visibility === "PUBLIC",
      canPublish:
        !isBuiltIn &&
        isOwner &&
        template.latestDraftVersionId !== null,
      canInstall,
      canUninstall: !!installed,
      preview: toCatalogPreviewSummary(template.id, previewVersion, isBuiltIn),
    }
  })
}

export async function installDocumentForUser(
  userId: string,
  templateId: string,
  versionId?: string
): Promise<DocumentWorkspaceSnapshot> {
  await ensureDefaultInstalledDocuments(userId)

  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: templateId,
      OR: [
        { sourceKind: "BUILT_IN" },
        { visibility: "PUBLIC" },
        { ownerUserId: userId },
      ],
    },
    include: {
      latestPublishedVersion: true,
    },
  })

  if (!template) {
    throw new Error("Template not found")
  }

  const targetVersion = versionId
    ? await prisma.documentTemplateVersion.findFirst({
        where: {
          id: versionId,
          templateId,
          status: "PUBLISHED",
        },
      })
    : template.latestPublishedVersion

  if (!targetVersion) {
    throw new Error("Published version not found")
  }

  await prisma.userInstalledDocument.upsert({
    where: {
      userId_templateId: {
        userId,
        templateId,
      },
    },
    update: {
      installedVersionId: targetVersion.id,
    },
    create: {
      userId,
      templateId,
      installedVersionId: targetVersion.id,
    },
  })

  const workspace = await ensureDefaultInstalledDocuments(userId)
  const nextTabId = buildDocumentTabId(templateId)
  if (!workspace.tabOrder.includes(nextTabId)) {
    const nextTabOrder = [...workspace.tabOrder, nextTabId]
    await prisma.userWorkspaceLayout.update({
      where: { userId },
      data: {
        tabOrderJson: nextTabOrder,
      },
    })
    return {
      ...workspace,
      tabOrder: nextTabOrder,
    }
  }

  return workspace
}

export async function uninstallDocumentForUser(
  userId: string,
  templateId: string
): Promise<DocumentWorkspaceSnapshot> {
  await prisma.userInstalledDocument.deleteMany({
    where: { userId, templateId },
  })

  const workspace = await ensureBuiltInSafeWorkspaceAfterUninstall(userId, templateId)
  return workspace
}

async function ensureBuiltInSafeWorkspaceAfterUninstall(
  userId: string,
  templateId: string
): Promise<DocumentWorkspaceSnapshot> {
  const installedDocuments = await prisma.userInstalledDocument.findMany({
    where: { userId },
    include: {
      template: {
        include: {
          latestDraftVersion: true,
          latestPublishedVersion: true,
        },
      },
      installedVersion: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const mappedInstalledDocuments = installedDocuments.map(mapInstalledDocument)
  const layout = await prisma.userWorkspaceLayout.findUnique({
    where: { userId },
  })
  const current = Array.isArray(layout?.tabOrderJson)
    ? (layout?.tabOrderJson as string[])
    : []
  const filtered = current.filter((tabId) => buildDocumentTabId(templateId) !== tabId)
  const reconciled = reconcileWorkspaceTabOrder(mappedInstalledDocuments, filtered)

  await prisma.userWorkspaceLayout.upsert({
    where: { userId },
    update: { tabOrderJson: reconciled },
    create: { userId, tabOrderJson: reconciled },
  })

  return {
    tabOrder: reconciled,
    installedDocuments: mappedInstalledDocuments,
    defaultTemplateIds: [...DEFAULT_DOCUMENT_TEMPLATE_IDS],
  }
}

export async function updateWorkspaceTabOrder(
  userId: string,
  tabOrder: string[]
): Promise<DocumentWorkspaceSnapshot> {
  const workspace = await ensureDefaultInstalledDocuments(userId)
  const reconciled = reconcileWorkspaceTabOrder(workspace.installedDocuments, tabOrder)
  await prisma.userWorkspaceLayout.upsert({
    where: { userId },
    update: { tabOrderJson: reconciled },
    create: { userId, tabOrderJson: reconciled },
  })

  return {
    ...workspace,
    tabOrder: reconciled,
  }
}

export async function createDocumentTemplateDraft(input: {
  userId: string
  title: string
  description: string
  iconKey: string
  category: string
  visibility: "PRIVATE" | "PUBLIC"
  renderer: "GENERIC_STRUCTURED"
  schema: DocumentTemplateSchema
  generationConfig: DocumentGenerationConfig
  previewContent?: Record<string, unknown>
  previewCaseSummary?: string | null
  previewLocale?: string | null
  previewModelId?: string | null
  previewGeneratedAt?: string | null
  previewInputChecksum?: string | null
}): Promise<TemplateWithVersions> {
  const slugBase = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "document"

  const existingSlugs = await prisma.documentTemplate.count({
    where: {
      slug: {
        startsWith: slugBase,
      },
    },
  })
  const slug = existingSlugs === 0 ? slugBase : `${slugBase}-${existingSlugs + 1}`

  const template = await prisma.documentTemplate.create({
    data: {
      slug,
      ownerUserId: input.userId,
      sourceKind: "USER",
      renderer: input.renderer,
      visibility: input.visibility,
      title: input.title,
      description: input.description,
      iconKey: input.iconKey,
      category: input.category,
      versions: {
        create: {
          versionNumber: 1,
          status: "DRAFT",
          schemaJson: input.schema as unknown as Prisma.InputJsonValue,
          generationConfigJson:
            input.generationConfig as unknown as Prisma.InputJsonValue,
          ...(input.previewContent
            ? {
                previewContentJson:
                  input.previewContent as unknown as Prisma.InputJsonValue,
              }
            : {}),
          previewCaseSummary: input.previewCaseSummary ?? null,
          previewLocale: input.previewLocale ?? null,
          previewModelId: input.previewModelId ?? null,
          previewGeneratedAt: input.previewGeneratedAt
            ? new Date(input.previewGeneratedAt)
            : null,
          previewInputChecksum: input.previewInputChecksum ?? null,
          changelog: "",
          createdByUserId: input.userId,
        },
      },
    },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })

  const latestVersion = template.versions[0]
  const updated = await prisma.documentTemplate.update({
    where: { id: template.id },
    data: {
      latestDraftVersionId: latestVersion?.id ?? null,
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })

  return updated
}

export async function getDocumentTemplateForUser(
  userId: string,
  templateId: string
): Promise<{
  template: TemplateWithVersions
  installed: InstalledDocumentSummary | null
  latestDraftVersion: DocumentTemplateVersionRecord | null
  latestPublishedVersion: DocumentTemplateVersionRecord | null
  latestDraftPreview: DocumentTemplateVersionPreview | null
  latestPublishedPreview: DocumentTemplateVersionPreview | null
}> {
  await ensureDefaultInstalledDocuments(userId)

  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: templateId,
      OR: [
        { ownerUserId: userId },
        { visibility: "PUBLIC" },
        { sourceKind: "BUILT_IN" },
      ],
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })

  if (!template) {
    throw new Error("Template not found")
  }

  const installed = await prisma.userInstalledDocument.findUnique({
    where: {
      userId_templateId: {
        userId,
        templateId,
      },
    },
    include: {
      template: {
        include: {
          latestDraftVersion: true,
          latestPublishedVersion: true,
        },
      },
      installedVersion: true,
    },
  })

  return {
    template,
    installed: installed ? mapInstalledDocument(installed) : null,
    latestDraftVersion: toVersionRecord(template.latestDraftVersion),
    latestPublishedVersion: toVersionRecord(template.latestPublishedVersion),
    latestDraftPreview: toVersionPreview(template.latestDraftVersion),
    latestPublishedPreview: toVersionPreview(template.latestPublishedVersion),
  }
}

export async function patchDocumentTemplateDraft(input: {
  userId: string
  templateId: string
  title?: string
  description?: string
  iconKey?: string
  category?: string
  visibility?: "PRIVATE" | "PUBLIC"
  schema?: DocumentTemplateSchema
  generationConfig?: DocumentGenerationConfig
  changelog?: string
  previewContent?: Record<string, unknown>
  previewCaseSummary?: string | null
  previewLocale?: string | null
  previewModelId?: string | null
  previewGeneratedAt?: string | null
  previewInputChecksum?: string | null
}): Promise<TemplateWithVersions> {
  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: input.templateId,
      ownerUserId: input.userId,
      sourceKind: "USER",
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })

  if (!template) {
    throw new Error("Template not found")
  }

  let draftVersionId = template.latestDraftVersionId

  if (!draftVersionId) {
    const nextVersion = await prisma.documentTemplateVersion.create({
      data: {
        templateId: template.id,
        versionNumber:
          (template.latestPublishedVersion?.versionNumber ?? 0) + 1,
        status: "DRAFT",
        schemaJson:
          (input.schema as unknown as Prisma.InputJsonValue) ??
          ((template.latestPublishedVersion?.schemaJson ??
            { nodes: [] }) as Prisma.InputJsonValue),
        generationConfigJson:
          (input.generationConfig as unknown as Prisma.InputJsonValue) ??
          ((template.latestPublishedVersion?.generationConfigJson ?? {
            audience: "clinician",
            outputTone: "clinical",
            contextSources: ["transcript"],
            systemInstructions: "",
            emptyValuePolicy: "BLANK",
          }) as Prisma.InputJsonValue),
        ...(input.previewContent
          ? {
              previewContentJson:
                input.previewContent as unknown as Prisma.InputJsonValue,
            }
          : {}),
        previewCaseSummary: input.previewCaseSummary ?? null,
        previewLocale: input.previewLocale ?? null,
        previewModelId: input.previewModelId ?? null,
        previewGeneratedAt: input.previewGeneratedAt
          ? new Date(input.previewGeneratedAt)
          : null,
        previewInputChecksum: input.previewInputChecksum ?? null,
        changelog: input.changelog ?? "",
        createdByUserId: input.userId,
      },
    })
    draftVersionId = nextVersion.id
  }

  if (input.schema || input.generationConfig || input.changelog !== undefined) {
    await prisma.documentTemplateVersion.update({
      where: { id: draftVersionId },
      data: {
        ...(input.schema
          ? { schemaJson: input.schema as unknown as Prisma.InputJsonValue }
          : {}),
        ...(input.generationConfig
          ? {
              generationConfigJson:
                input.generationConfig as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(input.previewContent !== undefined
          ? {
              previewContentJson:
                input.previewContent
                  ? (input.previewContent as unknown as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
            }
          : {}),
        ...(input.previewCaseSummary !== undefined
          ? { previewCaseSummary: input.previewCaseSummary }
          : {}),
        ...(input.previewLocale !== undefined
          ? { previewLocale: input.previewLocale }
          : {}),
        ...(input.previewModelId !== undefined
          ? { previewModelId: input.previewModelId }
          : {}),
        ...(input.previewGeneratedAt !== undefined
          ? {
              previewGeneratedAt: input.previewGeneratedAt
                ? new Date(input.previewGeneratedAt)
                : null,
            }
          : {}),
        ...(input.previewInputChecksum !== undefined
          ? { previewInputChecksum: input.previewInputChecksum }
          : {}),
        ...(input.changelog !== undefined ? { changelog: input.changelog } : {}),
      },
    })
  }

  return prisma.documentTemplate.update({
    where: { id: template.id },
    data: {
      title: input.title,
      description: input.description,
      iconKey: input.iconKey,
      category: input.category,
      visibility: input.visibility,
      latestDraftVersionId: draftVersionId,
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })
}

export async function publishDocumentTemplate(input: {
  userId: string
  templateId: string
}): Promise<TemplateWithVersions> {
  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: input.templateId,
      ownerUserId: input.userId,
      sourceKind: "USER",
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })

  if (!template || !template.latestDraftVersion) {
    throw new Error("Draft not found")
  }

  const latestVersion = await prisma.documentTemplateVersion.findFirst({
    where: { templateId: template.id },
    orderBy: { versionNumber: "desc" },
  })
  const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1

  const published = await prisma.documentTemplateVersion.create({
    data: {
      templateId: template.id,
      versionNumber: nextVersionNumber,
      status: "PUBLISHED",
      schemaJson:
        template.latestDraftVersion.schemaJson as Prisma.InputJsonValue,
      generationConfigJson:
        template.latestDraftVersion.generationConfigJson as Prisma.InputJsonValue,
      ...(template.latestDraftVersion.previewContentJson
        ? {
            previewContentJson:
              template.latestDraftVersion
                .previewContentJson as Prisma.InputJsonValue,
          }
        : {}),
      previewCaseSummary: template.latestDraftVersion.previewCaseSummary,
      previewLocale: template.latestDraftVersion.previewLocale,
      previewModelId: template.latestDraftVersion.previewModelId,
      previewGeneratedAt: template.latestDraftVersion.previewGeneratedAt,
      previewInputChecksum: template.latestDraftVersion.previewInputChecksum,
      changelog: template.latestDraftVersion.changelog,
      createdByUserId: input.userId,
    },
  })

  return prisma.documentTemplate.update({
    where: { id: template.id },
    data: {
      visibility: "PUBLIC",
      latestPublishedVersionId: published.id,
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })
}

export async function forkDocumentTemplate(input: {
  userId: string
  templateId: string
}): Promise<TemplateWithVersions> {
  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: input.templateId,
      visibility: "PUBLIC",
      sourceKind: "USER",
    },
    include: {
      latestPublishedVersion: true,
    },
  })

  if (!template?.latestPublishedVersion) {
    throw new Error("Template not found")
  }

  return createDocumentTemplateDraft({
    userId: input.userId,
    title: `${template.title} Copy`,
    description: template.description,
    iconKey: template.iconKey,
    category: template.category,
    visibility: "PRIVATE",
    renderer: "GENERIC_STRUCTURED",
    schema: toRecord(
      template.latestPublishedVersion.schemaJson
    ) as unknown as DocumentTemplateSchema,
    generationConfig: toRecord(
      template.latestPublishedVersion.generationConfigJson
    ) as unknown as DocumentGenerationConfig,
    previewContent: template.latestPublishedVersion.previewContentJson
      ? (toRecord(
          template.latestPublishedVersion.previewContentJson
        ) as Record<string, unknown>)
      : undefined,
    previewCaseSummary: template.latestPublishedVersion.previewCaseSummary,
    previewLocale: template.latestPublishedVersion.previewLocale,
    previewModelId: template.latestPublishedVersion.previewModelId,
    previewGeneratedAt:
      template.latestPublishedVersion.previewGeneratedAt?.toISOString() ?? null,
    previewInputChecksum: template.latestPublishedVersion.previewInputChecksum,
  })
}

export async function getDocumentPreviewForUser(input: {
  userId: string
  templateId: string
}): Promise<DocumentPreviewResponse> {
  await ensureDefaultInstalledDocumentsExist(input.userId)

  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: input.templateId,
      OR: [
        { ownerUserId: input.userId },
        { visibility: "PUBLIC" },
        { sourceKind: "BUILT_IN" },
      ],
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })

  if (!template) {
    throw new Error("Template not found")
  }

  if (template.sourceKind === "BUILT_IN") {
    const asset = getBuiltInDocumentPreviewAsset(template.id)
    return {
      templateId: template.id,
      title: template.title,
      description: template.description,
      renderer: template.renderer,
      sourceKind: template.sourceKind,
      visibility: template.visibility,
      versionNumber: template.latestPublishedVersion?.versionNumber ?? 1,
      previewKind: "BUILT_IN_STATIC",
      previewCaseSummary: asset?.summary ?? null,
      previewLocale: asset?.locale ?? null,
      previewContent: asset?.previewContent ?? null,
      builtInPreviewKey: asset?.key,
      authorName: getAuthorName(template, input.userId),
      category: template.category,
    }
  }

  const preferredVersion =
    template.ownerUserId === input.userId && template.latestDraftVersion
      ? template.latestDraftVersion
      : template.latestPublishedVersion ?? template.latestDraftVersion

  return {
    templateId: template.id,
    title: template.title,
    description: template.description,
    renderer: template.renderer,
    sourceKind: template.sourceKind,
    visibility: template.visibility,
    versionNumber: preferredVersion?.versionNumber ?? null,
    previewKind: "AI_GENERATED",
    previewCaseSummary: preferredVersion?.previewCaseSummary ?? null,
    previewLocale: preferredVersion?.previewLocale ?? null,
    previewContent: preferredVersion?.previewContentJson
      ? (toRecord(preferredVersion.previewContentJson) as Record<string, unknown>)
      : null,
    authorName: getAuthorName(template, input.userId),
    category: template.category,
  }
}

export async function getSessionDocumentForUser(input: {
  userId: string
  sessionId: string
  templateId: string
}): Promise<{
  sessionDocument: SessionDocumentRecord | null
  template: TemplateWithVersions
  installedDocument: InstalledDocumentSummary | null
}> {
  const workspace = await ensureDefaultInstalledDocuments(input.userId)
  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: input.templateId,
      OR: [
        { ownerUserId: input.userId },
        { visibility: "PUBLIC" },
        { sourceKind: "BUILT_IN" },
      ],
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })
  if (!template) {
    throw new Error("Template not found")
  }

  const sessionDocument = await prisma.sessionDocument.findFirst({
    where: {
      sessionId: input.sessionId,
      templateId: input.templateId,
    },
  })

  return {
    sessionDocument: sessionDocument
      ? mapSessionDocumentRecord(sessionDocument)
      : null,
    template,
    installedDocument:
      workspace.installedDocuments.find(
        (document) => document.templateId === input.templateId
      ) ?? null,
  }
}

export async function upsertSessionDocument(input: {
  sessionId: string
  templateId: string
  templateVersionId: string
  contentJson: Record<string, unknown>
  generatedAt?: string | null
}): Promise<SessionDocumentRecord> {
  const record = await prisma.sessionDocument.upsert({
    where: {
      sessionId_templateId: {
        sessionId: input.sessionId,
        templateId: input.templateId,
      },
    },
    update: {
      templateVersionId: input.templateVersionId,
      contentJson: input.contentJson as unknown as Prisma.InputJsonValue,
      generatedAt: input.generatedAt ? new Date(input.generatedAt) : null,
    },
    create: {
      sessionId: input.sessionId,
      templateId: input.templateId,
      templateVersionId: input.templateVersionId,
      contentJson: input.contentJson as unknown as Prisma.InputJsonValue,
      generatedAt: input.generatedAt ? new Date(input.generatedAt) : null,
    },
  })

  return mapSessionDocumentRecord(record)
}

export async function createInitialSessionDocumentIfMissing(input: {
  sessionId: string
  templateId: string
  templateVersionId: string
  schema: DocumentTemplateSchema
}): Promise<SessionDocumentRecord> {
  const existing = await prisma.sessionDocument.findUnique({
    where: {
      sessionId_templateId: {
        sessionId: input.sessionId,
        templateId: input.templateId,
      },
    },
  })

  if (existing) return mapSessionDocumentRecord(existing)

  return upsertSessionDocument({
    sessionId: input.sessionId,
    templateId: input.templateId,
    templateVersionId: input.templateVersionId,
    contentJson: createEmptyDocumentContent(input.schema),
    generatedAt: null,
  })
}

export function normalizeGenericSessionDocumentContent(input: {
  schema: DocumentTemplateSchema
  contentJson: unknown
}) {
  return normalizeDocumentContentForStorage(input.schema, input.contentJson)
}
