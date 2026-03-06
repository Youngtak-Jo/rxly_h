import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  BUILT_IN_DOCUMENTS,
  DEFAULT_DOCUMENT_TEMPLATE_IDS,
  SYSTEM_WORKSPACE_TAB_IDS,
  buildDocumentTabId,
  createDefaultTabOrder,
  getBuiltInDocumentDisplayMetadata,
  getTemplateIdFromTabId,
  isSystemWorkspaceTabId,
} from "@/lib/documents/constants"
import {
  getBuiltInDocumentPreviewAsset,
} from "@/lib/documents/built-in-preview"
import { SEEDED_PUBLIC_DOCUMENTS } from "@/lib/documents/seeded-public-documents"
import {
  DEFAULT_DOCUMENT_LANGUAGE,
  DEFAULT_DOCUMENT_REGION,
  resolveDocumentLanguage,
  resolveDocumentRegion,
} from "@/lib/documents/language-region"
import type {
  DocumentCatalogItem,
  DocumentGenerationConfig,
  DocumentPreviewPayload,
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
import { normalizeDocumentCategory } from "@/lib/documents/categories"
import type { UiLocale } from "@/i18n/config"

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
        _count: {
          select: {
            installedBy: true
          }
        }
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
const BUILT_IN_TEMPLATE_METADATA = new Map(
  BUILT_IN_DOCUMENTS.map((document) => [
    document.id,
    {
      authorName: document.authorName ?? null,
      featuredInstallCount: document.featuredInstallCount ?? 0,
    },
  ])
)
const SEEDED_PUBLIC_TEMPLATE_METADATA = new Map(
  SEEDED_PUBLIC_DOCUMENTS.map((document) => [
    document.id,
    {
      authorName: document.authorName ?? null,
      featuredInstallCount: document.featuredInstallCount ?? 0,
    },
  ])
)

function buildWorkspaceEnsureKey(userId: string, locale: UiLocale): string {
  return `${userId}:${locale}`
}

function isRxlyAuthoredTemplate(template: {
  sourceKind: string
  ownerUserId: string | null
}): boolean {
  return template.sourceKind === "BUILT_IN" || template.ownerUserId === null
}

function getFeaturedTemplateMetadata(template: {
  id: string
  sourceKind: string
  ownerUserId: string | null
}): {
  authorName: string | null
  featuredInstallCount: number
} | null {
  if (template.sourceKind === "BUILT_IN") {
    return BUILT_IN_TEMPLATE_METADATA.get(template.id) ?? null
  }

  if (template.ownerUserId === null) {
    return SEEDED_PUBLIC_TEMPLATE_METADATA.get(template.id) ?? null
  }

  return null
}

function getDisplayInstallCount(
  template: {
    id: string
    sourceKind: string
    ownerUserId: string | null
  },
  actualInstallCount: number
): number {
  const featuredInstallCount =
    getFeaturedTemplateMetadata(template)?.featuredInstallCount ?? 0
  return Math.max(actualInstallCount, featuredInstallCount)
}

function getDocumentDisplayMetadata<
  T extends {
    id: string
    title: string
    description: string
    sourceKind: string
    language: string | null
    region: string | null
  },
>(template: T, locale: UiLocale): {
  title: string
  description: string
  language: DocumentCatalogItem["language"]
  region: DocumentCatalogItem["region"]
} {
  if (template.sourceKind === "BUILT_IN") {
    const localized = getBuiltInDocumentDisplayMetadata(template.id, locale)
    if (localized) {
      return localized
    }
  }

  return {
    title: template.title,
    description: template.description,
    language: resolveDocumentLanguage(template.language),
    region: resolveDocumentRegion(template.region),
  }
}

function getLocaleAffinityRank(
  language: DocumentCatalogItem["language"],
  region: DocumentCatalogItem["region"],
  locale: UiLocale
): number {
  if (locale === "ko") {
    if (language === "ko" && region === "kr") return 0
    if (language === "ko" && region === "global") return 1
    if (language === "en" && region === "global") return 2
    if (language === "en" && region === "us") return 3
    return 4
  }

  if (language === "en" && region === "global") return 0
  if (language === "en" && region === "us") return 1
  if (language === "ko" && region === "kr") return 2
  if (language === "ko" && region === "global") return 3
  return 4
}

function toRecord<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function withNormalizedTemplateCategory<T extends { category: string }>(
  template: T
): T {
  return {
    ...template,
    category: normalizeDocumentCategory(template.category),
  }
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
    locale: version.previewLocale,
    modelId: version.previewModelId,
    generatedAt: version.previewGeneratedAt?.toISOString() ?? null,
    inputChecksum: version.previewInputChecksum,
  }
}

