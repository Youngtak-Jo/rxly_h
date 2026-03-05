"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IconFileText,
  IconFolder,
  IconLoader2,
  IconPlus,
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
      cardPreviewLines: [],
      cardPreviewKind: "EMPTY",
      locale: null,
      generatedAt: null,
    },
  }
}

function buildSummaryFallbackLines(summary: string): string[] {
  const normalized = summary.replace(/\s+/g, " ").trim()
  if (!normalized) return []

  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
}

function getCardPreviewLines(item: DocumentCatalogItem, fallback: string): string[] {
  if (item.preview.cardPreviewLines.length > 0) {
    return item.preview.cardPreviewLines
  }

  if (item.preview.caseSummary) {
    const summaryLines = buildSummaryFallbackLines(item.preview.caseSummary)
    if (summaryLines.length > 0) {
      return summaryLines
    }
  }

  return [fallback]
}

function DocumentPreviewCard({
  item,
  builtInLabel,
  draftLabel,
  updateLabel,
  publishedVersionLabel,
  categoryLabel,
  previewFallbackText,
  summaryPreviewLabel,
  cardHeaderLabel,
  workspaceVisible,
  workspaceToggleBusy,
  workspaceShownLabel,
  workspaceHiddenLabel,
  onWorkspaceVisibilityChange,
  onOpen,
}: {
  item: DocumentCatalogItem
  builtInLabel: string
  draftLabel: string
  updateLabel: string
  publishedVersionLabel: string | null
  categoryLabel: string
  previewFallbackText: string
  summaryPreviewLabel: string
  cardHeaderLabel: string
  workspaceVisible?: boolean
  workspaceToggleBusy?: boolean
  workspaceShownLabel?: string
  workspaceHiddenLabel?: string
  onWorkspaceVisibilityChange?: (next: boolean) => void
  onOpen: (item: DocumentCatalogItem) => void
}) {
  const previewLines = getCardPreviewLines(item, previewFallbackText)
  const previewKind = item.preview.cardPreviewKind
  const description = item.description.trim()

  const renderPreviewLine = (line: string, index: number) => {
    const separatorIndex = line.indexOf(": ")
    if (separatorIndex <= 0) {
      return (
        <p
          key={`${item.templateId}-preview-${index}`}
          className="line-clamp-1 border-b border-border/30 pb-1 text-[10px] leading-4 text-foreground/80 last:border-b-0"
        >
          {line}
        </p>
      )
    }

    const label = line.slice(0, separatorIndex)
    const value = line.slice(separatorIndex + 2)
    return (
      <p
        key={`${item.templateId}-preview-${index}`}
        className="line-clamp-1 border-b border-border/30 pb-1 text-[10px] leading-4 text-foreground/80 last:border-b-0"
      >
        <span className="font-semibold text-foreground/90">{label}:</span>{" "}
        {value}
      </p>
    )
  }

  return (
    <div className="group w-full">
      <button
        type="button"
        className="w-full cursor-pointer rounded-2xl text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onOpen(item)}
      >
        <div className="relative h-[14.5rem] overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-muted/20 transition group-hover:border-border group-hover:from-muted/55 group-hover:to-muted/35">
        <div className="absolute inset-x-6 top-6 h-px bg-border/35" />
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-5">
          <div className="w-full max-w-[66%] rounded-t-xl rounded-b-none border border-b-0 border-border/70 bg-card shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
            <div className="border-b border-border/50 px-3 py-2">
              <p className="line-clamp-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {cardHeaderLabel}
              </p>
            </div>

            <div className="space-y-1 px-3 py-2.5">
              {previewKind === "SUMMARY" ? (
                <p className="line-clamp-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/90">
                  {summaryPreviewLabel}
                </p>
              ) : null}
              {previewLines.map((line, index) => renderPreviewLine(line, index))}
            </div>
          </div>
        </div>
        </div>

        <div className="space-y-1.5 px-1 pt-3">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{item.title}</h3>
            {item.isBuiltIn ? (
              <IconRosetteDiscountCheckFilled
                className="size-4 shrink-0 text-sky-500"
                title={builtInLabel}
                aria-label={builtInLabel}
              />
            ) : null}
            {item.visibility !== "PUBLIC" ? (
              <Badge variant="outline" className="ml-auto">
                {draftLabel}
              </Badge>
            ) : null}
          </div>
          <p className="h-10 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {description || "\u00A0"}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{item.authorName}</span>
            <span>&middot;</span>
            <span>{categoryLabel}</span>
            {item.publishedVersionNumber ? (
              <>
                <span>&middot;</span>
                <span>{publishedVersionLabel}</span>
              </>
            ) : null}
            {item.hasUpdate ? (
              <Badge className="ml-auto" variant="secondary">
                {updateLabel}
              </Badge>
            ) : null}
          </div>
        </div>
      </button>

      {typeof workspaceVisible === "boolean" && onWorkspaceVisibilityChange ? (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {workspaceVisible ? workspaceShownLabel : workspaceHiddenLabel}
          </span>
          <Switch
            checked={workspaceVisible}
            disabled={workspaceToggleBusy}
            onCheckedChange={onWorkspaceVisibilityChange}
          />
        </div>
      ) : null}
    </div>
  )
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
  const previewFallbackText = t("preview.cardPlaceholder")
  const builtInLabel = t("badges.builtIn")
  const draftLabel = t("badges.draft")
  const updateLabel = t("badges.updateAvailable")
  const summaryPreviewLabel = t("preview.cardSummaryFallback")
  const cardHeaderLabel = t("preview.cardHeader")

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
            <div className="border-b px-4 py-4 lg:px-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full min-w-0 md:flex-1"
                  />
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
                </div>
                <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={categoryFilter === "all" ? "secondary" : "outline"}
                    className="h-7 rounded-full px-2.5 text-[11px]"
                    onClick={() => setCategoryFilter("all")}
                  >
                    {t("filters.categoryAll")}
                  </Button>
                  {DOCUMENT_CATEGORY_OPTIONS.map((categoryOption) => (
                    <Button
                      key={categoryOption.value}
                      type="button"
                      size="sm"
                      variant={
                        categoryFilter === categoryOption.value
                          ? "secondary"
                          : "outline"
                      }
                      className="h-7 rounded-full px-2.5 text-[11px]"
                      onClick={() => setCategoryFilter(categoryOption.value)}
                    >
                      {tBuilder(categoryOption.labelKey as never)}
                    </Button>
                  ))}
                </div>
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
                      <div className="grid grid-cols-1 gap-3 @xl/documents:grid-cols-2 @4xl/documents:grid-cols-3">
                        {installedItems.map((item) => {
                          const categoryLabel = tBuilder(
                            getDocumentCategoryLabelKey(item.category) as never
                          )

                          return (
                            <DocumentPreviewCard
                              key={`installed:${item.templateId}`}
                              item={item}
                              categoryLabel={categoryLabel}
                              previewFallbackText={previewFallbackText}
                              builtInLabel={builtInLabel}
                              draftLabel={draftLabel}
                              updateLabel={updateLabel}
                              publishedVersionLabel={
                                item.publishedVersionNumber
                                  ? t("badges.publishedVersion", {
                                      version: item.publishedVersionNumber,
                                    })
                                  : null
                              }
                              onOpen={setPreviewItem}
                              summaryPreviewLabel={summaryPreviewLabel}
                              cardHeaderLabel={cardHeaderLabel}
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
                    <div className="grid grid-cols-1 gap-3 @xl/documents:grid-cols-2 @4xl/documents:grid-cols-3">
                      {visibleItemList.map((item) => {
                        const categoryLabel = tBuilder(
                          getDocumentCategoryLabelKey(item.category) as never
                        )

                        return (
                          <DocumentPreviewCard
                            key={`list:${item.templateId}`}
                            item={item}
                            categoryLabel={categoryLabel}
                            previewFallbackText={previewFallbackText}
                            builtInLabel={builtInLabel}
                            draftLabel={draftLabel}
                            updateLabel={updateLabel}
                            publishedVersionLabel={
                              item.publishedVersionNumber
                                ? t("badges.publishedVersion", {
                                    version: item.publishedVersionNumber,
                                  })
                                : null
                            }
                            onOpen={setPreviewItem}
                            summaryPreviewLabel={summaryPreviewLabel}
                            cardHeaderLabel={cardHeaderLabel}
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
