"use client"

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { IconLoader2, IconPlus, IconRefresh } from "@tabler/icons-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DocumentCatalogPreviewDialog } from "@/components/documents/document-catalog-preview-dialog"
import { DocumentsHeader } from "@/components/documents/documents-header"
import { useDocumentBuilderDialogStore } from "@/stores/document-builder-dialog-store"
import { useDocumentCatalogStore } from "@/stores/document-catalog-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import type { DocumentBuilderDialogMode, DocumentCatalogItem } from "@/types/document"

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

type CatalogFilter = "all" | "installed" | "built-in" | "mine" | "public"

const FILTERS: CatalogFilter[] = [
  "all",
  "installed",
  "built-in",
  "mine",
  "public",
]

const catalogCache = new Map<string, DocumentCatalogItem[]>()
const inFlightCatalogRequests = new Map<string, Promise<DocumentCatalogItem[]>>()

function matchesFilter(item: DocumentCatalogItem, filter: CatalogFilter) {
  switch (filter) {
    case "installed":
      return item.isInstalled
    case "built-in":
      return item.isBuiltIn
    case "mine":
      return item.isEditable || item.visibility === "PRIVATE"
    case "public":
      return item.visibility === "PUBLIC" && !item.isBuiltIn
    default:
      return true
  }
}

function filterLabel(
  filter: CatalogFilter,
  t: ReturnType<typeof useTranslations>
) {
  switch (filter) {
    case "installed":
      return t("filters.installed")
    case "built-in":
      return t("filters.builtIn")
    case "mine":
      return t("filters.mine")
    case "public":
      return t("filters.public")
    default:
      return t("filters.all")
  }
}

export function DocumentStorePage({
  initialDialogIntent,
}: {
  initialDialogIntent?: {
    mode: DocumentBuilderDialogMode
    templateId?: string | null
    routeBacked: boolean
  }
}) {
  const t = useTranslations("DocumentStore")
  const locale = useLocale()
  const openCreate = useDocumentBuilderDialogStore((state) => state.openCreate)
  const openEdit = useDocumentBuilderDialogStore((state) => state.openEdit)
  const refreshKey = useDocumentCatalogStore((state) => state.refreshKey)
  const installDocument = useDocumentWorkspaceStore((state) => state.installDocument)
  const uninstallDocument = useDocumentWorkspaceStore(
    (state) => state.uninstallDocument
  )

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<CatalogFilter>("all")
  const [items, setItems] = useState<DocumentCatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<DocumentCatalogItem | null>(null)
  const initialIntentAppliedRef = useRef(false)

  const deferredQuery = useDeferredValue(query)

  const loadCatalog = useCallback(async (options?: { force?: boolean }) => {
    const force = options?.force ?? false
    const cacheKey = deferredQuery.trim().toLowerCase()

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
            `/api/documents/catalog${deferredQuery ? `?q=${encodeURIComponent(deferredQuery)}` : ""}`
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
  }, [deferredQuery, t])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (refreshKey === 0) return
    void loadCatalog({ force: true })
  }, [loadCatalog, refreshKey])

  useEffect(() => {
    if (!initialDialogIntent || initialIntentAppliedRef.current) return
    initialIntentAppliedRef.current = true

    if (
      initialDialogIntent.mode === "edit" &&
      initialDialogIntent.templateId
    ) {
      openEdit(initialDialogIntent.templateId, {
        routeBacked: initialDialogIntent.routeBacked,
      })
      return
    }

    openCreate({ routeBacked: initialDialogIntent.routeBacked })
  }, [initialDialogIntent, openCreate, openEdit])

  const filteredItems = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [filter, items]
  )

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

  const handleUninstall = (item: DocumentCatalogItem) =>
    void runAction(item.templateId, async () => {
      await uninstallDocument(item.templateId)
      toast.success(t("toasts.removed", { title: item.title }))
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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DocumentsHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => openCreate()}
          >
            <IconPlus className="size-4" />
            {t("newDocument")}
          </Button>
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
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((nextFilter) => (
                <Button
                  key={nextFilter}
                  type="button"
                  size="sm"
                  variant={filter === nextFilter ? "default" : "outline"}
                  onClick={() => setFilter(nextFilter)}
                >
                  {filterLabel(nextFilter, t)}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1.5"
                onClick={() => void loadCatalog({ force: true })}
              >
                <IconRefresh className="size-3.5" />
                {t("actions.refresh")}
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
          {!hasLoadedCatalog && loading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              {t("status.loadingCatalog")}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 px-6 py-16 text-center text-sm text-muted-foreground">
              {t("status.empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconLoader2 className="size-4 animate-spin" />
                  {t("status.updatingCatalog")}
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                {filteredItems.map((item) => {
                  const isBusy = actionKey === item.templateId
                  return (
                    <div
                      key={item.templateId}
                      className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold">{item.title}</h2>
                          {item.isBuiltIn ? (
                            <Badge variant="secondary">{t("badges.builtIn")}</Badge>
                          ) : null}
                            {item.visibility === "PUBLIC" ? (
                              <Badge variant="outline">{t("badges.public")}</Badge>
                            ) : (
                              <Badge variant="outline">{t("badges.draft")}</Badge>
                            )}
                            {item.isInstalled ? (
                              <Badge variant="outline">{t("badges.installed")}</Badge>
                            ) : null}
                            {item.hasUpdate ? <Badge>{t("badges.updateAvailable")}</Badge> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          {item.preview.caseSummary ? (
                            <p className="line-clamp-2 text-sm text-foreground/80">
                              {item.preview.caseSummary}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{item.authorName}</span>
                            <span>&middot;</span>
                            <span>{item.category}</span>
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
                            {item.installedVersionNumber ? (
                              <>
                                <span>&middot;</span>
                                <span>
                                  {t("badges.installedVersion", {
                                    version: item.installedVersionNumber,
                                  })}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewItem(item)}
                        >
                          {t("actions.preview")}
                        </Button>

                        {item.canInstall && !item.isInstalled ? (
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleInstall(item)}
                          >
                            {isBusy ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
                            {t("actions.install")}
                          </Button>
                        ) : null}

                        {item.canUninstall ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleUninstall(item)}
                          >
                            {isBusy ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
                            {t("actions.uninstall")}
                          </Button>
                        ) : null}

                        {item.hasUpdate ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleUpdate(item)}
                          >
                            {t("actions.update")}
                          </Button>
                        ) : null}

                        {item.isEditable ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openEdit(item.templateId)}
                          >
                            {t("actions.edit")}
                          </Button>
                        ) : null}

                        {item.canPublish ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handlePublish(item)}
                          >
                            {t("actions.publish")}
                          </Button>
                        ) : null}

                        {item.canFork ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => handleFork(item)}
                          >
                            {t("actions.fork")}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <DocumentCatalogPreviewDialog
        item={previewItem}
        open={previewItem !== null}
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
        onUninstall={(item) => {
          setPreviewItem(null)
          handleUninstall(item)
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
      />
    </div>
  )
}
