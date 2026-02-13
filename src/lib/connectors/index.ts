import { searchPubMed, type PubMedResult } from "./pubmed"
import { searchIcd11, type Icd11SearchResult } from "./icd11"
import { searchEuropePMC, type EuropePMCResult } from "./europe-pmc"
import { searchOpenFDA, type OpenFDAResult } from "./openfda"
import {
  searchClinicalTrials,
  type ClinicalTrialResult,
} from "./clinical-trials"
import { searchDailyMed, type DailyMedResult } from "./dailymed"
import type { ConnectorState } from "@/types/insights"

export interface RAGContext {
  pubmedResults: PubMedResult[]
  icd11Results: Icd11SearchResult[]
  europePmcResults: EuropePMCResult[]
  openfdaResults: OpenFDAResult[]
  clinicalTrialsResults: ClinicalTrialResult[]
  dailymedResults: DailyMedResult[]
}

export interface RAGSourceMeta {
  icd11Count: number
  pubmedCount: number
  europePmcCount: number
  openfdaCount: number
  clinicalTrialsCount: number
  dailymedCount: number
  availableSources: string[]
}

export function getRAGSourceMeta(context: RAGContext): RAGSourceMeta {
  const availableSources: string[] = []
  const icd11Count = context.icd11Results.length
  const pubmedCount = context.pubmedResults.length
  const europePmcCount = context.europePmcResults.length
  const openfdaCount = context.openfdaResults.length
  const clinicalTrialsCount = context.clinicalTrialsResults.length
  const dailymedCount = context.dailymedResults.length

  if (pubmedCount > 0) availableSources.push("PubMed")
  if (europePmcCount > 0) availableSources.push("Europe PMC")
  if (icd11Count > 0) availableSources.push("ICD-11")
  if (openfdaCount > 0) availableSources.push("OpenFDA")
  if (clinicalTrialsCount > 0) availableSources.push("ClinicalTrials.gov")
  if (dailymedCount > 0) availableSources.push("DailyMed")

  return {
    icd11Count,
    pubmedCount,
    europePmcCount,
    openfdaCount,
    clinicalTrialsCount,
    dailymedCount,
    availableSources,
  }
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

  const [
    pubmedResults,
    icd11Results,
    europePmcResults,
    openfdaResults,
    clinicalTrialsResults,
    dailymedResults,
  ] = await Promise.allSettled([
    enabledConnectors.pubmed
      ? withTimeout(searchPubMed(query), CONNECTOR_TIMEOUT_MS)
      : Promise.resolve([]),
    enabledConnectors.icd11
      ? withTimeout(searchIcd11(query), CONNECTOR_TIMEOUT_MS)
      : Promise.resolve([]),
    enabledConnectors.europe_pmc
      ? withTimeout(searchEuropePMC(query), CONNECTOR_TIMEOUT_MS)
      : Promise.resolve([]),
    enabledConnectors.openfda
      ? withTimeout(searchOpenFDA(query), CONNECTOR_TIMEOUT_MS)
      : Promise.resolve([]),
    enabledConnectors.clinical_trials
      ? withTimeout(searchClinicalTrials(query), CONNECTOR_TIMEOUT_MS)
      : Promise.resolve([]),
    enabledConnectors.dailymed
      ? withTimeout(searchDailyMed(query), CONNECTOR_TIMEOUT_MS)
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
  if (openfdaResults.status === "rejected") {
    console.warn(`[RAG] OpenFDA connector failed:`, openfdaResults.reason)
  }
  if (clinicalTrialsResults.status === "rejected") {
    console.warn(
      `[RAG] ClinicalTrials.gov connector failed:`,
      clinicalTrialsResults.reason
    )
  }
  if (dailymedResults.status === "rejected") {
    console.warn(`[RAG] DailyMed connector failed:`, dailymedResults.reason)
  }

  return {
    pubmedResults:
      pubmedResults.status === "fulfilled" ? pubmedResults.value : [],
    icd11Results:
      icd11Results.status === "fulfilled" ? icd11Results.value : [],
    europePmcResults:
      europePmcResults.status === "fulfilled" ? europePmcResults.value : [],
    openfdaResults:
      openfdaResults.status === "fulfilled" ? openfdaResults.value : [],
    clinicalTrialsResults:
      clinicalTrialsResults.status === "fulfilled"
        ? clinicalTrialsResults.value
        : [],
    dailymedResults:
      dailymedResults.status === "fulfilled" ? dailymedResults.value : [],
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
    if (meta.openfdaCount > 0)
      summary += `\n- OpenFDA: ${meta.openfdaCount} results`
    if (meta.clinicalTrialsCount > 0)
      summary += `\n- ClinicalTrials.gov: ${meta.clinicalTrialsCount} results`
    if (meta.dailymedCount > 0)
      summary += `\n- DailyMed: ${meta.dailymedCount} results`
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

  // Tier 1 sources
  if (context.openfdaResults.length > 0) {
    let text = "\n[OpenFDA Drug Adverse Events]"
    context.openfdaResults.forEach((r, i) => {
      text += `\n${i + 1}. Drug: "${r.drugName}" — Top reported reactions: ${r.reactions.slice(0, 5).join(", ")} (${r.reportCount} total reports) URL: ${r.url}`
    })
    sections.push(text)
  }

  if (context.clinicalTrialsResults.length > 0) {
    let text = "\n[ClinicalTrials.gov Active Studies]"
    context.clinicalTrialsResults.forEach((r, i) => {
      text += `\n${i + 1}. "${r.title}" (${r.nctId}, Phase: ${r.phase}, Status: ${r.status}) URL: ${r.url}`
    })
    sections.push(text)
  }

  if (context.dailymedResults.length > 0) {
    let text = "\n[DailyMed Drug Labels]"
    context.dailymedResults.forEach((r, i) => {
      const ingredients =
        r.activeIngredients.length > 0
          ? ` — Active: ${r.activeIngredients.join(", ")}`
          : ""
      text += `\n${i + 1}. "${r.title}"${ingredients} URL: ${r.url}`
    })
    sections.push(text)
  }

  return sections.join("\n")
}
