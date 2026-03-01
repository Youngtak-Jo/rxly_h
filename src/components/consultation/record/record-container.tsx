"use client"

import { useLocale, useTimeZone, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { RecordSection } from "./record-section"
import { useRecordStore } from "@/stores/record-store"
import { useSessionStore } from "@/stores/session-store"
import { generateRecord } from "@/hooks/use-live-record"

import { IconLoader2 } from "@tabler/icons-react"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatDate } from "@/i18n/format"

export function RecordContainer() {
  const t = useTranslations("Record")
  const locale = useLocale() as UiLocale
  const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE
  const { record, isGenerating, updateField } = useRecordStore()
  const activeSession = useSessionStore((s) => s.activeSession)

  const handleGenerate = () => {
    if (!activeSession || isGenerating) return
    generateRecord(
      activeSession.id,
      activeSession.patientName,
      record?.id
    )
  }

  const toStr = (val: unknown): string => {
    if (val == null) return ""
    if (typeof val === "string") return val
    if (Array.isArray(val)) return val.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n")
    if (typeof val === "object") return JSON.stringify(val, null, 2)
    return String(val)
  }

  const sections = [
    { key: "chiefComplaint", titleKey: "chiefComplaint" },
    { key: "hpiText", titleKey: "hpiText" },
    { key: "medications", titleKey: "medications" },
    { key: "rosText", titleKey: "rosText" },
    { key: "pmh", titleKey: "pmh" },
    { key: "socialHistory", titleKey: "socialHistory" },
    { key: "familyHistory", titleKey: "familyHistory" },
    { key: "physicalExam", titleKey: "physicalExam" },
    { key: "labsStudies", titleKey: "labsStudies" },
    { key: "assessment", titleKey: "assessment" },
    { key: "plan", titleKey: "plan" },
  ] as const

  return (
    <div data-tour="record-panel" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="min-h-4">
          {activeSession && (
            <p className="text-xs text-muted-foreground">
              {activeSession.patientName || t("unknownPatient")}
              {(record?.date || activeSession.startedAt) && (
                <>
                  {" "}
                  &middot;{" "}
                  {formatDate(
                    record?.date || activeSession.startedAt,
                    locale,
                    timeZone
                  )}
                </>
              )}
            </p>
          )}
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="sm"
          className="gap-1.5"
        >
          {isGenerating ? (
            <IconLoader2 key="loader" className="size-3.5 animate-spin" />
          ) : (
            ''
          )}
          {isGenerating ? t("generating") : record ? t("regenerate") : t("generate")}
        </Button>
      </div>

      {!record && !isGenerating && (
        <p className="text-sm text-muted-foreground/50 italic text-center py-8">
          {t("emptyState")}
        </p>
      )}

      {(record || isGenerating) && (
        <div className="space-y-3">
          {record?.vitals && (
            <div className="rounded-lg border p-3">
              <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                {t("vitals")}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                {Object.entries(record.vitals).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {key}
                    </p>
                    <p className="font-mono text-xs">
                      {(value as string) || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.map(({ key, titleKey }) => (
            <RecordSection
              key={key}
              title={t(`sections.${titleKey}`)}
              value={toStr(record?.[key])}
              onChange={(value) => updateField(key, value)}
              isLoading={isGenerating && !record}
            />
          ))}
        </div>
      )}
    </div>
  )
}
