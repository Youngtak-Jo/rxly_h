"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDdxStore } from "@/stores/ddx-store"
import { useSessionStore } from "@/stores/session-store"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import {
  PATIENT_HANDOUT_SECTION_KEYS,
  PATIENT_HANDOUT_SECTION_LABELS,
  type PatientHandoutEntry,
} from "@/types/patient-handout"
import { generatePatientHandout } from "@/hooks/use-live-patient-handout"
import {
  IconLoader2,
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react"
import { PatientHandoutSection } from "./patient-handout-section"

interface Icd11SearchResult {
  theCode: string
  title: string
  uri: string
  browserUrl: string
  score: number
}

export function PatientHandoutContainer() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const diagnoses = useDdxStore((s) => s.diagnoses)

  const {
    document,
    selectedConditions,
    languageMode,
    isGenerating,
    addCondition,
    removeCondition,
    setLanguageMode,
    updateSection,
  } = usePatientHandoutStore()

  const [showIcdSearch, setShowIcdSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Icd11SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!showIcdSearch) return

    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setSearchResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        const res = await fetch(
          `/api/icd11/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        )
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
  }, [searchQuery, showIcdSearch])

  const selectedCodes = useMemo(
    () => new Set(selectedConditions.map((condition) => condition.icdCode)),
    [selectedConditions]
  )

  const entryByConditionId = useMemo(() => {
    const map = new Map<string, PatientHandoutEntry>()
    if (!document) return map
    for (const entry of document.entries) {
      map.set(entry.conditionId, entry)
    }
    return map
  }, [document])

  const toggleDdxCondition = (diagnosisId: string, icdCode: string, diseaseName: string) => {
    const existing = selectedConditions.find(
      (condition) => condition.icdCode === icdCode
    )

    if (existing) {
      removeCondition(existing.id)
      return
    }

    addCondition({
      id: diagnosisId,
      icdCode,
      diseaseName,
      source: "ddx",
    })
  }

  const addIcdCondition = (result: Icd11SearchResult) => {
    const code = result.theCode || result.title
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Patient Handout</h3>
          <p className="text-xs text-muted-foreground mt-1">
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
          {isGenerating ? (
            <IconLoader2 className="size-3.5 animate-spin" />
          ) : null}
          {isGenerating
            ? "Generating..."
            : document
              ? "Regenerate Handout"
              : "Generate Handout"}
        </Button>
      </div>

      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Language
          </p>
          <Select
            value={languageMode}
            onValueChange={(value) => setLanguageMode(value as "auto" | "ko" | "en")}
          >
            <SelectTrigger className="w-full sm:w-[180px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (from STT)</SelectItem>
              <SelectItem value="ko">Korean</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Select Conditions (DDx)
          </p>
          {diagnoses.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No differential diagnoses yet. Add conditions via ICD-11 search below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {diagnoses.map((diagnosis) => {
                const isSelected = selectedCodes.has(diagnosis.icdCode)
                return (
                  <button
                    key={diagnosis.id}
                    type="button"
                    onClick={() =>
                      toggleDdxCondition(
                        diagnosis.id,
                        diagnosis.icdCode,
                        diagnosis.diseaseName
                      )
                    }
                    className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {diagnosis.diseaseName} ({diagnosis.icdCode})
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowIcdSearch((prev) => !prev)}
            className="text-xs text-primary hover:underline"
          >
            {showIcdSearch
              ? "Hide ICD-11 search"
              : "Condition not in DDx? Search ICD-11"}
          </button>

          {showIcdSearch && (
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
                <div className="max-h-44 overflow-y-auto space-y-1 rounded-md border p-1.5">
                  {searchResults.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      No results found.
                    </p>
                  ) : (
                    searchResults.map((result) => {
                      const code = result.theCode || result.title
                      const alreadySelected = selectedCodes.has(code)
                      return (
                        <div
                          key={`${result.theCode}:${result.uri}`}
                          className="flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-muted"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {result.title}
                            </p>
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
                            disabled={alreadySelected}
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
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Selected Conditions
          </p>
          {selectedConditions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Select one or more conditions to generate a handout.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedConditions.map((condition) => (
                <Badge key={condition.id} variant="secondary" className="gap-1 pr-1">
                  {condition.diseaseName} ({condition.icdCode})
                  <button
                    type="button"
                    onClick={() => removeCondition(condition.id)}
                    className="rounded hover:bg-muted p-0.5"
                    aria-label={`Remove ${condition.diseaseName}`}
                  >
                    <IconX className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
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
              <div key={condition.id} className="rounded-lg border p-3 space-y-3">
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
                      onChange={(value) =>
                        updateSection(condition.id, sectionKey, value)
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!document && !isGenerating && (
        <p className="text-sm text-muted-foreground/60 italic text-center py-8">
          Generate a handout to create patient-friendly education content for the
          selected conditions.
        </p>
      )}
    </div>
  )
}
