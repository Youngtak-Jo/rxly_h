"use client"

import { useMemo } from "react"
import { useLocale, useTimeZone, useTranslations } from "next-intl"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DocumentEditor } from "@/components/consultation/documents/document-editor"
import { DocumentShell } from "@/components/consultation/documents/document-shell"
import { generateRecord } from "@/hooks/use-live-record"
import {
  deriveRecordFromRichTextDocument,
  normalizeRichTextDocument,
  recordToRichTextDocument,
} from "@/lib/documents/rich-text"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatDate, formatDateTime } from "@/i18n/format"
import { useRecordStore } from "@/stores/record-store"
import { useSessionStore } from "@/stores/session-store"

export function RecordContainer() {
  const t = useTranslations("Record")
  const tDocument = useTranslations("ConsultationDocument")
  const locale = useLocale() as UiLocale
  const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE
  const activeSession = useSessionStore((state) => state.activeSession)
  const record = useRecordStore((state) => state.record)
  const setRecord = useRecordStore((state) => state.setRecord)
  const isGenerating = useRecordStore((state) => state.isGenerating)

  const recordLabels = useMemo(
    () => ({
      vitals: t("vitals"),
      sections: {
        chiefComplaint: t("sections.chiefComplaint"),
        hpiText: t("sections.hpiText"),
        medications: t("sections.medications"),
        rosText: t("sections.rosText"),
        pmh: t("sections.pmh"),
        socialHistory: t("sections.socialHistory"),
        familyHistory: t("sections.familyHistory"),
        physicalExam: t("sections.physicalExam"),
        labsStudies: t("sections.labsStudies"),
        assessment: t("sections.assessment"),
        plan: t("sections.plan"),
      },
    }),
    [t]
  )

  const documentValue = useMemo(() => {
    if (!record) return null
    return normalizeRichTextDocument(
      record.documentJson,
      recordToRichTextDocument(record, recordLabels)
    )
  }, [record, recordLabels])

  const metadata = activeSession ? (
    <>
      <span>{activeSession.patientName || t("unknownPatient")}</span>
      {record && (record.date || activeSession.startedAt) ? (
        <span>
          {formatDate(record?.date || activeSession.startedAt, locale, timeZone)}
        </span>
      ) : null}
      {record?.date ? (
        <span>
          {tDocument("generatedAt", {
            value: formatDateTime(record.date, locale, timeZone),
          })}
        </span>
      ) : null}
    </>
  ) : null

  return (
    <div data-tour="record-panel">
      <DocumentShell
        ambientState={
          isGenerating ? (record ? "updating" : "generating") : "idle"
        }
        loading={!record && isGenerating}
        loadingLabel={t("generating")}
        topActions={
          !record ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  if (!activeSession || isGenerating) return
                  generateRecord(
                    activeSession.id,
                    activeSession.patientName
                  )
                }}
                disabled={!activeSession || isGenerating}
                size="sm"
                className="min-w-[136px]"
              >
                {isGenerating ? (
                  <span className="inline-flex items-center gap-2">
                    <IconLoader2 className="size-3.5 animate-spin" />
                    {t("generating")}
                  </span>
                ) : (
                  t("generate")
                )}
              </Button>
            </div>
          ) : undefined
        }
        footerMeta={record ? metadata : null}
        footerActions={
          record ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!activeSession || isGenerating) return
                generateRecord(
                  activeSession.id,
                  activeSession.patientName,
                  record.id
                )
              }}
              disabled={!activeSession || isGenerating}
            >
              {isGenerating ? (
                <span className="inline-flex items-center gap-2">
                  <IconLoader2 className="size-3.5 animate-spin" />
                  {t("generating")}
                </span>
              ) : (
                t("regenerate")
              )}
            </Button>
          ) : null
        }
        empty={!record && !isGenerating}
        emptyMessage={t("emptyState")}
      >
        {record ? (
          <DocumentEditor
            value={documentValue}
            placeholder={tDocument("slashHint")}
            embedded
            toolbarMode="sticky"
            onChange={(nextValue) => {
              if (!record) return
              setRecord(
                deriveRecordFromRichTextDocument(
                  normalizeRichTextDocument(nextValue, documentValue ?? undefined),
                  record
                )
              )
            }}
          />
        ) : null}
      </DocumentShell>
    </div>
  )
}
