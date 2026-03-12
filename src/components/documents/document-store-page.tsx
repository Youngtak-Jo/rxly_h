"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IconFileText,
  IconFolder,
  IconLoader2,
  IconPlus,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { DocumentCatalogPreviewDialog } from "@/components/documents/document-catalog-preview-dialog"
import { DocumentPreviewCard } from "@/components/documents/document-preview-card"
import { DocumentPreviewContent } from "@/components/documents/document-preview-content"
import { DocumentsHeader } from "@/components/documents/documents-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getDocumentCategoryLabelKey,
  getDocumentCategoryOptions,
  normalizeDocumentCategory,
  type DocumentCategory,
} from "@/lib/documents/categories"
import { buildDocumentTabId } from "@/lib/documents/constants"
import {
  getDocumentLanguageOptions,
  getDocumentRegionOptions,
} from "@/lib/documents/language-region"
import { normalizeUiLocale } from "@/i18n/config"
import { formatNumber } from "@/i18n/format"
import { useDocumentBuilderDialogStore } from "@/stores/document-builder-dialog-store"
import { useDocumentCatalogStore } from "@/stores/document-catalog-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import type {
  DocumentBuilderDialogMode,
  DocumentCatalogItem,
  DocumentTemplateLanguage,
  DocumentTemplateRegion,
  InstalledDocumentSummary,
} from "@/types/document"

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string }
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error
    }
  } catch {
    // Ignore malformed error bodies and fall back to the provided message.
  }

  return `${fallback} (${response.status})`
}

type CategoryFilter = "all" | DocumentCategory
type LanguageFilter = "all" | DocumentTemplateLanguage
type RegionFilter = "all" | DocumentTemplateRegion

const DOCUMENT_CATEGORY_OPTIONS = getDocumentCategoryOptions()
const DOCUMENT_LANGUAGE_OPTIONS = getDocumentLanguageOptions()
const DOCUMENT_REGION_OPTIONS = getDocumentRegionOptions()
const CATALOG_CACHE_KEY = "all"
const catalogCache = new Map<string, DocumentCatalogItem[]>()
const inFlightCatalogRequests = new Map<string, Promise<DocumentCatalogItem[]>>()
const FILTER_TRIGGER_BASE_CLASS =
  "h-8 w-auto max-w-full justify-start gap-1.5 rounded-full px-3 pr-2 text-xs font-medium shadow-none [&_svg]:size-3.5"

function getFilterTriggerClass(active: boolean): string {
  if (active) {
    return `${FILTER_TRIGGER_BASE_CLASS} border-primary/50 bg-primary/10 text-primary hover:border-primary/60 hover:bg-primary/15 data-[state=open]:bg-primary/15`
  }

  return `${FILTER_TRIGGER_BASE_CLASS} border-border/70 bg-transparent text-foreground hover:border-border hover:bg-transparent data-[state=open]:bg-transparent`
}

function DocumentStoreFilterPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-wrap items-center justify-start gap-2"
    >
      <div className="h-8 w-28 rounded-full border border-border/70" />
      <div className="h-8 w-24 rounded-full border border-border/70" />
      <div className="h-8 w-24 rounded-full border border-border/70" />
    </div>
  )
}

function buildFallbackCatalogItem(
  installed: InstalledDocumentSummary
): DocumentCatalogItem {
  return {
    templateId: installed.templateId,
    slug: installed.slug,
    title: installed.title,
    description: installed.description,
    renderer: installed.renderer,
    visibility: installed.visibility,
    sourceKind: installed.sourceKind,
    category: normalizeDocumentCategory(installed.category),
    language: installed.language,
    region: installed.region,
    authorName: installed.authorName,
    installCount: installed.installCount,
    publishedVersionNumber: installed.latestPublishedVersionNumber,
    installedVersionNumber: installed.installedVersionNumber,
    isInstalled: true,
    hasUpdate: installed.hasUpdate,
    isEditable: false,
    isBuiltIn: installed.sourceKind === "BUILT_IN",
    canFork: false,
    canPublish: false,
    canInstall: !!installed.latestPublishedVersionId,
    canUninstall: false,
    preview: {
      versionNumber: installed.latestPublishedVersionNumber,
      previewKind:
        installed.sourceKind === "BUILT_IN" ? "BUILT_IN_STATIC" : "AI_GENERATED",
      previewLocale: null,
      previewContent: null,
      generatedAt: null,
    },
  }
}

