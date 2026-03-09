"use client"

import { useEffect, useMemo, useState } from "react"
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
import type {
  DiagnosisSelectionItem,
  SelectedDiagnosisCondition,
} from "@/types/diagnosis-selection"

interface Icd11SearchResult {
  theCode: string
  title: string
  uri: string
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

export function DiagnosisSelectionPanel({
  items,
  selectedConditions,
  selectionMode,
  allowIcd11Search,
  emptyState,
  openIcdSearchLabel,
  icdSearchLabel,
  searchTitle,
  searchDescription,
  searchPlaceholder,
  searchNoResults,
  searchingLabel,
  selectConditionAriaLabel,
  onChange,
}: {
  items: DiagnosisSelectionItem[]
  selectedConditions: SelectedDiagnosisCondition[]
  selectionMode: "single" | "multiple"
  allowIcd11Search: boolean
  emptyState: string
  openIcdSearchLabel: string
  icdSearchLabel: string
  searchTitle: string
  searchDescription: string
  searchPlaceholder: string
  searchNoResults: string
  searchingLabel: string
  selectConditionAriaLabel: (name: string) => string
  onChange: (nextConditions: SelectedDiagnosisCondition[]) => void
}) {
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

  const selectedCodeSet = useMemo(
    () =>
      new Set(
        selectedConditions.map((condition) => normalizeCode(condition.icdCode))
      ),
    [selectedConditions]
  )

  const toggleCondition = (item: DiagnosisSelectionItem) => {
    const key = normalizeCode(item.icdCode)
    const existing = selectedConditions.find(
      (condition) => normalizeCode(condition.icdCode) === key
    )

    if (existing) {
      onChange(
        selectedConditions.filter(
          (condition) => normalizeCode(condition.icdCode) !== key
        )
      )
      return
    }

    const nextCondition: SelectedDiagnosisCondition = {
      id: item.id,
      icdCode: item.icdCode,
      diseaseName: item.diseaseName,
      source: item.source,
    }

    if (selectionMode === "single") {
      onChange([nextCondition])
      return
    }

    onChange([...selectedConditions, nextCondition])
  }

  const addIcdCondition = (result: Icd11SearchResult) => {
    const code = (result.theCode || result.title).trim()
    if (!code) return

    const nextCondition: SelectedDiagnosisCondition = {
      id: `icd11:${code}:${result.uri || result.title}`,
      icdCode: code,
      diseaseName: result.title,
      source: "icd11",
    }

    if (selectionMode === "single") {
      onChange([nextCondition])
    } else {
      const exists = selectedConditions.some(
        (condition) =>
          normalizeCode(condition.icdCode) === normalizeCode(nextCondition.icdCode)
      )
      if (exists) return
      onChange([...selectedConditions, nextCondition])
    }
  }

  return (
    <>
      {allowIcd11Search ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsIcdSearchDialogOpen(true)}
          >
            {openIcdSearchLabel}
          </Button>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-sm leading-6 text-muted-foreground">
          {emptyState}
        </p>
      ) : (
        <div className="divide-y divide-border/60 border-y border-border/60">
          {items.map((item) => {
            const isSelected = selectedCodeSet.has(normalizeCode(item.icdCode))

            return (
              <label
                key={`${item.source}:${item.id}`}
                className="flex cursor-pointer items-start gap-3 px-1 py-3"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleCondition(item)}
                  aria-label={selectConditionAriaLabel(item.diseaseName)}
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

      {allowIcd11Search ? (
        <Dialog open={isIcdSearchDialogOpen} onOpenChange={setIsIcdSearchDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{searchTitle}</DialogTitle>
              <DialogDescription>{searchDescription}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
              />

              <div className="max-h-80 overflow-y-auto">
                {isSearching ? (
                  <p className="text-sm text-muted-foreground">{searchingLabel}</p>
                ) : searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{searchNoResults}</p>
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
                          {icdSearchLabel}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}
