"use client"

import { IconLoader2 } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function DocumentBuilderStepReview({
  title,
  visibility,
  schemaNodeCount,
  contextSources,
  publishedVersionNumber,
  installedVersionNumber,
  saving,
  publishing,
  installing,
  canInstall,
  onSaveDraft,
  onPublish,
  onInstall,
}: {
  title: string
  visibility: "PRIVATE" | "PUBLIC"
  schemaNodeCount: number
  contextSources: string[]
  publishedVersionNumber: number | null
  installedVersionNumber: number | null
  saving: boolean
  publishing: boolean
  installing: boolean
  canInstall: boolean
  onSaveDraft: () => Promise<void>
  onPublish: () => Promise<void>
  onInstall: () => Promise<void>
}) {
  const t = useTranslations("DocumentBuilder")

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
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

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-xl border border-border/70 bg-background px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.title")}
              </dt>
              <dd className="text-sm font-medium">{title || "-"}</dd>
            </div>
            <div className="space-y-1 rounded-xl border border-border/70 bg-background px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.visibility")}
              </dt>
              <dd className="text-sm font-medium">
                {visibility === "PUBLIC"
                  ? t("templateSettings.visibility.public")
                  : t("templateSettings.visibility.private")}
              </dd>
            </div>
            <div className="space-y-1 rounded-xl border border-border/70 bg-background px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.schemaNodes")}
              </dt>
              <dd className="text-sm font-medium">
                {t("review.summary.schemaNodesValue", { count: schemaNodeCount })}
              </dd>
            </div>
            <div className="space-y-1 rounded-xl border border-border/70 bg-background px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("review.summary.contextSources")}
              </dt>
              <dd className="flex flex-wrap gap-2">
                {contextSources.length > 0 ? (
                  contextSources.map((source) => (
                    <Badge key={source} variant="outline">
                      {t(`contextSources.${source as never}`)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm font-medium">{t("review.summary.none")}</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={saving} onClick={() => void onSaveDraft()}>
            {saving ? <IconLoader2 className="size-4 animate-spin" /> : null}
            {t("headerActions.saveDraft")}
          </Button>
          <Button type="button" variant="outline" disabled={publishing} onClick={() => void onPublish()}>
            {publishing ? <IconLoader2 className="size-4 animate-spin" /> : null}
            {t("headerActions.publish")}
          </Button>
          <Button type="button" disabled={installing || !canInstall} onClick={() => void onInstall()}>
            {installing ? <IconLoader2 className="size-4 animate-spin" /> : null}
            {t("headerActions.install")}
          </Button>
        </div>
      </div>
    </div>
  )
}
