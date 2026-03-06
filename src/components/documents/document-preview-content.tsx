"use client"

import { useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"

import { GenericDocumentPreview } from "@/components/documents/generic-document-preview"
import {
  asBuiltInPatientHandoutPreviewContent,
  asBuiltInRecordPreviewContent,
} from "@/lib/documents/built-in-preview"
import { buildGenericDocumentSections } from "@/lib/documents/preview"
import { cn } from "@/lib/utils"
import type { DocumentPreviewPayload } from "@/types/document"
import { PATIENT_HANDOUT_SECTION_KEYS } from "@/types/patient-handout"

type PreviewVariant = "dialog" | "card"

function BuiltInPreviewFallback({ variant }: { variant: PreviewVariant }) {
  const locale = useLocale()

  return (
    <p
      className={cn(
        "text-muted-foreground",
        variant === "card" ? "text-[10px] leading-[0.9rem]" : "text-sm"
      )}
    >
      {locale === "ko"
        ? "기본 제공 문서 미리보기를 렌더링할 수 없습니다."
        : "Unable to render built-in preview."}
    </p>
  )
}

function BuiltInRecordPreview({
  content,
  variant,
}: {
  content: Record<string, unknown>
  variant: PreviewVariant
}) {
  const tRecord = useTranslations("Record")
  const locale = useLocale()
  const compact = variant === "card"
  const record = asBuiltInRecordPreviewContent(content)

  if (!record) {
    return <BuiltInPreviewFallback variant={variant} />
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
    <div className={compact ? "space-y-2.5" : "space-y-5"}>
      {record.patientName ? (
        <div className={compact ? "border-b border-border/60 pb-1.5" : "border-b border-border/60 pb-3"}>
          <p
            className={cn(
              "font-medium uppercase text-muted-foreground",
              compact
                ? "text-[9px] tracking-[0.14em]"
                : "text-xs tracking-[0.18em]"
            )}
          >
            {patientLabel}
          </p>
          <p
            className={cn(
              "mt-1 text-foreground",
              compact ? "text-[10px] leading-[0.9rem]" : "text-sm"
            )}
          >
            {record.patientName}
          </p>
        </div>
      ) : null}
      {sections.map(([label, value]) =>
        value ? (
          <section key={label} className={compact ? "space-y-0.5" : "space-y-1.5"}>
            <p
              className={cn(
                "font-medium uppercase text-muted-foreground",
                compact
                  ? "text-[9px] tracking-[0.14em]"
                  : "text-xs tracking-[0.18em]"
              )}
            >
              {label}
            </p>
            <p
              className={cn(
                "whitespace-pre-wrap text-foreground/90",
                compact ? "text-[10px] leading-[0.9rem]" : "text-sm leading-6"
              )}
            >
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
  variant,
}: {
  content: Record<string, unknown>
  variant: PreviewVariant
}) {
  const tHandout = useTranslations("PatientHandout")
  const locale = useLocale()
  const compact = variant === "card"
  const handout = asBuiltInPatientHandoutPreviewContent(content)

  if (!handout) {
    return <BuiltInPreviewFallback variant={variant} />
  }

  const condition = handout.conditions[0] ?? null
  const entry = condition
    ? handout.entries.find((candidate) => candidate.conditionId === condition.id) ??
    handout.entries[0]
    : handout.entries[0]

  return (
    <div className={compact ? "space-y-2.5" : "space-y-5"}>
      {condition ? (
        <div className={compact ? "border-b border-border/60 pb-1.5" : "border-b border-border/60 pb-3"}>
          <h3
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-[11px]" : "text-base"
            )}
          >
            {condition.diseaseName} ({condition.icdCode})
          </h3>
          <p
            className={cn(
              "mt-1 text-muted-foreground",
              compact ? "text-[10px] leading-[0.9rem]" : "text-xs"
            )}
          >
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
          <section
            key={sectionKey}
            className={compact ? "space-y-0.5" : "space-y-1.5"}
          >
            <p
              className={cn(
                "font-medium uppercase text-muted-foreground",
                compact
                  ? "text-[9px] tracking-[0.14em]"
                  : "text-xs tracking-[0.18em]"
              )}
            >
              {tHandout(`sections.${sectionKey}`)}
            </p>
            <p
              className={cn(
                "whitespace-pre-wrap text-foreground/90",
                compact ? "text-[10px] leading-[0.9rem]" : "text-sm leading-6"
              )}
            >
              {entry.sections[sectionKey] || "[Not provided]"}
            </p>
          </section>
        ))
        : null}
    </div>
  )
}

export function DocumentPreviewContent({
  preview,
  variant = "dialog",
  placeholder,
}: {
  preview: DocumentPreviewPayload | null
  variant?: PreviewVariant
  placeholder: string
}) {
  const genericSections = useMemo(() => {
    if (!preview?.previewContent || preview.previewKind !== "AI_GENERATED") {
      return []
    }

    return buildGenericDocumentSections(preview.previewContent, preview.schemaNodes)
  }, [preview])

  if (!preview?.previewContent) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/70 text-center text-muted-foreground",
          variant === "card"
            ? "px-3 py-6 text-[10px] leading-[0.9rem]"
            : "px-4 py-10 text-sm"
        )}
      >
        {placeholder}
      </div>
    )
  }

  if (preview.previewKind === "BUILT_IN_STATIC") {
    return preview.builtInPreviewKey === "record" ? (
      <BuiltInRecordPreview content={preview.previewContent} variant={variant} />
    ) : (
      <BuiltInHandoutPreview content={preview.previewContent} variant={variant} />
    )
  }

  return (
    <GenericDocumentPreview
      sections={genericSections}
      variant={variant === "card" ? "catalogCard" : "catalog"}
    />
  )
}
