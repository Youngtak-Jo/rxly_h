"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconRosetteDiscountCheckFilled,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { DocumentCatalogPreviewDialog } from "@/components/documents/document-catalog-preview-dialog"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getDocumentCategoryLabelKey,
  getDocumentCategoryOptions,
  normalizeDocumentCategory,
  type DocumentCategory,
} from "@/lib/documents/categories"
import { buildDocumentTabId } from "@/lib/documents/constants"
import { useDocumentBuilderDialogStore } from "@/stores/document-builder-dialog-store"
import { useDocumentCatalogStore } from "@/stores/document-catalog-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import type {
  DocumentBuilderDialogMode,
  DocumentCatalogItem,
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

const DOCUMENT_CATEGORY_OPTIONS = getDocumentCategoryOptions()
const CATALOG_CACHE_KEY = "all"
const catalogCache = new Map<string, DocumentCatalogItem[]>()
const inFlightCatalogRequests = new Map<string, Promise<DocumentCatalogItem[]>>()

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
    iconKey: installed.iconKey,
    category: normalizeDocumentCategory(installed.category),
    authorName: installed.sourceKind === "BUILT_IN" ? "Rxly" : "You",
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
      hasPreview: false,
      caseSummary: null,
      locale: null,
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
  const locale = useLocale()
  const router = useRouter()

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
  const [items, setItems] = useState<DocumentCatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<DocumentCatalogItem | null>(null)
  const [unpublishTarget, setUnpublishTarget] =
    useState<DocumentCatalogItem | null>(null)
  const initialIntentAppliedRef = useRef(false)

  const loadCatalog = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false
      const cacheKey = CATALOG_CACHE_KEY

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
            const response = await fetch("/api/documents/catalog")
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
    [t]
  )

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (refreshKey === 0) return
    void loadCatalog({ force: true })
  }, [loadCatalog, refreshKey])

  useEffect(() => {
    void loadWorkspaceSnapshot().catch((error) => {
      const message =
        error instanceof Error
          ? error.message
          : t("toasts.workspaceLoadFailed")
      toast.error(message)
    })
  }, [loadWorkspaceSnapshot, t])

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

      const normalizedQuery = query.trim().toLowerCase()
      if (!normalizedQuery) return true

      const haystack = [
        item.title,
        item.description,
        item.authorName,
        normalizeDocumentCategory(item.category),
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    },
    [categoryFilter, query]
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
      ),
    [catalogByTemplateId, installedDocuments]
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
      await installDocument(item.templateId)
      toast.success(t("toasts.installed", { title: item.title }))
    })

  const handleUpdate = (item: DocumentCatalogItem) =>
    void runAction(item.templateId, async () => {
      await installDocument(item.templateId)
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
      await setDocumentTabEnabled(item.templateId, enabled)
      toast.success(
        enabled
          ? t("toasts.tabEnabled", { title: item.title })
          : t("toasts.tabDisabled", { title: item.title })
      )
    })

  const visibleItemList = isMineView ? mineItems : installableCatalogItems

  const handleRefresh = () => {
    void loadCatalog({ force: true })
    void loadWorkspaceSnapshot({ force: true }).catch((error) => {
      const message =
        error instanceof Error
          ? error.message
          : t("toasts.workspaceLoadFailed")
      toast.error(message)
    })
  }

  const confirmUnpublish = () => {
    if (!unpublishTarget) return
    const target = unpublishTarget
    setUnpublishTarget(null)
    handleUnpublish(target)
  }

  const handleViewChange = (nextMode: string) => {
    if (nextMode !== "catalog" && nextMode !== "mine") return
    if (nextMode === viewMode) return
    router.push(nextMode === "catalog" ? "/documents" : "/documents/mine")
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DocumentsHeader
          title={isMineView ? t("titles.mine") : t("titles.catalog")}
          subtitle={isMineView ? t("subtitles.mine") : t("subtitles.catalog")}
          actions={
            <div className="flex items-center gap-2">
              <Tabs value={viewMode} onValueChange={handleViewChange} className="gap-0">
                <TabsList>
                  <TabsTrigger value="catalog">{t("views.catalog")}</TabsTrigger>
                  <TabsTrigger value="mine">{t("views.mine")}</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button size="sm" className="gap-1.5" onClick={() => openCreate()}>
                <IconPlus className="size-4" />
                {t("newDocument")}
              </Button>
            </div>
          }
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="border-b px-4 py-4 lg:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="max-w-xl"
              />
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}
              >
                <SelectTrigger className="w-full lg:w-[260px]">
                  <SelectValue placeholder={t("filters.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.categoryAll")}</SelectItem>
                  {DOCUMENT_CATEGORY_OPTIONS.map((categoryOption) => (
                    <SelectItem key={categoryOption.value} value={categoryOption.value}>
                      {tBuilder(categoryOption.labelKey as never)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={handleRefresh}
              >
                <IconRefresh className="size-3.5" />
                {t("actions.refresh")}
              </Button>
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
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {installedItems.map((item) => {
                        const tabVisible = visibleTabs.has(
                          buildDocumentTabId(item.templateId)
                        )
                        const isBusy =
                          actionKey === item.templateId ||
                          actionKey === `tab:${item.templateId}`

                        return (
                          <div
                            key={`installed:${item.templateId}`}
                            role="button"
                            tabIndex={0}
                            className="cursor-pointer rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:border-border hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => setPreviewItem(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                setPreviewItem(item)
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                                  {item.isBuiltIn ? (
                                    <IconRosetteDiscountCheckFilled
                                      className="size-4 shrink-0 text-sky-500"
                                      title={t("badges.builtIn")}
                                      aria-label={t("badges.builtIn")}
                                    />
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {item.visibility !== "PUBLIC" ? (
                                    <Badge variant="outline">{t("badges.draft")}</Badge>
                                  ) : null}
                                  {item.hasUpdate ? <Badge>{t("badges.updateAvailable")}</Badge> : null}
                                </div>
                                <p className="line-clamp-2 text-xs text-muted-foreground">
                                  {item.description}
                                </p>
                              </div>
                              <div
                                className="flex shrink-0 items-center gap-2"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Switch
                                  checked={tabVisible}
                                  disabled={isBusy}
                                  onCheckedChange={(checked) =>
                                    handleSetTabEnabled(item, checked)
                                  }
                                />
                              </div>
                            </div>
                          </div>
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
                  <div className="space-y-2">
                    {loading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <IconLoader2 className="size-4 animate-spin" />
                        {t("status.updatingCatalog")}
                      </div>
                    ) : null}

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {visibleItemList.map((item) => {
                        const isBusy = actionKey === item.templateId
                        const categoryLabel = tBuilder(
                          getDocumentCategoryLabelKey(item.category) as never
                        )

                        return (
                          <div
                            key={`list:${item.templateId}`}
                            role="button"
                            tabIndex={0}
                            className="cursor-pointer rounded-2xl border border-border/70 bg-card p-4 text-left transition hover:border-border hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => setPreviewItem(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                setPreviewItem(item)
                              }
                            }}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                                {item.isBuiltIn ? (
                                  <IconRosetteDiscountCheckFilled
                                    className="size-4 shrink-0 text-sky-500"
                                    title={t("badges.builtIn")}
                                    aria-label={t("badges.builtIn")}
                                  />
                                ) : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {item.visibility !== "PUBLIC" ? (
                                  <Badge variant="outline">{t("badges.draft")}</Badge>
                                ) : null}
                              </div>

                              <p className="line-clamp-2 text-xs text-muted-foreground">
                                {item.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>{item.authorName}</span>
                                <span>&middot;</span>
                                <span>{categoryLabel}</span>
                                {item.publishedVersionNumber ? (
                                  <>
                                    <span>&middot;</span>
                                    <span>
                                      {t("badges.publishedVersion", {
                                        version: item.publishedVersionNumber,
                                      })}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            {!isMineView && item.canInstall ? (
                              <div className="mt-3 flex justify-end" onClick={(event) => event.stopPropagation()}>
                                <Button
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() => handleInstall(item)}
                                >
                                  {isBusy ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
                                  {t("actions.install")}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </section>
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
    </>
  )
}
