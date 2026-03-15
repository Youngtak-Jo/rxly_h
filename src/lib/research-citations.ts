import type { ResearchCitation } from "@/stores/research-store"

const BRACKET_CITATION_RE = /\[\[([^\]]+)\]\]\(([^)]+)\)/g
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
const URL_RE = /https?:\/\/[^\s)]+/g

function normalizeUrl(url: string): string {
  return url.trim().replace(/[.,;:]+$/, "")
}

function sourceFromUrl(url: string): ResearchCitation["source"] {
  if (url.includes("pubmed.ncbi.nlm.nih.gov")) return "pubmed"
  if (url.includes("europepmc.org")) return "europe_pmc"
  if (url.includes("icd.who.int")) return "icd11"
  if (url.includes("api.fda.gov") || url.includes("open.fda.gov")) return "openfda"
  if (url.includes("clinicaltrials.gov")) return "clinical_trials"
  if (url.includes("dailymed.nlm.nih.gov")) return "dailymed"
  return "pubmed"
}

export function parseResearchCitations(text: string): ResearchCitation[] {
  const citations: ResearchCitation[] = []
  const seen = new Set<string>()
  const sourceMap: Record<string, ResearchCitation["source"]> = {
    PUBMED: "pubmed",
    EPMC: "europe_pmc",
    "ICD-11": "icd11",
    ICD11: "icd11",
    FDA: "openfda",
    OPENFDA: "openfda",
    TRIALS: "clinical_trials",
    "CLINICALTRIALS.GOV": "clinical_trials",
    DAILYMED: "dailymed",
  }

  const addCitation = (label: string, rawUrl: string) => {
    const url = normalizeUrl(rawUrl)
    if (!url || seen.has(url)) return

    seen.add(url)
    const normalizedLabel = label.trim().toUpperCase()
    citations.push({
      source: sourceMap[normalizedLabel] || sourceFromUrl(url),
      title: label.trim() || normalizedLabel,
      url,
    })
  }

  for (const match of text.matchAll(BRACKET_CITATION_RE)) {
    addCitation(match[1], match[2])
  }

  for (const match of text.matchAll(MARKDOWN_LINK_RE)) {
    addCitation(match[1], match[2])
  }

  for (const match of text.matchAll(URL_RE)) {
    const url = normalizeUrl(match[0])
    if (!url || seen.has(url)) continue

    citations.push({
      source: sourceFromUrl(url),
      title: sourceFromUrl(url).toUpperCase(),
      url,
    })
    seen.add(url)
  }

  return citations
}
