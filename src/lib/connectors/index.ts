import { searchPubMed, type PubMedResult } from "./pubmed"
import { searchIcd11, type Icd11SearchResult } from "./icd11"
import { searchEuropePMC, type EuropePMCResult } from "./europe-pmc"
import type { ConnectorState } from "@/types/insights"

export interface RAGContext {
  pubmedResults: PubMedResult[]
  icd11Results: Icd11SearchResult[]
  europePmcResults: EuropePMCResult[]
}

export interface RAGSourceMeta {
  icd11Count: number
  pubmedCount: number
  europePmcCount: number
  availableSources: string[]
}

export function getRAGSourceMeta(context: RAGContext): RAGSourceMeta {
  const availableSources: string[] = []
  const icd11Count = context.icd11Results.length
  const pubmedCount = context.pubmedResults.length
  const europePmcCount = context.europePmcResults.length

  if (pubmedCount > 0) availableSources.push("PubMed")
  if (europePmcCount > 0) availableSources.push("Europe PMC")
  if (icd11Count > 0) availableSources.push("ICD-11")

  return { icd11Count, pubmedCount, europePmcCount, availableSources }
}

const CONNECTOR_TIMEOUT_MS = 12000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Connector timeout")), ms)
    ),
  ])
}

export async function fetchRAGContext(
  searchTerms: string[],
  enabledConnectors: ConnectorState
): Promise<RAGContext> {
  const query = searchTerms.join(" ")

  const [pubmedResults, icd11Results, europePmcResults] =
    await Promise.allSettled([
      enabledConnectors.pubmed
        ? withTimeout(searchPubMed(query), CONNECTOR_TIMEOUT_MS)
        : Promise.resolve([]),
      enabledConnectors.icd11
        ? withTimeout(searchIcd11(query), CONNECTOR_TIMEOUT_MS)
        : Promise.resolve([]),
      enabledConnectors.europe_pmc
        ? withTimeout(searchEuropePMC(query), CONNECTOR_TIMEOUT_MS)
        : Promise.resolve([]),
    ])

  if (pubmedResults.status === "rejected") {
    console.warn(`[RAG] PubMed connector failed:`, pubmedResults.reason)
  }
  if (icd11Results.status === "rejected") {
    console.warn(`[RAG] ICD-11 connector failed:`, icd11Results.reason)
  }
  if (europePmcResults.status === "rejected") {
    console.warn(`[RAG] Europe PMC connector failed:`, europePmcResults.reason)
  }

  return {
    pubmedResults:
      pubmedResults.status === "fulfilled" ? pubmedResults.value : [],
    icd11Results:
      icd11Results.status === "fulfilled" ? icd11Results.value : [],
    europePmcResults:
      europePmcResults.status === "fulfilled" ? europePmcResults.value : [],
  }
}

export function formatRAGContextForPrompt(context: RAGContext): string {
  const meta = getRAGSourceMeta(context)
  const sections: string[] = []

  // Source availability summary — placed at top for LLM visibility
  if (meta.availableSources.length > 0) {
    let summary =
      "\n[AVAILABLE SOURCES - You MUST cite from EVERY source listed here]"
    if (meta.pubmedCount > 0)
      summary += `\n- PubMed: ${meta.pubmedCount} results`
    if (meta.europePmcCount > 0)
      summary += `\n- Europe PMC: ${meta.europePmcCount} results`
    if (meta.icd11Count > 0)
      summary += `\n- ICD-11: ${meta.icd11Count} results`
    sections.push(summary)
  }

  // Literature sources first to counteract ICD-11 attention bias
  if (context.pubmedResults.length > 0) {
    let text = "\n[PubMed Literature]"
    context.pubmedResults.forEach((r, i) => {
      text += `\n${i + 1}. "${r.title}" (${r.source}, ${r.pubDate}) URL: ${r.url}`
    })
    sections.push(text)
  }

  if (context.europePmcResults.length > 0) {
    let text = "\n[Europe PMC Literature]"
    context.europePmcResults.forEach((r, i) => {
      text += `\n${i + 1}. "${r.title}" (${r.journalTitle}, ${r.pubYear}) URL: ${r.url}`
    })
    sections.push(text)
  }

  if (context.icd11Results.length > 0) {
    let text = "\n[ICD-11 Disease Classifications]"
    context.icd11Results.forEach((r, i) => {
      text += `\n${i + 1}. ${r.theCode} - ${r.title} (URL: ${r.browserUrl})`
    })
    sections.push(text)
  }

  return sections.join("\n")
}
