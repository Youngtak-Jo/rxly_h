"use client"

import { useEffect, useMemo, useState } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { GenericDocumentPreview } from "@/components/documents/generic-document-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  asBuiltInPatientHandoutPreviewContent,
  asBuiltInRecordPreviewContent,
} from "@/lib/documents/built-in-preview"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getDocumentCategoryLabelKey } from "@/lib/documents/categories"
import { buildGenericDocumentSections } from "@/lib/documents/preview"
import type { DocumentCatalogItem, DocumentPreviewResponse } from "@/types/document"
import {
  PATIENT_HANDOUT_SECTION_KEYS,
} from "@/types/patient-handout"

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

function BuiltInRecordPreview({
  content,
}: {
  content: Record<string, unknown>
}) {
  const tRecord = useTranslations("Record")
  const locale = useLocale()
  const record = asBuiltInRecordPreviewContent(content)
  if (!record) {
    return (
      <p className="text-sm text-muted-foreground">
        {locale === "ko"
          ? "기본 제공 문서 미리보기를 렌더링할 수 없습니다."
          : "Unable to render built-in preview."}
      </p>
    )
  }

  const patientLabel = locale === "ko" ? "환자" : "Patient"
  const sections = [
    [tRecord("sections.chiefComplaint"), record.chiefComplaint],
    [tRecord("sections.hpiText"), record.hpiText],
    [tRecord("sections.medications"), record.medications],
    [tRecord("sections.rosText"), record.rosText],
    [tRecord("sections.physicalExam"), record.physicalExam],
    [tRecord("sections.labsStudies"), record.labsStudies],
    [tRecord("sections.assessment"), record.assessment],
    [tRecord("sections.plan"), record.plan],
  ] as const

  return (
    <div className="space-y-5">
      {record.patientName ? (
        <div className="border-b border-border/60 pb-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {patientLabel}
          </p>
          <p className="mt-1 text-sm text-foreground">{record.patientName}</p>
        </div>
      ) : null}
      {sections.map(([label, value]) =>
        value ? (
          <section key={label} className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {label}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
              {value}
            </p>
          </section>
        ) : null
      )}
    </div>
  )
}

function BuiltInHandoutPreview({
  content,
}: {
  content: Record<string, unknown>
}) {
  const tHandout = useTranslations("PatientHandout")
  const locale = useLocale()
  const handout = asBuiltInPatientHandoutPreviewContent(content)
  if (!handout) {
    return (
      <p className="text-sm text-muted-foreground">
        {locale === "ko"
          ? "기본 제공 문서 미리보기를 렌더링할 수 없습니다."
          : "Unable to render built-in preview."}
      </p>
    )
  }

  const condition = handout.conditions[0] ?? null
  const entry = condition
    ? handout.entries.find((candidate) => candidate.conditionId === condition.id) ??
      handout.entries[0]
    : handout.entries[0]

  return (
    <div className="space-y-5">
      {condition ? (
        <div className="border-b border-border/60 pb-3">
          <h3 className="text-base font-semibold text-foreground">
            {condition.diseaseName} ({condition.icdCode})
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {tHandout("source")}:{" "}
            {condition.source === "ddx"
              ? tHandout("sourceDdx")
              : tHandout("sourceIcd11")}{" "}
            · {locale === "ko" ? "언어" : "Language"}: {handout.language}
          </p>
        </div>
      ) : null}
      {entry
        ? PATIENT_HANDOUT_SECTION_KEYS.map((sectionKey) => (
            <section key={sectionKey} className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {tHandout(`sections.${sectionKey}`)}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                {entry.sections[sectionKey] || "[Not provided]"}
              </p>
            </section>
          ))
        : null}
    </div>
  )
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
}) {
  const t = useTranslations("DocumentStore")
  const tBuilder = useTranslations("DocumentBuilder")
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<DocumentPreviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !item) return

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

  const genericSections = useMemo(() => {
    if (!preview?.previewContent || preview.previewKind !== "AI_GENERATED") {
      return []
    }

    return buildGenericDocumentSections(preview.previewContent)
  }, [preview])

  const categoryLabel = preview
    ? tBuilder(getDocumentCategoryLabelKey(preview.category) as never)
    : null

  const isBusy = item
    ? actionKey === item.templateId || actionKey === `tab:${item.templateId}`
    : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-4xl overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="text-left">
                  {preview?.title || item?.title || t("preview.dialogTitle")}
                </DialogTitle>
                <Badge variant="outline">
                  {preview?.previewKind === "BUILT_IN_STATIC"
                    ? t("preview.staticBadge")
                    : t("preview.syntheticBadge")}
                </Badge>
                {preview?.versionNumber ? (
                  <Badge variant="secondary">
                    {t("badges.publishedVersion", {
                      version: preview.versionNumber,
                    })}
                  </Badge>
                ) : null}
                {categoryLabel ? <Badge variant="outline">{categoryLabel}</Badge> : null}
              </div>
              <DialogDescription className="text-left">
                {preview?.description || item?.description || ""}
              </DialogDescription>
              {preview?.previewCaseSummary ? (
                <p className="max-w-3xl text-sm text-muted-foreground">
                  {preview.previewCaseSummary}
                </p>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 className="size-4 animate-spin" />
              {t("preview.loading")}
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-8 text-sm text-destructive">
              {error}
            </div>
          ) : preview?.previewKind === "BUILT_IN_STATIC" &&
            preview.previewContent ? (
            preview.builtInPreviewKey === "record" ? (
              <BuiltInRecordPreview content={preview.previewContent} />
            ) : (
              <BuiltInHandoutPreview content={preview.previewContent} />
            )
          ) : (
            <GenericDocumentPreview sections={genericSections} variant="catalog" />
          )}
        </div>

        {item ? (
          <div className="border-t px-5 py-4">
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
