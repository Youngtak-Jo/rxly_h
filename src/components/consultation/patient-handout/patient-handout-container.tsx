"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDdxStore } from "@/stores/ddx-store"
import { useSessionStore } from "@/stores/session-store"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import {
  PATIENT_HANDOUT_SECTION_KEYS,
  PATIENT_HANDOUT_SECTION_LABELS,
  type PatientHandoutEntry,
} from "@/types/patient-handout"
import { generatePatientHandout } from "@/hooks/use-live-patient-handout"
import { IconLoader2, IconPlus, IconSearch } from "@tabler/icons-react"
import { PatientHandoutSection } from "./patient-handout-section"

interface Icd11SearchResult {
  theCode: string
  title: string
  uri: string
  browserUrl: string
  score: number
}

interface ConditionCardItem {
  id: string
  icdCode: string
  diseaseName: string
  source: "ddx" | "icd11"
  evidence: string
  confidence?: "high" | "moderate" | "low"
}

const confidenceColors: Record<"high" | "moderate" | "low", string> = {
  high: "bg-emerald-100 text-emerald-800",
  moderate: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-700",
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

export function PatientHandoutContainer() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const diagnoses = useDdxStore((s) => s.diagnoses)

  const {
    document,
    selectedConditions,
    isGenerating,
    addCondition,
    removeCondition,
    updateSection,
  } = usePatientHandoutStore()

  const [isIcdSearchDialogOpen, setIsIcdSearchDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Icd11SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

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
        const res = await fetch(`/api/icd11/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Search failed")
        const payload = (await res.json()) as { results: Icd11SearchResult[] }
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
  }, [searchQuery, isIcdSearchDialogOpen])

  useEffect(() => {
    if (isIcdSearchDialogOpen) return
    setSearchQuery("")
    setSearchResults([])
    setIsSearching(false)
  }, [isIcdSearchDialogOpen])

  const selectedCodeSet = useMemo(
    () => new Set(selectedConditions.map((condition) => normalizeCode(condition.icdCode))),
    [selectedConditions]
  )

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

    if (staleDdxConditions.length === 0) return

    staleDdxConditions.forEach((condition) => {
      removeCondition(condition.id)
    })
  }, [diagnosisCodeSet, removeCondition, selectedConditions])

  const conditionCards = useMemo(() => {
    const byCode = new Map<string, ConditionCardItem>()

    for (const diagnosis of diagnoses) {
      const key = normalizeCode(diagnosis.icdCode)
      if (byCode.has(key)) continue

      byCode.set(key, {
        id: diagnosis.id,
        icdCode: diagnosis.icdCode,
        diseaseName: diagnosis.diseaseName,
        source: "ddx",
        confidence: diagnosis.confidence,
        evidence: diagnosis.evidence,
      })
    }

    for (const condition of selectedConditions) {
      if (condition.source !== "icd11") continue

      const key = normalizeCode(condition.icdCode)
      if (byCode.has(key)) continue

      byCode.set(key, {
        id: condition.id,
        icdCode: condition.icdCode,
        diseaseName: condition.diseaseName,
        source: "icd11",
        evidence: "Added from ICD-11 search.",
      })
    }

    return Array.from(byCode.values())
  }, [diagnoses, selectedConditions])

  const entryByConditionId = useMemo(() => {
    const map = new Map<string, PatientHandoutEntry>()
    if (!document) return map

    for (const entry of document.entries) {
      map.set(entry.conditionId, entry)
    }

    return map
  }, [document])

  const toggleCondition = (card: ConditionCardItem) => {
    const codeKey = normalizeCode(card.icdCode)
    const existing = selectedConditions.find(
      (condition) => normalizeCode(condition.icdCode) === codeKey
    )

    if (existing) {
      removeCondition(existing.id)
      return
    }

    if (card.source === "ddx") {
      const diagnosis = diagnoses.find(
        (item) => normalizeCode(item.icdCode) === codeKey
      )
      if (!diagnosis) return

      addCondition({
        id: diagnosis.id,
        icdCode: diagnosis.icdCode,
        diseaseName: diagnosis.diseaseName,
        source: "ddx",
      })
      return
    }

    addCondition({
      id: card.id,
      icdCode: card.icdCode,
      diseaseName: card.diseaseName,
      source: "icd11",
    })
  }

  const addIcdCondition = (result: Icd11SearchResult) => {
    const code = (result.theCode || result.title).trim()
    if (!code) return

    const existing = selectedConditions.find(
      (condition) => normalizeCode(condition.icdCode) === normalizeCode(code)
    )
    if (existing) return

    addCondition({
      id: `icd11:${code}:${result.uri || result.title}`,
      icdCode: code,
      diseaseName: result.title,
      source: "icd11",
    })
  }

  const handoutConditions = document?.conditions || []

  return (
    <div data-tour="patient-handout-panel" className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium">Patient Handout</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Generate patient-friendly guidance for selected conditions.
            </p>
          </div>
          <Button
            onClick={() => {
              if (!activeSession) return
              void generatePatientHandout(activeSession.id)
            }}
            disabled={!activeSession || selectedConditions.length === 0 || isGenerating}
            size="sm"
            className="gap-1.5"
          >
            {isGenerating ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
            {isGenerating
              ? "Generating..."
              : document
                ? "Regenerate Handout"
                : "Generate Handout"}
          </Button>
        </div>

        {!document ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Select Conditions (DDx)
              </p>
              <p className="text-xs text-muted-foreground">
                Handout language is automatically detected from the patient conversation.
              </p>
            </div>

            {conditionCards.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No differential diagnoses yet. Add conditions via ICD-11 search below.
              </p>
            ) : (
              <div className="space-y-2">
                {conditionCards.map((card) => {
                  const isSelected = selectedCodeSet.has(normalizeCode(card.icdCode))

                  return (
                    <div
                      key={`${card.source}:${card.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleCondition(card)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          toggleCondition(card)
                        }
                      }}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-foreground/30 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="shrink-0"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleCondition(card)}
                                aria-label={`${card.diseaseName} 선택`}
                              />
                            </span>
                            <p className="text-sm font-medium truncate">{card.diseaseName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            ICD-11: {card.icdCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {card.source === "icd11" ? (
                            <Badge variant="secondary" className="text-[10px]">
                              ICD-11 search
                            </Badge>
                          ) : null}
                          {card.confidence ? (
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${confidenceColors[card.confidence]}`}
                            >
                              {card.confidence}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                        {card.evidence}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsIcdSearchDialogOpen(true)}
                className="text-xs text-primary hover:underline"
              >
                Condition not in DDx? Search ICD-11
              </button>

              <Dialog open={isIcdSearchDialogOpen} onOpenChange={setIsIcdSearchDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Search ICD-11 Condition</DialogTitle>
                    <DialogDescription>
                      Add a condition that is not currently in DDx.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <div className="relative">
                      <IconSearch className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ICD-11 condition..."
                        className="pl-8 h-8 text-sm"
                      />
                    </div>

                    {isSearching && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconLoader2 className="size-3 animate-spin" />
                        Searching ICD-11...
                      </div>
                    )}

                    {!isSearching && searchQuery.trim().length >= 2 && (
                      <div className="max-h-64 overflow-y-auto space-y-1 rounded-md border p-1.5">
                        {searchResults.length === 0 ? (
                          <p className="px-2 py-1 text-xs text-muted-foreground">
                            No results found.
                          </p>
                        ) : (
                          searchResults.map((result) => {
                            const code = (result.theCode || result.title).trim()
                            const alreadySelected = selectedCodeSet.has(normalizeCode(code))

                            return (
                              <div
                                key={`${result.theCode || result.title}:${result.uri || result.browserUrl}`}
                                className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-muted"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{result.title}</p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {code || "No code"}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => addIcdCondition(result)}
                                  disabled={alreadySelected || !code}
                                >
                                  <IconPlus className="size-3" />
                                  {alreadySelected ? "Added" : "Add"}
                                </Button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : null}
      </div>

      {isGenerating && !document && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Generating patient handout...
        </div>
      )}

      {document && (
        <div className="space-y-4">
          {handoutConditions.map((condition) => {
            const entry = entryByConditionId.get(condition.id)
            return (
              <div key={condition.id} className="space-y-3 border-b pb-4 last:border-b-0">
                <div>
                  <h4 className="text-sm font-medium">
                    {condition.diseaseName} ({condition.icdCode})
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Source: {condition.source === "ddx" ? "DDx" : "ICD-11 search"}
                  </p>
                </div>

                <div className="space-y-3">
                  {PATIENT_HANDOUT_SECTION_KEYS.map((sectionKey) => (
                    <PatientHandoutSection
                      key={`${condition.id}:${sectionKey}`}
                      title={PATIENT_HANDOUT_SECTION_LABELS[sectionKey]}
                      value={entry?.sections[sectionKey] || ""}
                      onChange={(value) => updateSection(condition.id, sectionKey, value)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
