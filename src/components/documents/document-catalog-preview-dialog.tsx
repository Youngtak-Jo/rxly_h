"use client"

import { useEffect, useMemo, useState } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { DocumentPreviewContent } from "@/components/documents/document-preview-content"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getDocumentCategoryLabelKey } from "@/lib/documents/categories"
import {
  getDocumentLanguageOptions,
  getDocumentRegionOptions,
} from "@/lib/documents/language-region"
import type { DocumentCatalogItem, DocumentPreviewResponse } from "@/types/document"

const DOCUMENT_LANGUAGE_LABELS = new Map(
  getDocumentLanguageOptions().map((option) => [option.value, option.labelKey])
)
const DOCUMENT_REGION_LABELS = new Map(
  getDocumentRegionOptions().map((option) => [option.value, option.labelKey])
)

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
    // Ignore malformed payloads and fall back.
  }

  return `${fallback} (${response.status})`
}

export function DocumentCatalogPreviewDialog({
  item,
  open,
  mode,
  actionKey,
  onOpenChange,
  onInstall,
  onUpdate,
  onEdit,
  onPublish,
  onFork,
  onUnpublish,
  onDelete,
}: {
  item: DocumentCatalogItem | null
  open: boolean
  mode: "catalog" | "mine"
  actionKey: string | null
  onOpenChange: (open: boolean) => void
  onInstall: (item: DocumentCatalogItem) => void
  onUpdate: (item: DocumentCatalogItem) => void
  onEdit: (item: DocumentCatalogItem) => void
  onPublish: (item: DocumentCatalogItem) => void
  onFork: (item: DocumentCatalogItem) => void
  onUnpublish: (item: DocumentCatalogItem) => void
  onDelete: (item: DocumentCatalogItem) => void
}) {
  const t = useTranslations("DocumentStore")
  const tBuilder = useTranslations("DocumentBuilder")
  const tMeta = useTranslations("DocumentMetadata")
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<DocumentPreviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !item) {
      setPreview(null)
      setError(null)
      setLoading(false)
      return
    }

    if (item.preview.previewContent) {
      setPreview(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    const loadPreview = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/documents/${item.templateId}/preview?locale=${encodeURIComponent(locale)}`
        )
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, t("preview.loadFailed"))
          )
        }
        const payload = (await response.json()) as DocumentPreviewResponse
        if (cancelled) return
        setPreview(payload)
      } catch (fetchError) {
        if (cancelled) return
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : t("preview.loadFailed")
        setError(message)
        toast.error(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [item, locale, open, t])

  const effectivePreview = useMemo(() => preview ?? item?.preview ?? null, [
    item,
    preview,
  ])

  const categoryLabel = item
    ? tBuilder(getDocumentCategoryLabelKey(item.category) as never)
    : null
  const languageLabel = item
    ? tMeta(
        (DOCUMENT_LANGUAGE_LABELS.get(item.language) ?? "languages.en") as never
      )
    : null
  const regionLabel = item
    ? tMeta(
        (DOCUMENT_REGION_LABELS.get(item.region) ?? "regions.global") as never
      )
    : null

  const isBusy = item
    ? actionKey === item.templateId || actionKey === `tab:${item.templateId}`
    : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,56rem)] max-w-[min(72rem,calc(100vw-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-[min(72rem,calc(100vw-3rem))]">
        <DialogHeader className="shrink-0 border-b bg-background/95 px-5 py-4 pr-14 backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-6 sm:py-5 sm:pr-16">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <DialogTitle className="text-left text-xl leading-tight">
                {item?.title || preview?.title || t("preview.dialogTitle")}
              </DialogTitle>
              <DialogDescription className="text-left">
                {item?.description || preview?.description || ""}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2">
                {effectivePreview ? (
                  <Badge variant="outline">
                    {effectivePreview.previewKind === "BUILT_IN_STATIC"
                      ? t("preview.staticBadge")
                      : t("preview.syntheticBadge")}
                  </Badge>
                ) : null}
                {effectivePreview?.versionNumber ? (
                  <Badge variant="secondary">
                    {t("badges.publishedVersion", {
                      version: effectivePreview.versionNumber,
                    })}
                  </Badge>
                ) : null}
                {categoryLabel ? <Badge variant="outline">{categoryLabel}</Badge> : null}
                {languageLabel ? (
                  <Badge variant="outline">{languageLabel}</Badge>
                ) : null}
                {regionLabel ? <Badge variant="outline">{regionLabel}</Badge> : null}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-5xl px-5 py-5 sm:px-6 sm:py-6">
            {loading ? (
              <div className="flex min-h-56 items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-sm text-muted-foreground">
                <IconLoader2 className="size-4 animate-spin" />
                {t("preview.loading")}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-sm text-destructive">
                {error}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-border/70 bg-card px-4 py-4 shadow-sm sm:px-6 sm:py-5">
                <DocumentPreviewContent
                  preview={effectivePreview}
                  placeholder={t("preview.cardPlaceholder")}
                />
              </div>
            )}
          </div>
        </div>

        {item ? (
          <div className="shrink-0 border-t bg-background/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/90 sm:px-6">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="flex flex-wrap gap-2">
                {item.canInstall && !item.isInstalled ? (
                  <Button disabled={isBusy} onClick={() => onInstall(item)}>
                    {isBusy ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
                    {t("actions.install")}
                  </Button>
                ) : null}

                {item.hasUpdate ? (
                  <Button
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onUpdate(item)}
                  >
                    {t("actions.update")}
                  </Button>
                ) : null}

                {item.isEditable ? (
                  <Button variant="secondary" onClick={() => onEdit(item)}>
                    {t("actions.edit")}
                  </Button>
                ) : null}

                {mode === "mine" && item.canPublish ? (
                  <Button
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onPublish(item)}
                  >
                    {t("actions.publish")}
                  </Button>
                ) : null}

                {mode === "mine" && item.isEditable && item.visibility === "PUBLIC" ? (
                  <Button
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onUnpublish(item)}
                  >
                    {t("actions.unpublish")}
                  </Button>
                ) : null}

                {mode === "mine" && item.isEditable ? (
                  <Button
                    variant="destructive"
                    disabled={isBusy}
                    onClick={() => onDelete(item)}
                  >
                    {t("actions.delete")}
                  </Button>
                ) : null}

                {mode === "catalog" && item.canFork ? (
                  <Button
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => onFork(item)}
                  >
                    {t("actions.fork")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
