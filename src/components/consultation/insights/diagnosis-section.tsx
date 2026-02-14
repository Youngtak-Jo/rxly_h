"use client"

import { useState, useCallback, useRef } from "react"
import { useInsightsStore } from "@/stores/insights-store"
import { useConnectorStore } from "@/stores/connector-store"
import { useSettingsStore } from "@/stores/settings-store"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  IconStethoscope,
  IconExternalLink,
  IconHierarchy2,
  IconAlertTriangle,
  IconTestPipe,
  IconPill,
  IconArrowUp,
  IconBulb,
  IconListCheck,
  IconReload,
} from "@tabler/icons-react"
import type { ReactNode } from "react"
import type {
  DiagnosisItem,
  DiagnosisDetails,
  DiagnosisDetailArticle,
  DiagnosisCitation,
  ClinicalSupportResponse,
  EnrichedSource,
  FetchStatus,
  Icd11Detail,
} from "@/types/insights"

const confidenceColors: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  moderate:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

// Inline citation regex — matches three pattern types:
// Group 1+2 = [[LABEL]](url) — xAI-style inline citation (primary format)
// Group 3 = bare URL (fallback)
// Group 4 = bare ICD code like (BA00.0) (fallback)
const CITATION_RE =
  /\[\[([^\]]+)\]\]\(([^)]+)\)|\(?(https?:\/\/[^\s)]+)\)?|\(([A-Z0-9]{2,5}(?:[./][A-Z0-9]{2,5})*)\)/g

function urlToBadgeLabel(url: string): string {
  if (url.includes("icd.who.int")) return "ICD-11"
  if (url.includes("pubmed.ncbi.nlm.nih.gov")) return "PUBMED"
  if (url.includes("europepmc.org")) return "EPMC"
  return "LINK"
}

const citationBadge =
  "inline-flex items-center text-[9px] font-medium uppercase px-1.5 py-0 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors no-underline mx-0.5 align-baseline"

function renderClinicalText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of text.matchAll(CITATION_RE)) {
    const matchStart = match.index!
    if (matchStart > lastIndex) {
      nodes.push(text.slice(lastIndex, matchStart))
    }

    if (match[1] && match[2]) {
      // [[LABEL]](url) — primary inline citation format
      nodes.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={citationBadge}
        >
          {match[1]}
        </a>
      )
    } else if (match[3]) {
      // Direct URL fallback
      nodes.push(
        <a
          key={key++}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className={citationBadge}
        >
          {urlToBadgeLabel(match[3])}
        </a>
      )
    } else if (match[4]) {
      // Bare ICD code fallback
      const code = match[4]
      const url = `https://icd.who.int/browse/2024-01/mms/en#${code.split(/[/.]/)[0]}`
      nodes.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={citationBadge}
        >
          {code}
        </a>
      )
    }

    lastIndex = matchStart + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}

interface MergedReference {
  citation: DiagnosisCitation
  icd11Detail?: Icd11Detail | null
  articleDetail?: DiagnosisDetailArticle | null
  isEnriched: boolean
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return u.origin + u.pathname.replace(/\/+$/, "")
  } catch {
    return url.toLowerCase().replace(/\/+$/, "")
  }
}