function buildStoredPreviewPayload(
  version:
    | {
        versionNumber: number
        previewContentJson: unknown | null
        previewLocale: string | null
        previewGeneratedAt: Date | null
      }
    | null
): DocumentPreviewPayload {
  return {
    versionNumber: version?.versionNumber ?? null,
    previewKind: "AI_GENERATED",
    previewLocale: version?.previewLocale ?? null,
    previewContent: version?.previewContentJson
      ? (toRecord(version.previewContentJson) as Record<string, unknown>)
      : null,
    generatedAt: version?.previewGeneratedAt?.toISOString() ?? null,
  }
}

function resolvePreviewVersion(
  template: TemplateWithVersions,
  userId: string
) {
  if (template.ownerUserId === userId && template.latestDraftVersion) {
    return template.latestDraftVersion
  }

  return template.latestPublishedVersion ?? template.latestDraftVersion
}

function resolveTemplatePreviewPayload(
  template: TemplateWithVersions,
  userId: string,
  locale: UiLocale = resolveDocumentLanguage(template.language)
): DocumentPreviewPayload {
  if (template.sourceKind === "BUILT_IN") {
    const asset = getBuiltInDocumentPreviewAsset(template.id, locale)
    return {
      versionNumber: template.latestPublishedVersion?.versionNumber ?? 1,
      previewKind: "BUILT_IN_STATIC",
      previewLocale: asset?.locale ?? null,
      previewContent: asset?.previewContent ?? null,
      builtInPreviewKey: asset?.key,
      generatedAt: null,
    }
  }

  return buildStoredPreviewPayload(resolvePreviewVersion(template, userId))
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
            category: normalizeDocumentCategory(builtIn.category),
            language: builtIn.language,
            region: builtIn.region,
          },
          create: {
            id: builtIn.id,
            slug: builtIn.slug,
            sourceKind: "BUILT_IN",
            renderer: builtIn.renderer,
            visibility: "PUBLIC",
            title: builtIn.title,
            description: builtIn.description,
            category: normalizeDocumentCategory(builtIn.category),
            language: builtIn.language,
            region: builtIn.region,
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

      for (const seeded of SEEDED_PUBLIC_DOCUMENTS) {
        await prisma.documentTemplate.upsert({
          where: { id: seeded.id },
          update: {
            slug: seeded.slug,
            ownerUserId: null,
            sourceKind: "USER",
            renderer: "GENERIC_STRUCTURED",
            visibility: "PUBLIC",
            title: seeded.title,
            description: seeded.description,
            category: normalizeDocumentCategory(seeded.category),
            language: seeded.language ?? DEFAULT_DOCUMENT_LANGUAGE,
            region: seeded.region ?? DEFAULT_DOCUMENT_REGION,
            latestDraftVersionId: null,
          },
          create: {
            id: seeded.id,
            slug: seeded.slug,
            ownerUserId: null,
            sourceKind: "USER",
            renderer: "GENERIC_STRUCTURED",
            visibility: "PUBLIC",
            title: seeded.title,
            description: seeded.description,
            category: normalizeDocumentCategory(seeded.category),
            language: seeded.language ?? DEFAULT_DOCUMENT_LANGUAGE,
            region: seeded.region ?? DEFAULT_DOCUMENT_REGION,
          },
        })

        const publishedVersion = await prisma.documentTemplateVersion.upsert({
          where: {
            templateId_versionNumber: {
              templateId: seeded.id,
              versionNumber: 1,
            },
          },
          update: {
            status: "PUBLISHED",
            schemaJson: seeded.schema as unknown as Prisma.InputJsonValue,
            generationConfigJson:
              seeded.generationConfig as unknown as Prisma.InputJsonValue,
            previewContentJson:
              seeded.previewContent as unknown as Prisma.InputJsonValue,
            previewLocale: seeded.previewLocale,
            previewModelId: null,
            previewGeneratedAt: null,
            previewInputChecksum: null,
            changelog: "Seeded public template",
            createdByUserId: null,
          },
          create: {
            templateId: seeded.id,
            versionNumber: 1,
            status: "PUBLISHED",
            schemaJson: seeded.schema as unknown as Prisma.InputJsonValue,
            generationConfigJson:
              seeded.generationConfig as unknown as Prisma.InputJsonValue,
            previewContentJson:
              seeded.previewContent as unknown as Prisma.InputJsonValue,
            previewLocale: seeded.previewLocale,
            previewModelId: null,
            previewGeneratedAt: null,
            previewInputChecksum: null,
            changelog: "Seeded public template",
            createdByUserId: null,
          },
        })

        await prisma.documentTemplate.update({
          where: { id: seeded.id },
          data: {
            latestDraftVersionId: null,
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
  userId: string,
  locale: UiLocale
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
            _count: {
              select: {
                installedBy: true,
              },
            },
          },
        },
        installedVersion: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const mappedInstalledDocuments = installedDocuments.map((document) =>
    mapInstalledDocument(document, userId, locale)
  )

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
  const missingSystemTabs = SYSTEM_WORKSPACE_TAB_IDS.filter(
    (tabId) => !deduped.includes(tabId as WorkspaceTabId)
  )

  return [...deduped, ...missingSystemTabs]
}

function mapInstalledDocument(
  record: InstalledDocumentWithRelations,
  userId: string,
  locale: UiLocale = "en"
): InstalledDocumentSummary {
  const latestPublishedVersion =
    record.template.latestPublishedVersion ?? null
  const display = getDocumentDisplayMetadata(record.template, locale)

  return {
    templateId: record.templateId,
    slug: record.template.slug,
    title: display.title,
    description: display.description,
    renderer: record.template.renderer,
    visibility: record.template.visibility,
    sourceKind: record.template.sourceKind,
    category: normalizeDocumentCategory(record.template.category),
    language: display.language,
    region: display.region,
    authorName: getAuthorName(record.template, userId),
    installCount: getDisplayInstallCount(
      record.template,
      record.template._count.installedBy
    ),
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
  userId: string,
  locale: UiLocale = "en"
): Promise<DocumentWorkspaceSnapshot> {
  const requestKey = buildWorkspaceEnsureKey(userId, locale)
  const inFlight = defaultWorkspaceEnsureByUser.get(requestKey)
  if (inFlight) return inFlight

  const request = ensureDefaultInstalledDocumentsInternal(userId, locale).finally(() => {
    if (defaultWorkspaceEnsureByUser.get(requestKey) === request) {
      defaultWorkspaceEnsureByUser.delete(requestKey)
    }
  })

  defaultWorkspaceEnsureByUser.set(requestKey, request)
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
  userId: string,
  locale: UiLocale = "en"
): Promise<DocumentWorkspaceSnapshot> {
  return ensureDefaultInstalledDocuments(userId, locale)
}

function getAuthorName(template: TemplateWithVersions, userId: string): string {
  const featuredAuthorName = getFeaturedTemplateMetadata(template)?.authorName
  if (featuredAuthorName) return featuredAuthorName
  if (template.ownerUserId === userId) return "You"
  if (isRxlyAuthoredTemplate(template)) return "Rxly"
  return "Community"
}

export async function getDocumentCatalog(
  userId: string,
  query: string | undefined,
  locale: UiLocale
): Promise<DocumentCatalogItem[]> {
  await ensureDefaultInstalledDocumentsExist(userId)
  const installedDocuments = await prisma.userInstalledDocument.findMany({
    where: { userId },
    include: {
      template: {
        include: {
          latestDraftVersion: true,
          latestPublishedVersion: true,
          _count: {
            select: {
              installedBy: true,
            },
          },
        },
      },
      installedVersion: true,
    },
    orderBy: { createdAt: "asc" },
  })
  const installedByTemplateId = new Map(
    installedDocuments.map((document) => [
      document.templateId,
      mapInstalledDocument(document, userId, locale),
    ])
  )

  const q = query?.trim() ?? ""
  const templates = await prisma.documentTemplate.findMany({
    where: {
      OR: [
        { sourceKind: "BUILT_IN" },
        { visibility: "PUBLIC" },
        { ownerUserId: userId },
      ],
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
      _count: {
        select: {
          installedBy: true,
        },
      },
    },
    orderBy: [
      { sourceKind: "asc" },
      { updatedAt: "desc" },
    ],
  })

  const catalogTemplates = [...templates].sort((left, right) => {
    const leftRank =
      left.sourceKind === "BUILT_IN" ? 0 : isRxlyAuthoredTemplate(left) ? 1 : 2
    const rightRank =
      right.sourceKind === "BUILT_IN" ? 0 : isRxlyAuthoredTemplate(right) ? 1 : 2
    const leftDisplay = getDocumentDisplayMetadata(left, locale)
    const rightDisplay = getDocumentDisplayMetadata(right, locale)

    if (leftRank !== rightRank) {
      return leftRank - rightRank
    }

    const leftLocaleRank = getLocaleAffinityRank(
      leftDisplay.language,
      leftDisplay.region,
      locale
    )
    const rightLocaleRank = getLocaleAffinityRank(
      rightDisplay.language,
      rightDisplay.region,
      locale
    )

    if (leftLocaleRank !== rightLocaleRank) {
      return leftLocaleRank - rightLocaleRank
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime()
  })

  const normalizedQuery = q.toLowerCase()

  return catalogTemplates
    .map((template) => {
      const display = getDocumentDisplayMetadata(template, locale)
      const installed = installedByTemplateId.get(template.id) ?? null
      const publishedVersion = template.latestPublishedVersion
      const isOwner = template.ownerUserId === userId
      const isBuiltIn = template.sourceKind === "BUILT_IN"
      const canInstall =
        !!template.latestPublishedVersionId && (!installed || !!publishedVersion)

      return {
        templateId: template.id,
        slug: template.slug,
        title: display.title,
        description: display.description,
        renderer: template.renderer,
        visibility: template.visibility,
        sourceKind: template.sourceKind,
        category: normalizeDocumentCategory(template.category),
        language: display.language,
        region: display.region,
        authorName: getAuthorName(template, userId),
        installCount: getDisplayInstallCount(
          template,
          template._count.installedBy
        ),
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
        preview: resolveTemplatePreviewPayload(template, userId, locale),
      }
    })
    .filter((item) => {
      if (!normalizedQuery) return true

      return [
        item.title,
        item.description,
        item.authorName,
        item.category,
        item.language,
        item.region,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    })
}

export async function installDocumentForUser(
  userId: string,
  templateId: string,
  versionId?: string,
  locale: UiLocale = "en"
): Promise<DocumentWorkspaceSnapshot> {
  await ensureDefaultInstalledDocuments(userId, locale)

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

  const workspace = await ensureDefaultInstalledDocuments(userId, locale)
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
  templateId: string,
  locale: UiLocale = "en"
): Promise<DocumentWorkspaceSnapshot> {
  await prisma.userInstalledDocument.deleteMany({
    where: { userId, templateId },
  })

  const workspace = await ensureBuiltInSafeWorkspaceAfterUninstall(
    userId,
    templateId,
    locale
  )
  return workspace
}

async function ensureBuiltInSafeWorkspaceAfterUninstall(
  userId: string,
  templateId: string,
  locale: UiLocale
): Promise<DocumentWorkspaceSnapshot> {
  const installedDocuments = await prisma.userInstalledDocument.findMany({
    where: { userId },
    include: {
      template: {
        include: {
          latestDraftVersion: true,
          latestPublishedVersion: true,
          _count: {
            select: {
              installedBy: true,
            },
          },
        },
      },
      installedVersion: true,
    },
    orderBy: { createdAt: "asc" },
  })

  const mappedInstalledDocuments = installedDocuments.map((document) =>
    mapInstalledDocument(document, userId, locale)
  )
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
  tabOrder: string[],
  locale: UiLocale = "en"
): Promise<DocumentWorkspaceSnapshot> {
  const workspace = await ensureDefaultInstalledDocuments(userId, locale)
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
  category: string
  language: string
  region: string
  visibility: "PRIVATE" | "PUBLIC"
  renderer: "GENERIC_STRUCTURED"
  schema: DocumentTemplateSchema
  generationConfig: DocumentGenerationConfig
  previewContent?: Record<string, unknown>
  previewLocale?: string | null
  previewModelId?: string | null
  previewGeneratedAt?: string | null
  previewInputChecksum?: string | null
}): Promise<TemplateWithVersions> {
  const normalizedCategory = normalizeDocumentCategory(input.category)
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
      category: normalizedCategory,
      language: resolveDocumentLanguage(input.language),
      region: resolveDocumentRegion(input.region),
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

  return withNormalizedTemplateCategory(updated)
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
  const normalizedTemplate = withNormalizedTemplateCategory(template)

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
          _count: {
            select: {
              installedBy: true,
            },
          },
        },
      },
      installedVersion: true,
    },
  })

  return {
    template: normalizedTemplate,
    installed: installed ? mapInstalledDocument(installed, userId) : null,
    latestDraftVersion: toVersionRecord(normalizedTemplate.latestDraftVersion),
    latestPublishedVersion: toVersionRecord(
      normalizedTemplate.latestPublishedVersion
    ),
    latestDraftPreview: toVersionPreview(normalizedTemplate.latestDraftVersion),
    latestPublishedPreview: toVersionPreview(
      normalizedTemplate.latestPublishedVersion
    ),
  }
}

