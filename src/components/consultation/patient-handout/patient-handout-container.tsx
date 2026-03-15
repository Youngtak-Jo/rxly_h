"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTimeZone, useTranslations } from "next-intl"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { DocumentEditor } from "@/components/consultation/documents/document-editor"
import { DiagnosisSelectionPanel } from "@/components/consultation/documents/diagnosis-selection-panel"
import {
  DocumentSection,
  DocumentShell,
} from "@/components/consultation/documents/document-shell"
import { generatePatientHandout } from "@/hooks/use-live-patient-handout"
import {
  derivePatientHandoutFromRichTextDocument,
  normalizeRichTextDocument,
  patientHandoutToRichTextDocument,
} from "@/lib/documents/rich-text"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatDateTime } from "@/i18n/format"
import { useDdxStore } from "@/stores/ddx-store"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import { useSessionStore } from "@/stores/session-store"
import type { DiagnosisSelectionItem } from "@/types/diagnosis-selection"

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export function PatientHandoutContainer() {
  const t = useTranslations("PatientHandout")
  const tDocument = useTranslations("ConsultationDocument")
  const locale = useLocale() as UiLocale
  const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE
  const activeSession = useSessionStore((state) => state.activeSession)
  const diagnoses = useDdxStore((state) => state.diagnoses)
  const {
    document,
    selectedConditions,
    isGenerating,
    addCondition,
    removeCondition,
    setGeneratedDocument,
  } = usePatientHandoutStore()

  const [manualView, setManualView] = useState<"prepare" | "document" | null>(
    null
  )
  const view = document ? (manualView ?? "document") : "prepare"

  const diagnosisCodeSet = useMemo(
    () => new Set(diagnoses.map((diagnosis) => normalizeCode(diagnosis.icdCode))),
    [diagnoses]
  )

  useEffect(() => {
    const staleDdxConditions = selectedConditions.filter(
      (condition) =>
        condition.source === "ddx" &&
        !diagnosisCodeSet.has(normalizeCode(condition.icdCode))
    )

    staleDdxConditions.forEach((condition) => {
      removeCondition(condition.id)
    })
  }, [diagnosisCodeSet, removeCondition, selectedConditions])

  const handoutLabels = useMemo(
    () => ({
      sections: {
        conditionOverview: t("sections.conditionOverview"),
        signsSymptoms: t("sections.signsSymptoms"),
        causesRiskFactors: t("sections.causesRiskFactors"),
        complications: t("sections.complications"),
        treatmentOptions: t("sections.treatmentOptions"),
        whenToSeekHelp: t("sections.whenToSeekHelp"),
        additionalAdviceFollowUp: t("sections.additionalAdviceFollowUp"),
        disclaimer: t("sections.disclaimer"),
      },
    }),
    [t]
  )

  const documentValue = useMemo(() => {
    if (!document) return null
    return normalizeRichTextDocument(
      document.documentJson,
      patientHandoutToRichTextDocument(document, handoutLabels)
    )
  }, [document, handoutLabels])

  const conditionItems = useMemo(() => {
    const byCode = new Map<string, DiagnosisSelectionItem>()

    diagnoses.forEach((diagnosis) => {
      const key = normalizeCode(diagnosis.icdCode)
      if (byCode.has(key)) return
      byCode.set(key, {
        id: diagnosis.id,
        icdCode: diagnosis.icdCode,
        diseaseName: diagnosis.diseaseName,
        source: "ddx",
        evidence: diagnosis.evidence,
        confidence: diagnosis.confidence,
      })
    })

    selectedConditions.forEach((condition) => {
      if (condition.source !== "icd11") return
      const key = normalizeCode(condition.icdCode)
      if (byCode.has(key)) return
      byCode.set(key, {
        id: condition.id,
        icdCode: condition.icdCode,
        diseaseName: condition.diseaseName,
        source: "icd11",
        evidence: t("sourceIcd11"),
      })
    })

    return Array.from(byCode.values())
  }, [diagnoses, selectedConditions, t])

  const metadata = document ? (
    <>
      <span className="font-medium uppercase">
        {document.language.toUpperCase()}
      </span>
      <span>
        {tDocument("generatedAt", {
          value: formatDateTime(document.generatedAt, locale, timeZone),
        })}
      </span>
    </>
  ) : null

  return (
    <div data-tour="patient-handout-panel">
      <DocumentShell
        ambientState={
          isGenerating ? (document ? "updating" : "generating") : "idle"
        }
        loading={!document && isGenerating}
        loadingLabel={t("generating")}
        topActions={
          document && view === "document" ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-3 text-muted-foreground hover:text-foreground"
              onClick={() => setManualView("prepare")}
            >
              {t("backToConditions")}
            </Button>
          ) : (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                onClick={async () => {
                  if (!activeSession) return
                  await generatePatientHandout(activeSession.id)
                  if (usePatientHandoutStore.getState().document) {
                    setManualView("document")
                  }
                }}
                disabled={!activeSession || selectedConditions.length === 0 || isGenerating}
                size="sm"
                className="min-w-[152px]"
              >
                {isGenerating ? (
                  <span className="inline-flex items-center gap-2">
                    <IconLoader2 className="size-3.5 animate-spin" />
                    {t("generating")}
                  </span>
                ) : document ? (
                  t("regenerate")
                ) : (
                  t("generate")
                )}
              </Button>
            </div>
          )
        }
        footerMeta={document && view === "document" ? metadata : null}
        footerActions={
          document && view === "document" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!activeSession || isGenerating}
              onClick={async () => {
                if (!activeSession) return
                await generatePatientHandout(activeSession.id)
                if (usePatientHandoutStore.getState().document) {
                  setManualView("document")
                }
              }}
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
      >
        {view === "prepare" || !document ? (
          <DocumentSection
            title={t("ddxSectionLabel")}
            description={t("languageHint")}
          >
            <DiagnosisSelectionPanel
              items={conditionItems}
              selectedConditions={selectedConditions}
              selectionMode="multiple"
              allowIcd11Search
              emptyState={t("emptyState")}
              openIcdSearchLabel={t("conditionNotInDdx")}
              icdSearchLabel={t("icd11Search")}
              searchTitle={t("searchIcd11Condition")}
              searchDescription={t("searchDescription")}
              searchPlaceholder={t("searchPlaceholder")}
              searchNoResults={t("searchNoResults")}
              searchingLabel={t("searching")}
              selectConditionAriaLabel={(name) =>
                t("selectCondition", { name })
              }
              onChange={(nextConditions) => {
                const removedIds = selectedConditions
                  .filter(
                    (condition) =>
                      !nextConditions.some(
                        (next) =>
                          normalizeCode(next.icdCode) ===
                          normalizeCode(condition.icdCode)
                      )
                  )
                  .map((condition) => condition.id)

                removedIds.forEach((conditionId) => removeCondition(conditionId))
                nextConditions.forEach((condition) => addCondition(condition))
              }}
            />
          </DocumentSection>
        ) : document ? (
          <DocumentEditor
            value={documentValue}
            placeholder={tDocument("slashHint")}
            embedded
            toolbarMode="sticky"
            onChange={(nextValue) => {
              if (!document) return
              setGeneratedDocument(
                derivePatientHandoutFromRichTextDocument(
                  normalizeRichTextDocument(nextValue, documentValue ?? undefined),
                  document
                )
              )
            }}
          />
        ) : null}
      </DocumentShell>
    </div>
  )
}
