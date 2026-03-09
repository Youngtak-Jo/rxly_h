"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTimeZone, useTranslations } from "next-intl"
import { IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DocumentEditor } from "@/components/consultation/documents/document-editor"
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

interface Icd11SearchResult {
  theCode: string
  title: string
  uri: string
}

interface ConditionListItem {
  id: string
  icdCode: string
  diseaseName: string
  source: "ddx" | "icd11"
  evidence: string
  confidence?: "high" | "moderate" | "low"
}

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

  const [isIcdSearchDialogOpen, setIsIcdSearchDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Icd11SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [view, setView] = useState<"prepare" | "document">(document ? "document" : "prepare")
  const previousGeneratedAtRef = useRef<string | null>(document?.generatedAt ?? null)

  useEffect(() => {
    if (!isIcdSearchDialogOpen) return

    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        const response = await fetch(
          `/api/icd11/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        )
        if (!response.ok) throw new Error("Search failed")
        const payload = (await response.json()) as { results: Icd11SearchResult[] }
        setSearchResults(payload.results || [])
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [isIcdSearchDialogOpen, searchQuery])

  useEffect(() => {
    if (isIcdSearchDialogOpen) return
    setSearchQuery("")
    setSearchResults([])
    setIsSearching(false)
  }, [isIcdSearchDialogOpen])

  useEffect(() => {
    if (!document) {
      previousGeneratedAtRef.current = null
      setView("prepare")
      return
    }

    if (previousGeneratedAtRef.current !== document.generatedAt) {
      previousGeneratedAtRef.current = document.generatedAt
      setView("document")
    }
  }, [document])

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

  const selectedCodeSet = useMemo(
    () => new Set(selectedConditions.map((condition) => normalizeCode(condition.icdCode))),
    [selectedConditions]
  )

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
    const byCode = new Map<string, ConditionListItem>()

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

  const toggleCondition = (item: ConditionListItem) => {
    const key = normalizeCode(item.icdCode)
    const existing = selectedConditions.find(
      (condition) => normalizeCode(condition.icdCode) === key
    )

    if (existing) {
      removeCondition(existing.id)
      return
    }

    addCondition({
      id: item.id,
      icdCode: item.icdCode,
      diseaseName: item.diseaseName,
      source: item.source,
    })
  }

  const addIcdCondition = (result: Icd11SearchResult) => {
    const code = (result.theCode || result.title).trim()
    if (!code) return

    const exists = selectedConditions.some(
      (condition) => normalizeCode(condition.icdCode) === normalizeCode(code)
    )
    if (exists) return

    addCondition({
      id: `icd11:${code}:${result.uri || result.title}`,
      icdCode: code,
      diseaseName: result.title,
      source: "icd11",
    })
  }

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
              onClick={() => setView("prepare")}
            >
              {t("backToConditions")}
            </Button>
          ) : (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  if (!activeSession) return
                  void generatePatientHandout(activeSession.id)
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
              onClick={() => {
                if (!activeSession) return
                void generatePatientHandout(activeSession.id)
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
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsIcdSearchDialogOpen(true)}
              >
                {t("conditionNotInDdx")}
              </Button>
            }
          >
            {conditionItems.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-sm leading-6 text-muted-foreground">
                {t("emptyState")}
              </p>
            ) : (
              <div className="divide-y divide-border/60 border-y border-border/60">
                {conditionItems.map((item) => {
                  const isSelected = selectedCodeSet.has(normalizeCode(item.icdCode))

                  return (
                    <label
                      key={`${item.source}:${item.id}`}
                      className="flex cursor-pointer items-start gap-3 px-1 py-3"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleCondition(item)}
                        aria-label={t("selectCondition", { name: item.diseaseName })}
                        className="mt-1"
                      />
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="block text-sm font-medium text-foreground">
                          {item.diseaseName}
                        </span>
                        <span className="block text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          {item.icdCode}
                        </span>
                        <span className="block text-sm leading-6 text-muted-foreground">
                          {item.evidence}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
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

      <Dialog open={isIcdSearchDialogOpen} onOpenChange={setIsIcdSearchDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("searchIcd11Condition")}</DialogTitle>
            <DialogDescription>{t("searchDescription")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              autoFocus
            />

            <div className="max-h-80 overflow-y-auto">
              {isSearching ? (
                <p className="text-sm text-muted-foreground">{t("searching")}</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("searchNoResults")}</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.uri}:${result.theCode}`}
                      type="button"
                      className="flex w-full items-start justify-between gap-3 py-3 text-left"
                      onClick={() => {
                        addIcdCondition(result)
                        setIsIcdSearchDialogOpen(false)
                      }}
                    >
                      <span className="min-w-0 space-y-1">
                        <span className="block text-sm font-medium text-foreground">
                          {result.title}
                        </span>
                        <span className="block text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          {result.theCode}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("icd11Search")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