function mergeReferences(
  originalCitations: DiagnosisCitation[],
  details: DiagnosisDetails | null,
  cdsSources: EnrichedSource[]
): MergedReference[] {
  const seen = new Map<string, MergedReference>()

  // 1. Add original citations first (enriched from details API)
  const icd11Citations = originalCitations.filter((c) => c.source === "icd11")
  const articleCitations = originalCitations.filter((c) => c.source !== "icd11")

  icd11Citations.forEach((cite, i) => {
    const key = normalizeUrl(cite.url)
    seen.set(key, {
      citation: cite,
      icd11Detail: details?.icd11Details?.[i] ?? null,
      isEnriched: true,
    })
  })

  articleCitations.forEach((cite) => {
    const key = normalizeUrl(cite.url)
    const matchingArticle =
      details?.articles.find((a) => normalizeUrl(a.url) === key) ?? null
    seen.set(key, {
      citation: cite,
      articleDetail: matchingArticle,
      isEnriched: true,
    })
  })

  // 2. Add CDS enriched sources, skipping duplicates
  cdsSources.forEach((src) => {
    const key = normalizeUrl(src.citation.url)
    if (!seen.has(key)) {
      const hasEnrichedData = !!(src.icd11Detail || src.articleDetail)
      seen.set(key, {
        citation: src.citation,
        icd11Detail: src.icd11Detail ?? null,
        articleDetail: src.articleDetail
          ? {
              source: src.citation.source as "pubmed" | "europe_pmc",
              title: src.citation.title,
              abstract: src.articleDetail.abstract,
              authors: src.articleDetail.authors,
              url: src.citation.url,
            }
          : null,
        isEnriched: hasEnrichedData,
      })
    }
  })

  // 3. Return sorted: enriched first, then unenriched
  const merged = Array.from(seen.values())
  merged.sort((a, b) => {
    if (a.isEnriched !== b.isEnriched) return a.isEnriched ? -1 : 1
    return 0
  })

  return merged
}

