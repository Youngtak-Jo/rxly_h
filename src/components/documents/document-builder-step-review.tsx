"use client"

import { IconLoader2, IconRefresh } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import { GenericDocumentPreview } from "@/components/documents/generic-document-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getDocumentCategoryLabelKey } from "@/lib/documents/categories"
import {
  getDocumentLanguageOptions,
  getDocumentRegionOptions,
} from "@/lib/documents/language-region"
import type { GenericDocumentSection } from "@/types/document"

const DOCUMENT_LANGUAGE_LABELS = new Map(
  getDocumentLanguageOptions().map((option) => [option.value, option.labelKey])
)
const DOCUMENT_REGION_LABELS = new Map(
  getDocumentRegionOptions().map((option) => [option.value, option.labelKey])
)

function PreviewStatusBadge({
  status,
}: {
  status: "idle" | "generating" | "ready" | "failed" | "stale"
}) {
  const t = useTranslations("DocumentBuilder")

  return (
    <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
      {status === "generating"
        ? t("preview.status.generating")
        : status === "failed"
          ? t("preview.status.failed")
          : status === "stale"
            ? t("preview.status.stale")
            : status === "ready"
              ? t("preview.status.ready")
              : t("preview.status.idle")}
    </span>
  )
}

export function DocumentBuilderStepReview({
  title,
  description,
  category,
  language,
  region,
  visibility,
  schemaNodeCount,
  contextSources,
  publishedVersionNumber,
  installedVersionNumber,
  previewSections,
  previewLocale,
  previewGeneratedAt,
  previewStatus,
  previewError,
  onRegeneratePreview,
}: {
  title: string
  description: string
  category: string
  language: "en" | "ko"
  region: "global" | "kr" | "us"
  visibility: "PRIVATE" | "PUBLIC"
  schemaNodeCount: number
  contextSources: string[]
  publishedVersionNumber: number | null
  installedVersionNumber: number | null
  previewSections: GenericDocumentSection[]
  previewLocale: string | null
  previewGeneratedAt: string | null
  previewStatus: "idle" | "generating" | "ready" | "failed" | "stale"
  previewError: string | null
  onRegeneratePreview: () => void
}) {
  const t = useTranslations("DocumentBuilder")
  const tMeta = useTranslations("DocumentMetadata")
  const categoryLabel = t(getDocumentCategoryLabelKey(category) as never)
  const languageLabel = tMeta(
    (DOCUMENT_LANGUAGE_LABELS.get(language) ?? "languages.en") as never
  )
  const regionLabel = tMeta(
    (DOCUMENT_REGION_LABELS.get(region) ?? "regions.global") as never
  )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{t("review.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("review.description")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {publishedVersionNumber ? (
                <Badge variant="secondary">
                  {t("badges.publishedVersion", { version: publishedVersionNumber })}
                </Badge>
              ) : null}
              {installedVersionNumber ? (
                <Badge variant="outline">
                  {t("badges.installedVersion", { version: installedVersionNumber })}
                </Badge>
              ) : null}
            </div>
          </div>

          <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            <div className="space-y-1 border-b border-border/60 pb-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.title")}
              </dt>
              <dd className="text-sm font-medium">{title || "-"}</dd>
            </div>
            <div className="space-y-1 border-b border-border/60 pb-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.category")}
              </dt>
              <dd className="text-sm font-medium">{categoryLabel}</dd>
            </div>
            <div className="space-y-1 border-b border-border/60 pb-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.language")}
              </dt>
              <dd className="text-sm font-medium">{languageLabel}</dd>
            </div>
            <div className="space-y-1 border-b border-border/60 pb-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.region")}
              </dt>
              <dd className="text-sm font-medium">{regionLabel}</dd>
            </div>
            <div className="space-y-1 border-b border-border/60 pb-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.visibility")}
              </dt>
              <dd className="text-sm font-medium">
                {visibility === "PUBLIC"
                  ? t("templateSettings.visibility.public")
                  : t("templateSettings.visibility.private")}
              </dd>
            </div>
            <div className="space-y-1 border-b border-border/60 pb-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.schemaNodes")}
              </dt>
              <dd className="text-sm font-medium">
                {t("review.summary.schemaNodesValue", { count: schemaNodeCount })}
              </dd>
            </div>
            <div className="space-y-1 border-b border-border/60 pb-4 md:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.purpose")}
              </dt>
              <dd className="text-sm leading-6 text-foreground/90">
                {description || t("review.summary.none")}
              </dd>
            </div>
            <div className="space-y-1 border-b border-border/60 pb-4 md:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.contextSources")}
              </dt>
              <dd className="flex flex-wrap gap-2">
                {contextSources.length > 0 ? (
                  contextSources.map((source) => (
                    <Badge key={source} variant="outline">
                      {t(`contextSources.${source}` as never)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm font-medium">{t("review.summary.none")}</span>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">
                    {t("preview.renderedTitle")}
                  </h2>
                  <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t("preview.syntheticBadge")}
                  </span>
                  <PreviewStatusBadge status={previewStatus} />
                  {previewLocale ? (
                    <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {previewLocale.toUpperCase()}
                    </span>
                  ) : null}
                </div>

                <p className="text-sm text-muted-foreground">
                  {t("preview.renderedDescription")}
                </p>

                {previewStatus === "stale" ? (
                  <p className="text-sm text-muted-foreground">
                    {t("preview.staleDescription")}
                  </p>
                ) : null}

                {previewGeneratedAt ? (
                  <p className="text-xs text-muted-foreground">
                    {t("preview.generatedAt", {
                      value: new Date(previewGeneratedAt).toLocaleString(),
                    })}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                className="gap-1.5 self-start"
                onClick={onRegeneratePreview}
              >
                {previewStatus === "generating" ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconRefresh className="size-4" />
                )}
                {t("preview.regenerate")}
              </Button>
            </div>

            {previewError ? (
              <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {previewError}
              </div>
            ) : null}
          </div>

          <div className="px-5 py-6 sm:px-6">
            <GenericDocumentPreview sections={previewSections} />
          </div>
        </section>
      </div>
    </div>
  )
}