export function DocumentStorePage({
  initialDialogIntent,
  viewMode = "catalog",
}: {
  initialDialogIntent?: {
    mode: DocumentBuilderDialogMode
    templateId?: string | null
    routeBacked: boolean
  }
  viewMode?: "catalog" | "mine"
}) {
  const t = useTranslations("DocumentStore")
  const tBuilder = useTranslations("DocumentBuilder")
  const tMeta = useTranslations("DocumentMetadata")
  const locale = useLocale()
  const router = useRouter()
  const uiLocale = normalizeUiLocale(locale) ?? "en"

  const isMineView = viewMode === "mine"

  const openCreate = useDocumentBuilderDialogStore((state) => state.openCreate)
  const openEdit = useDocumentBuilderDialogStore((state) => state.openEdit)
  const refreshKey = useDocumentCatalogStore((state) => state.refreshKey)

  const loadWorkspaceSnapshot = useDocumentWorkspaceStore(
    (state) => state.loadWorkspaceSnapshot
  )
  const installDocument = useDocumentWorkspaceStore((state) => state.installDocument)
  const setDocumentTabEnabled = useDocumentWorkspaceStore(
    (state) => state.setDocumentTabEnabled
  )
  const installedDocuments = useDocumentWorkspaceStore(
    (state) => state.installedDocuments
  )
  const tabOrder = useDocumentWorkspaceStore((state) => state.tabOrder)
  const workspaceLoading = useDocumentWorkspaceStore((state) => state.isLoading)
  const workspaceLoaded = useDocumentWorkspaceStore((state) => state.hasLoaded)

  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all")
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all")
  const [items, setItems] = useState<DocumentCatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<DocumentCatalogItem | null>(null)
  const [unpublishTarget, setUnpublishTarget] =
    useState<DocumentCatalogItem | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<DocumentCatalogItem | null>(null)
  const [toolbarReady, setToolbarReady] = useState(false)
  const initialIntentAppliedRef = useRef(false)

  useEffect(() => {
    setToolbarReady(true)
  }, [])

  const loadCatalog = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false
      const cacheKey = `${CATALOG_CACHE_KEY}:${locale}`

      if (!force) {
        const cachedItems = catalogCache.get(cacheKey)
        if (cachedItems) {
          setItems(cachedItems)
          setHasLoadedCatalog(true)
        }
      }

      setLoading(true)
      try {
        let request = inFlightCatalogRequests.get(cacheKey) ?? null

        if (!request || force) {
          request = (async () => {
            const response = await fetch(
              `/api/documents/catalog?locale=${encodeURIComponent(locale)}`
            )
            if (!response.ok) {
              throw new Error(
                await readErrorMessage(response, "Failed to load document catalog")
              )
            }

            const payload = (await response.json()) as { items: DocumentCatalogItem[] }
            catalogCache.set(cacheKey, payload.items)
            return payload.items
          })().finally(() => {
            const currentRequest = inFlightCatalogRequests.get(cacheKey)
            if (currentRequest === request) {
              inFlightCatalogRequests.delete(cacheKey)
            }
          })

          inFlightCatalogRequests.set(cacheKey, request)
        }

        setItems(await request)
        setHasLoadedCatalog(true)
      } catch (error) {
        setHasLoadedCatalog(true)
        const message =
          error instanceof Error ? error.message : t("toasts.loadFailed")
        console.error("Failed to load document catalog", message, error)
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [locale, t]
  )

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (refreshKey === 0) return
    void loadCatalog({ force: true })
  }, [loadCatalog, refreshKey])

  useEffect(() => {
    void loadWorkspaceSnapshot({ locale }).catch((error) => {
      const message =
        error instanceof Error
          ? error.message
          : t("toasts.workspaceLoadFailed")
      toast.error(message)
    })
  }, [loadWorkspaceSnapshot, locale, t])

  useEffect(() => {
    if (!initialDialogIntent || initialIntentAppliedRef.current) return
    initialIntentAppliedRef.current = true

    if (initialDialogIntent.mode === "edit" && initialDialogIntent.templateId) {
      openEdit(initialDialogIntent.templateId, {
        routeBacked: initialDialogIntent.routeBacked,
      })
      return
    }

    openCreate({ routeBacked: initialDialogIntent.routeBacked })
  }, [initialDialogIntent, openCreate, openEdit])

  const matchesSearchAndCategory = useCallback(
    (item: DocumentCatalogItem) => {
      if (
        categoryFilter !== "all" &&
        normalizeDocumentCategory(item.category) !== categoryFilter
      ) {
        return false
      }
      if (languageFilter !== "all" && item.language !== languageFilter) {
        return false
      }
      if (regionFilter !== "all" && item.region !== regionFilter) {
        return false
      }

      const normalizedQuery = query.trim().toLowerCase()
      if (!normalizedQuery) return true

      const haystack = [
        item.title,
        item.description,
        item.authorName,
        normalizeDocumentCategory(item.category),
        item.language,
        item.region,
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    },
    [categoryFilter, languageFilter, query, regionFilter]
  )

  const catalogByTemplateId = useMemo(
    () => new Map(items.map((item) => [item.templateId, item])),
    [items]
  )

  const installedItems = useMemo(
    () =>
      installedDocuments.map(
        (installed) =>
          catalogByTemplateId.get(installed.templateId) ??
          buildFallbackCatalogItem(installed)
      ).filter(matchesSearchAndCategory),
    [catalogByTemplateId, installedDocuments, matchesSearchAndCategory]
  )

  const installableCatalogItems = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.canInstall &&
            !item.isInstalled &&
            (item.visibility === "PUBLIC" || item.isBuiltIn)
        )
        .filter(matchesSearchAndCategory),
    [items, matchesSearchAndCategory]
  )

  const mineItems = useMemo(
    () => items.filter((item) => item.isEditable).filter(matchesSearchAndCategory),
    [items, matchesSearchAndCategory]
  )

  const visibleTabs = useMemo(() => new Set(tabOrder), [tabOrder])
  const previewFallbackText = t("preview.cardPlaceholder")
  const builtInLabel = t("badges.builtIn")
  const draftLabel = t("badges.draft")
  const updateLabel = t("badges.updateAvailable")

  const runAction = async (key: string, action: () => Promise<void>) => {
    try {
      setActionKey(key)
      await action()
      await loadCatalog({ force: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("toasts.actionFailed")
      console.error("Document catalog action failed", message, error)
      toast.error(message)
    } finally {
      setActionKey(null)
    }
  }

  const handleInstall = (item: DocumentCatalogItem) =>
    void runAction(item.templateId, async () => {
      await installDocument(item.templateId, undefined, locale)
      toast.success(t("toasts.installed", { title: item.title }))
    })

  const handleUpdate = (item: DocumentCatalogItem) =>
    void runAction(item.templateId, async () => {
      await installDocument(item.templateId, undefined, locale)
      toast.success(t("toasts.updated", { title: item.title }))
    })

  const handlePublish = (item: DocumentCatalogItem) =>
    void runAction(item.templateId, async () => {
      const response = await fetch(`/api/documents/${item.templateId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      })
      if (!response.ok) {
        throw new Error(t("toasts.publishFailed"))
      }
      toast.success(t("toasts.published", { title: item.title }))
    })

  const handleUnpublish = (item: DocumentCatalogItem) =>
    void runAction(item.templateId, async () => {
      const response = await fetch(`/api/documents/${item.templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: "PRIVATE" }),
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t("toasts.unpublishFailed"))
        )
      }
      toast.success(t("toasts.unpublished", { title: item.title }))
    })

  const handleDelete = (item: DocumentCatalogItem) =>
    void runAction(item.templateId, async () => {
      const response = await fetch(`/api/documents/${item.templateId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t("toasts.deleteFailed"))
        )
      }

      // Keep workspace tabs/install list in sync after template deletion.
      await loadWorkspaceSnapshot({ force: true, locale }).catch((error) => {
        console.error("Failed to refresh workspace after deleting template", error)
      })

      toast.success(t("toasts.deleted", { title: item.title }))
    })

  const handleFork = (item: DocumentCatalogItem) =>
    void runAction(item.templateId, async () => {
      const response = await fetch(`/api/documents/${item.templateId}/fork`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error(t("toasts.forkFailed"))
      }
      const payload = (await response.json()) as { id: string }
      toast.success(t("toasts.copied", { title: item.title }))
      openEdit(payload.id)
      setPreviewItem(null)
    })

  const handleSetTabEnabled = (item: DocumentCatalogItem, enabled: boolean) =>
    void runAction(`tab:${item.templateId}`, async () => {
      await setDocumentTabEnabled(item.templateId, enabled, locale)
      toast.success(
        enabled
          ? t("toasts.tabEnabled", { title: item.title })
          : t("toasts.tabDisabled", { title: item.title })
      )
    })

  const visibleItemList = isMineView ? mineItems : installableCatalogItems
  const confirmUnpublish = () => {
    if (!unpublishTarget) return
    const target = unpublishTarget
    setUnpublishTarget(null)
    handleUnpublish(target)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleteTarget(null)
    handleDelete(target)
  }

  const handleViewChange = (nextMode: string) => {
    if (nextMode !== "catalog" && nextMode !== "mine") return
    if (nextMode === viewMode) return
    router.push(nextMode === "catalog" ? "/documents" : "/documents/mine")
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="@container/documents mx-auto flex w-full max-w-7xl min-h-0 flex-1 flex-col">
          <DocumentsHeader
            title={isMineView ? t("titles.mine") : t("titles.catalog")}
            subtitle={isMineView ? t("subtitles.mine") : t("subtitles.catalog")}
            actions={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button size="sm" className="gap-1.5" onClick={() => openCreate()}>
                  <IconPlus className="size-4" />
                  {t("newDocument")}
                </Button>
              </div>
            }
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="px-4 py-4 lg:px-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full min-w-0 md:flex-1"
                  />
                  {toolbarReady ? (
                    <Tabs
                      value={viewMode}
                      onValueChange={handleViewChange}
                      className="shrink-0 self-end md:self-auto"
                    >
                      <TabsList>
                        <TabsTrigger value="catalog" className="gap-1.5">
                          <IconFolder className="size-3.5" />
                          {t("views.catalog")}
                        </TabsTrigger>
                        <TabsTrigger value="mine" className="gap-1.5">
                          <IconFileText className="size-3.5" />
                          {t("views.mine")}
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="h-9 w-[7.5rem] shrink-0 self-end rounded-lg border border-transparent md:self-auto"
                    />
                  )}
                </div>
                {toolbarReady ? (
                  <div className="flex flex-wrap items-center justify-start gap-2">
                    <Select
                      value={categoryFilter}
                      onValueChange={(value) =>
                        setCategoryFilter(value as CategoryFilter)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className={getFilterTriggerClass(categoryFilter !== "all")}
                      >
                        <SelectValue placeholder={t("filters.categoryAll")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("filters.categoryAll")}</SelectItem>
                        {DOCUMENT_CATEGORY_OPTIONS.map((categoryOption) => (
                          <SelectItem
                            key={categoryOption.value}
                            value={categoryOption.value}
                          >
                            {tBuilder(categoryOption.labelKey as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={languageFilter}
                      onValueChange={(value) =>
                        setLanguageFilter(value as LanguageFilter)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        className={getFilterTriggerClass(languageFilter !== "all")}
                      >
                        <SelectValue placeholder={t("filters.languageAll")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("filters.languageAll")}</SelectItem>
                        {DOCUMENT_LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {tMeta(option.labelKey as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={regionFilter}
                      onValueChange={(value) => setRegionFilter(value as RegionFilter)}
                    >
                      <SelectTrigger
                        size="sm"
                        className={getFilterTriggerClass(regionFilter !== "all")}
                      >
                        <SelectValue placeholder={t("filters.regionAll")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("filters.regionAll")}</SelectItem>
                        {DOCUMENT_REGION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {tMeta(option.labelKey as never)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <DocumentStoreFilterPlaceholder />
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
              <div className="space-y-6">
                {!isMineView ? (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold">{t("sections.installedTitle")}</h2>
                      <Badge variant="secondary">{installedItems.length}</Badge>
                    </div>

                    {!workspaceLoaded && workspaceLoading ? (
                      <div className="flex min-h-24 items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 px-4 py-10 text-sm text-muted-foreground">
                        <IconLoader2 className="size-4 animate-spin" />
                        {t("status.loadingInstalled")}
                      </div>
                    ) : installedItems.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
                        {t("status.installedEmpty")}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-x-4 gap-y-7 @xl/documents:grid-cols-2 @4xl/documents:grid-cols-3">
                        {installedItems.map((item) => {
                          const categoryLabel = tBuilder(
                            getDocumentCategoryLabelKey(item.category) as never
                          )
                          const languageLabel = tMeta(
                            `languages.${item.language}` as never
                          )
                          const regionLabel = tMeta(`regions.${item.region}` as never)
                          const installCountLabel = null

                          return (
                            <DocumentPreviewCard
                              key={`installed:${item.templateId}`}
                              title={item.title}
                              description={item.description}
                              categoryLabel={categoryLabel}
                              languageLabel={languageLabel}
                              regionLabel={regionLabel}
                              preview={
                                <DocumentPreviewContent
                                  preview={item.preview}
                                  variant="card"
                                  placeholder={previewFallbackText}
                                />
                              }
                              previewHasContent={!!item.preview.previewContent}
                              builtInLabel={builtInLabel}
                              isBuiltIn={item.isBuiltIn}
                              draftLabel={draftLabel}
                              isDraft={item.visibility !== "PUBLIC"}
                              updateLabel={updateLabel}
                              hasUpdate={item.hasUpdate}
                              authorName={item.authorName}
                              installCountLabel={installCountLabel}
                              onClick={() => setPreviewItem(item)}
                              workspaceVisible={visibleTabs.has(
                                buildDocumentTabId(item.templateId)
                              )}
                              workspaceToggleBusy={
                                actionKey === item.templateId ||
                                actionKey === `tab:${item.templateId}`
                              }
                              workspaceShownLabel={t("actions.showInWorkspace")}
                              workspaceHiddenLabel={t("actions.hideFromWorkspace")}
                              onWorkspaceVisibilityChange={(enabled) =>
                                handleSetTabEnabled(item, enabled)
                              }
                            />
                          )
                        })}
                      </div>
                    )}
                  </section>
                ) : null}

                <section className="space-y-3">
                  <h2 className="text-sm font-semibold">
                    {isMineView
                      ? t("sections.mineTitle")
                      : t("sections.catalogTitle")}
                  </h2>

                  {!hasLoadedCatalog && loading ? (
                    <div className="flex min-h-40 items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 px-6 py-16 text-sm text-muted-foreground">
                      <IconLoader2 className="size-4 animate-spin" />
                      {t("status.loadingCatalog")}
                    </div>
                  ) : visibleItemList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/70 px-6 py-16 text-center text-sm text-muted-foreground">
                      {isMineView ? t("status.mineEmpty") : t("status.catalogEmpty")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-x-4 gap-y-7 @xl/documents:grid-cols-2 @4xl/documents:grid-cols-3">
                      {visibleItemList.map((item) => {
                        const categoryLabel = tBuilder(
                          getDocumentCategoryLabelKey(item.category) as never
                        )
                        const languageLabel = tMeta(
                          `languages.${item.language}` as never
                        )
                        const regionLabel = tMeta(`regions.${item.region}` as never)
                        const installCountLabel =
                          item.visibility === "PUBLIC"
                            ? formatNumber(item.installCount, uiLocale)
                            : null

                        return (
                          <DocumentPreviewCard
                            key={`list:${item.templateId}`}
                            title={item.title}
                            description={item.description}
                            categoryLabel={categoryLabel}
                            languageLabel={languageLabel}
                            regionLabel={regionLabel}
                            preview={
                              <DocumentPreviewContent
                                preview={item.preview}
                                variant="card"
                                placeholder={previewFallbackText}
                              />
                            }
                            previewHasContent={!!item.preview.previewContent}
                            builtInLabel={builtInLabel}
                            isBuiltIn={item.isBuiltIn}
                            draftLabel={draftLabel}
                            isDraft={item.visibility !== "PUBLIC"}
                            updateLabel={updateLabel}
                            hasUpdate={item.hasUpdate}
                            authorName={item.authorName}
                            installCountLabel={installCountLabel}
                            onClick={() => setPreviewItem(item)}
                          />
                        )
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </div>

        <DocumentCatalogPreviewDialog
          item={previewItem}
          open={previewItem !== null}
          mode={viewMode}
          actionKey={actionKey}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewItem(null)
            }
          }}
          onInstall={(item) => {
            setPreviewItem(null)
            handleInstall(item)
          }}
          onUpdate={(item) => {
            setPreviewItem(null)
            handleUpdate(item)
          }}
          onEdit={(item) => {
            setPreviewItem(null)
            openEdit(item.templateId)
          }}
          onPublish={(item) => {
            setPreviewItem(null)
            handlePublish(item)
          }}
          onFork={handleFork}
          onUnpublish={(item) => {
            setPreviewItem(null)
            setUnpublishTarget(item)
          }}
          onDelete={(item) => {
            setPreviewItem(null)
            setDeleteTarget(item)
          }}
        />
      </div>

      <AlertDialog
        open={unpublishTarget !== null}
        onOpenChange={(open) => {
          if (!open) setUnpublishTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.unpublishTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.unpublishDescription", {
                title: unpublishTarget?.title ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnpublish}>
              {t("confirm.unpublishAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm.deleteDescription", {
                title: deleteTarget?.title ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {t("confirm.deleteAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