function DiagnosisCard({
  diagnosis,
  onSelect,
}: {
  diagnosis: DiagnosisItem
  onSelect: (dx: DiagnosisItem) => void
}) {
  return (
    <div
      className="rounded-lg border p-3 space-y-2 cursor-pointer hover:border-foreground/30 transition-colors"
      onClick={() => onSelect(diagnosis)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{diagnosis.diseaseName}</p>
          <p className="text-xs text-muted-foreground font-mono">
            ICD-11: {diagnosis.icdCode}
          </p>
        </div>
        <Badge
          variant="secondary"
          className={`text-[10px] shrink-0 ${confidenceColors[diagnosis.confidence] || ""}`}
        >
          {diagnosis.confidence}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {diagnosis.evidence}
      </p>
      {diagnosis.citations.length > 0 && (
        <div className="pt-1 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            References
          </p>
          {(() => {
            const citations = diagnosis.citations
            // Pick up to 3 balanced across source types (round-robin)
            const grouped = new Map<string, typeof citations>()
            for (const c of citations) {
              const arr = grouped.get(c.source) ?? []
              arr.push(c)
              grouped.set(c.source, arr)
            }
            const queues = Array.from(grouped.values()).map((arr) => [...arr])
            const preview: typeof citations = []
            let qi = 0
            while (preview.length < 3 && queues.some((q) => q.length > 0)) {
              if (queues[qi].length > 0) {
                preview.push(queues[qi].shift()!)
              }
              qi = (qi + 1) % queues.length
            }
            const remaining = citations.length - preview.length
            return (
              <>
                {preview.map((cite, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400"
                  >
                    <span className="shrink-0 text-[9px] font-medium uppercase px-1 py-0.5 rounded bg-muted">
                      {cite.source === "europe_pmc"
                        ? "EPMC"
                        : cite.source.toUpperCase()}
                    </span>
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {cite.title}
                    </a>
                  </div>
                ))}
                {remaining > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{remaining} more source{remaining > 1 ? "s" : ""}
                  </p>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Separator />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  )
}

function ClinicalSupportSkeleton() {
  return (
    <div className="space-y-4 pr-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  )
}

function ClinicalSupportSection({
  support,
}: {
  support: ClinicalSupportResponse["support"]
}) {
  const render = (t: string) => renderClinicalText(t)

  return (
    <div className="space-y-4 pr-3">
      {/* Diagnostic Criteria */}
      {support.diagnosticCriteria.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <IconListCheck className="size-3.5 text-blue-500" />
            Diagnostic Criteria
          </p>
          <ul className="space-y-1 ml-5">
            {support.diagnosticCriteria.map((c, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground list-disc leading-relaxed"
              >
                {render(c)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Workup */}
      {support.recommendedWorkup.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <IconTestPipe className="size-3.5 text-violet-500" />
            Recommended Workup
          </p>
          <ul className="space-y-1 ml-5">
            {support.recommendedWorkup.map((w, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground list-disc leading-relaxed"
              >
                {render(w)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Treatment Options */}
      {(support.treatmentOptions.firstLine.length > 0 ||
        support.treatmentOptions.alternatives.length > 0 ||
        support.treatmentOptions.nonPharmacologic.length > 0) && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <IconPill className="size-3.5 text-emerald-500" />
            Treatment Options
          </p>
          {support.treatmentOptions.firstLine.length > 0 && (
            <div className="ml-5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                First-line
              </p>
              <ul className="space-y-0.5">
                {support.treatmentOptions.firstLine.map((t, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground list-disc leading-relaxed"
                  >
                    {render(t)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {support.treatmentOptions.alternatives.length > 0 && (
            <div className="ml-5 mt-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Alternatives
              </p>
              <ul className="space-y-0.5">
                {support.treatmentOptions.alternatives.map((t, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground list-disc leading-relaxed"
                  >
                    {render(t)}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {support.treatmentOptions.nonPharmacologic.length > 0 && (
            <div className="ml-5 mt-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Non-pharmacologic
              </p>
              <ul className="space-y-0.5">
                {support.treatmentOptions.nonPharmacologic.map((t, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground list-disc leading-relaxed"
                  >
                    {render(t)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Differentiating Features */}
      {support.differentiatingFeatures.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <IconStethoscope className="size-3.5 text-amber-500" />
            Key Differentiating Features
          </p>
          <ul className="space-y-1 ml-5">
            {support.differentiatingFeatures.map((f, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground list-disc leading-relaxed"
              >
                {render(f)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Escalation Criteria */}
      {support.escalationCriteria.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <IconArrowUp className="size-3.5 text-red-500" />
            Escalation Criteria
          </p>
          <ul className="space-y-1 ml-5">
            {support.escalationCriteria.map((e, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground list-disc leading-relaxed"
              >
                {render(e)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Clinical Pearls */}
      {support.clinicalPearls.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium flex items-center gap-1.5">
            <IconBulb className="size-3.5 text-yellow-500" />
            Clinical Pearls
          </p>
          <ul className="space-y-1 ml-5">
            {support.clinicalPearls.map((p, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground list-disc leading-relaxed"
              >
                {render(p)}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}

function FetchStatusBanner({ fetchStatus }: { fetchStatus: FetchStatus }) {
  const failures: string[] = []

  fetchStatus.icd11.forEach((entry) => {
    if (entry.status === "failed") failures.push("ICD-11 lookup failed")
    if (entry.status === "timeout") failures.push("ICD-11 lookup timed out")
    if (entry.status === "no_credentials")
      failures.push("ICD-11 API credentials not configured")
  })

  fetchStatus.articles.forEach((a) => {
    if (a.status !== "success") {
      const sourceLabel = a.source === "europe_pmc" ? "Europe PMC" : "PubMed"
      if (a.status === "id_extraction_failed") {
        failures.push(`Could not parse ${sourceLabel} article ID from URL`)
      } else if (a.status === "timeout") {
        failures.push(`${sourceLabel} article fetch timed out`)
      } else {
        failures.push(`${sourceLabel} article fetch failed`)
      }
    }
  })

  if (failures.length === 0) return null

  return (
    <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2.5 space-y-1">
      <p className="text-xs font-medium text-amber-800 dark:text-amber-400 flex items-center gap-1">
        <IconAlertTriangle className="size-3.5" />
        Some external sources could not be loaded
      </p>
      {failures.map((f, i) => (
        <p
          key={i}
          className="text-xs text-amber-700 dark:text-amber-500 ml-5"
        >
          - {f}
        </p>
      ))}
    </div>
  )
}

function RichReferenceCard({ reference }: { reference: MergedReference }) {
  const { citation, icd11Detail, articleDetail } = reference

  if (icd11Detail) {
    return (
      <div className="rounded-md border p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] uppercase shrink-0"
          >
            ICD-11
          </Badge>
          <span className="text-sm font-medium">{citation.title}</span>
        </div>
        {icd11Detail.parents.length > 0 && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <IconHierarchy2 className="size-3.5 shrink-0 mt-0.5" />
            <span>
              {icd11Detail.parents
                .map((p) => (p.code ? `${p.title} (${p.code})` : p.title))
                .join(" \u2192 ")}
            </span>
          </div>
        )}
        {icd11Detail.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {icd11Detail.description}
          </p>
        )}
        {citation.snippet && !icd11Detail.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {citation.snippet}
          </p>
        )}
        <a
          href={icd11Detail.browserUrl || citation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          <IconExternalLink className="size-3" />
          View source
        </a>
      </div>
    )
  }

  if (articleDetail) {
    return (
      <div className="rounded-md border p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <Badge
            variant="secondary"
            className="text-[10px] uppercase shrink-0"
          >
            {articleDetail.source === "europe_pmc" ? "EPMC" : "PUBMED"}
          </Badge>
          <span className="text-sm font-medium">{articleDetail.title}</span>
        </div>
        {articleDetail.authors.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {articleDetail.authors.join(", ")}
            {articleDetail.authors.length >= 5 && " et al."}
          </p>
        )}
        {articleDetail.abstract && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {articleDetail.abstract}
          </p>
        )}
        <a
          href={articleDetail.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          <IconExternalLink className="size-3" />
          View article
        </a>
      </div>
    )
  }

  // Fallback: enriched citation without detail data (fetch failed)
  return (
    <div className="rounded-md border p-3 space-y-1.5">
      <div className="flex items-start gap-2">
        <Badge variant="secondary" className="text-[10px] uppercase shrink-0">
          {citation.source === "europe_pmc"
            ? "EPMC"
            : citation.source.toUpperCase()}
        </Badge>
        <span className="text-sm font-medium">{citation.title}</span>
      </div>
      {citation.snippet && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
          {citation.snippet}
        </p>
      )}
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
      >
        <IconExternalLink className="size-3" />
        View source
      </a>
    </div>
  )
}

export function DiagnosisSection() {
  const diagnoses = useInsightsStore((s) => s.diagnoses)
  const [selectedDiagnosis, setSelectedDiagnosis] =
    useState<DiagnosisItem | null>(null)
  const [details, setDetails] = useState<DiagnosisDetails | null>(null)
  const [clinicalSupport, setClinicalSupport] =
    useState<ClinicalSupportResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClinicalLoading, setIsClinicalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cache: avoid re-fetching when reopening the same diagnosis
  const detailsCache = useRef(new Map<string, DiagnosisDetails>())
  const clinicalCache = useRef(new Map<string, ClinicalSupportResponse>())

  const handleSelect = useCallback(async (dx: DiagnosisItem) => {
    setSelectedDiagnosis(dx)
    setError(null)

    const cacheKey = `${dx.icdCode}:${dx.id}`

    // Restore from cache if available
    const cachedDetails = detailsCache.current.get(cacheKey)
    const cachedClinical = clinicalCache.current.get(cacheKey)

    setDetails(cachedDetails ?? null)
    setClinicalSupport(cachedClinical ?? null)

    if (cachedDetails && cachedClinical) {
      setIsLoading(false)
      setIsClinicalLoading(false)
      return
    }

    const detailsBody = JSON.stringify({
      icdCode: dx.icdCode,
      citations: dx.citations,
    })

    const enabledConnectors = useConnectorStore.getState().connectors
    const { clinicalSupportModel } = useSettingsStore.getState().aiModel
    const clinicalBody = JSON.stringify({
      icdCode: dx.icdCode,
      diseaseName: dx.diseaseName,
      confidence: dx.confidence,
      evidence: dx.evidence,
      citations: dx.citations,
      enabledConnectors,
      model: clinicalSupportModel,
    })

    // Fetch details (ICD-11 + articles) — fast
    if (!cachedDetails) {
      setIsLoading(true)
      fetch("/api/diagnoses/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: detailsBody,
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            detailsCache.current.set(cacheKey, data)
            setDetails(data)
          } else {
            setError("Failed to load diagnosis details. Please try again.")
          }
        })
        .catch(() => {
          setError("Failed to load diagnosis details. Please try again.")
        })
        .finally(() => setIsLoading(false))
    }

    // Fetch clinical support (Grok AI + RAG) — slow, independent
    if (!cachedClinical) {
      setIsClinicalLoading(true)
      fetch("/api/diagnoses/clinical-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: clinicalBody,
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            clinicalCache.current.set(cacheKey, data)
            setClinicalSupport(data)
          }
        })
        .catch(() => {
          // clinical support failure is non-critical
        })
        .finally(() => setIsClinicalLoading(false))
    }
  }, [])

  const handleClose = useCallback(() => {
    setSelectedDiagnosis(null)
    setDetails(null)
    setClinicalSupport(null)
    setError(null)
  }, [])

  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
        <IconStethoscope className="size-4 text-orange-500" />
        Differential Diagnosis
        {diagnoses.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {diagnoses.length}
          </Badge>
        )}
      </h3>
      {diagnoses.length === 0 ? (
        <p className="text-sm text-muted-foreground/50 italic">
          Diagnosis suggestions will appear as the AI identifies possible
          conditions...
        </p>
      ) : (
        <div className="space-y-2">
          {diagnoses.map((dx) => (
            <DiagnosisCard
              key={dx.id}
              diagnosis={dx}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      <Dialog open={!!selectedDiagnosis} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedDiagnosis?.diseaseName}</DialogTitle>
            <DialogDescription>
              ICD-11: {selectedDiagnosis?.icdCode}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <Badge
              variant="secondary"
              className={`text-xs ${confidenceColors[selectedDiagnosis?.confidence || ""] || ""}`}
            >
              {selectedDiagnosis?.confidence}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Evidence</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedDiagnosis?.evidence}
            </p>
          </div>

          <Separator />

          {isLoading && !details ? (
            <DetailSkeleton />
          ) : error && !details ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() =>
                  selectedDiagnosis && handleSelect(selectedDiagnosis)
                }
              >
                <IconReload className="size-3" />
                Retry
              </button>
            </div>
          ) : details ? (
            <Tabs defaultValue="clinical" className="flex-1 min-h-0">
              <TabsList className="w-full">
                <TabsTrigger value="clinical" className="flex-1">
                  Clinical Decision Support
                </TabsTrigger>
                <TabsTrigger value="references" className="flex-1">
                  References
                </TabsTrigger>
              </TabsList>

              <TabsContent value="clinical" className="mt-3">
                <ScrollArea className="h-[45vh]">
                  {isClinicalLoading ? (
                    <ClinicalSupportSkeleton />
                  ) : clinicalSupport ? (
                    <ClinicalSupportSection
                      support={clinicalSupport.support}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">
                      Clinical decision support could not be generated. The AI
                      service may be temporarily unavailable.
                    </p>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="references" className="mt-3">
                <ScrollArea className="h-[45vh]">
                  <div className="space-y-4 pr-3">
                    {(() => {
                      const merged = mergeReferences(
                        selectedDiagnosis?.citations ?? [],
                        details,
                        clinicalSupport?.sources ?? []
                      )
                      if (merged.length === 0 && !isClinicalLoading) {
                        return (
                          <p className="text-sm text-muted-foreground/50 italic py-4">
                            No references available from external sources.
                          </p>
                        )
                      }

                      return (
                        <>
                          <div className="space-y-3">
                            {merged.map((ref, i) => (
                              <RichReferenceCard
                                key={`ref-${i}`}
                                reference={ref}
                              />
                            ))}
                          </div>

                          {isClinicalLoading && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                              <div className="size-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                              Loading additional references...
                            </div>
                          )}

                          {details.fetchStatus && (
                            <FetchStatusBanner
                              fetchStatus={details.fetchStatus}
                            />
                          )}
                        </>
                      )
                    })()}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
