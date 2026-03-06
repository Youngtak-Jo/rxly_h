"use client"

import { IconLoader2, IconRefresh } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import { GenericDocumentPreview } from "@/components/documents/generic-document-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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

  const variant =
    status === "failed"
      ? "destructive"
      : status === "generating"
        ? "secondary"
        : "outline"

  return (
    <Badge variant={variant} className="text-[11px] font-normal">
      {status === "generating"
        ? t("preview.status.generating")
        : status === "failed"
          ? t("preview.status.failed")
          : status === "stale"
            ? t("preview.status.stale")
            : status === "ready"
              ? t("preview.status.ready")
              : t("preview.status.idle")}
    </Badge>
  )
}

export function DocumentBuilderStepReview({
  title,
  description,
  category,
  language,
  region,
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
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {/* ── Summary card ── */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base">{t("review.title")}</CardTitle>
                <CardDescription className="text-xs">
                  {t("review.description")}
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {publishedVersionNumber ? (
                  <Badge variant="secondary" className="text-[11px]">
                    {t("badges.publishedVersion", { version: publishedVersionNumber })}
                  </Badge>
                ) : null}
                {installedVersionNumber ? (
                  <Badge variant="outline" className="text-[11px]">
                    {t("badges.installedVersion", { version: installedVersionNumber })}
                  </Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <SummaryRow
                label={t("review.summary.title")}
                value={title || "-"}
              />
              <SummaryRow
                label={t("review.summary.category")}
                value={categoryLabel}
              />
              <SummaryRow
                label={t("review.summary.language")}
                value={languageLabel}
              />
              <SummaryRow
                label={t("review.summary.region")}
                value={regionLabel}
              />
              <SummaryRow
                label={t("review.summary.schemaNodes")}
                value={t("review.summary.schemaNodesValue", {
                  count: schemaNodeCount,
                })}
              />
            </dl>

            <Separator className="my-4" />

            <dl className="space-y-3 text-sm">
              <SummaryRow
                label={t("review.summary.purpose")}
                value={description || t("review.summary.none")}
                block
              />
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground">
                  {t("review.summary.contextSources")}
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {contextSources.length > 0 ? (
                    contextSources.map((source) => (
                      <Badge key={source} variant="outline" className="text-[11px] font-normal">
                        {t(`contextSources.${source}` as never)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t("review.summary.none")}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* ── Preview card ── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">
                    {t("preview.renderedTitle")}
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {t("preview.syntheticBadge")}
                  </Badge>
                  <PreviewStatusBadge status={previewStatus} />
                  {previewLocale ? (
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {previewLocale.toUpperCase()}
                    </Badge>
                  ) : null}
                </div>

                <CardDescription className="text-xs">
                  {t("preview.renderedDescription")}
                </CardDescription>

                {previewStatus === "stale" ? (
                  <p className="text-xs text-muted-foreground">
                    {t("preview.staleDescription")}
                  </p>
                ) : null}

                {previewGeneratedAt ? (
                  <p className="text-[11px] text-muted-foreground">
                    {t("preview.generatedAt", {
                      value: new Date(previewGeneratedAt).toLocaleString(),
                    })}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 self-start"
                onClick={onRegeneratePreview}
              >
                {previewStatus === "generating" ? (
                  <IconLoader2 className="size-3.5 animate-spin" />
                ) : (
                  <IconRefresh className="size-3.5" />
                )}
                {t("preview.regenerate")}
              </Button>
            </div>

            {previewError ? (
              <p className="mt-2 text-sm text-destructive">{previewError}</p>
            ) : null}
          </CardHeader>

          <CardContent>
            <GenericDocumentPreview sections={previewSections} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  block = false,
}: {
  label: string
  value: string
  block?: boolean
}) {
  return (
    <div className={`space-y-0.5 ${block ? "sm:col-span-2" : ""}`}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium leading-snug">{value}</dd>
    </div>
  )
}