export async function patchDocumentTemplateDraft(input: {
  userId: string
  templateId: string
  title?: string
  description?: string
  category?: string
  language?: string
  region?: string
  visibility?: "PRIVATE" | "PUBLIC"
  schema?: DocumentTemplateSchema
  generationConfig?: DocumentGenerationConfig
  changelog?: string
  previewContent?: Record<string, unknown>
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

  const updated = await prisma.documentTemplate.update({
    where: { id: template.id },
    data: {
      title: input.title,
      description: input.description,
      category:
        input.category === undefined
          ? undefined
          : normalizeDocumentCategory(input.category),
      language:
        input.language === undefined
          ? undefined
          : resolveDocumentLanguage(input.language),
      region:
        input.region === undefined
          ? undefined
          : resolveDocumentRegion(input.region),
      visibility: input.visibility,
      latestDraftVersionId: draftVersionId,
    },
    include: {
      latestDraftVersion: true,
      latestPublishedVersion: true,
    },
  })

  return withNormalizedTemplateCategory(updated)
}

export async function deleteDocumentTemplate(input: {
  userId: string
  templateId: string
}): Promise<void> {
  const template = await prisma.documentTemplate.findFirst({
    where: {
      id: input.templateId,
      ownerUserId: input.userId,
      sourceKind: "USER",
    },
    select: { id: true },
  })

  if (!template) {
    throw new Error("Template not found")
  }

  await prisma.$transaction(async (tx) => {
    // Session documents keep a RESTRICT fk to versions, so remove them first.
    await tx.sessionDocument.deleteMany({
      where: { templateId: template.id },
    })

    await tx.documentTemplate.delete({
      where: { id: template.id },
    })
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
      previewLocale: template.latestDraftVersion.previewLocale,
      previewModelId: template.latestDraftVersion.previewModelId,
      previewGeneratedAt: template.latestDraftVersion.previewGeneratedAt,
      previewInputChecksum: template.latestDraftVersion.previewInputChecksum,
      changelog: template.latestDraftVersion.changelog,
      createdByUserId: input.userId,
    },
  })

  const updated = await prisma.documentTemplate.update({
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

  return withNormalizedTemplateCategory(updated)
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
    category: normalizeDocumentCategory(template.category),
    language: template.language,
    region: template.region,
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
  locale: UiLocale
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
  const display = getDocumentDisplayMetadata(template, input.locale)
  const preview = resolveTemplatePreviewPayload(
    template,
    input.userId,
    input.locale
  )

  return {
    templateId: template.id,
    title: display.title,
    description: display.description,
    renderer: template.renderer,
    sourceKind: template.sourceKind,
    visibility: template.visibility,
    authorName: getAuthorName(template, input.userId),
    category: normalizeDocumentCategory(template.category),
    language: display.language,
    region: display.region,
    ...preview,
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
  const normalizedTemplate = withNormalizedTemplateCategory(template)

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
    template: normalizedTemplate,
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
