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
import { getConfirmedDiagnosisRequirement } from "@/lib/documents/generation-requirements"
import { getDocumentCategoryLabelKey } from "@/lib/documents/categories"
import {
  getDocumentLanguageOptions,
  getDocumentRegionOptions,
} from "@/lib/documents/language-region"
import type {
  DocumentGenerationConfig,
  GenericDocumentSection,
} from "@/types/document"

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
  generationConfig,
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
  generationConfig: DocumentGenerationConfig
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
  const confirmedDiagnosisRequirement = getConfirmedDiagnosisRequirement(
    generationConfig
  )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-sm">{t("review.title")}</CardTitle>
                <CardDescription className="text-xs">
                  {t("review.description")}
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {publishedVersionNumber ? (
                  <Badge variant="secondary" className="text-[11px]">
                    {t("badges.publishedVersion", {
                      version: publishedVersionNumber,
                    })}
                  </Badge>
                ) : null}
                {installedVersionNumber ? (
                  <Badge variant="outline" className="text-[11px]">
                    {t("badges.installedVersion", {
                      version: installedVersionNumber,
                    })}
                  </Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4">
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
              <SummaryRow label={t("review.summary.title")} value={title || "-"} />
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
              <SummaryRow
                label={t("review.summary.clinicalBasis")}
                value={t(
                  generationConfig.clinicalContextDefault === "transcript"
                    ? "generationSettings.clinicalBasisTranscript"
                    : "generationSettings.clinicalBasisInsights"
                )}
              />
              <SummaryRow
                label={t("review.summary.includeSourceImages")}
                value={t(
                  generationConfig.includeSourceImages
                    ? "review.summary.enabled"
                    : "review.summary.disabled"
                )}
              />
              <SummaryRow
                label={t("review.summary.requireDiagnosisSelection")}
                value={t(
                  confirmedDiagnosisRequirement?.required
                    ? "review.summary.enabled"
                    : "review.summary.disabled"
                )}
              />
            </dl>

            <Separator className="my-4" />

            <dl className="space-y-3 text-sm">
              <SummaryRow
                label={t("review.summary.purpose")}
                value={description || t("review.summary.none")}
                block
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm">
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
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

              <div className="space-y-1">
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
            </div>
          </CardHeader>

          <CardContent className="px-4">
            {previewSections.length > 0 ? (
              <GenericDocumentPreview sections={previewSections} />
            ) : previewError ? (
              <p className="text-sm text-destructive">{previewError}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("preview.emptyRendered")}
              </p>
            )}
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
    <div className={block ? "space-y-1" : ""}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={block ? "text-sm" : "text-sm font-medium"}>{value}</dd>
    </div>
  )
}
