import { generateText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import { CLINICAL_SUPPORT_PROMPT } from "@/lib/prompts"
import {
  fetchRAGContext,
  formatRAGContextForPrompt,
  type RAGContext,
} from "@/lib/connectors"
import { fetchPubMedAbstracts } from "@/lib/connectors/pubmed"
import { fetchEuropePMCDetails } from "@/lib/connectors/europe-pmc"
import { getIcd11EntityDetails } from "@/lib/connectors/icd11"
import type {
  DiagnosisCitation,
  ClinicalDecisionSupport,
  ConnectorState,
  EnrichedSource,
} from "@/types/insights"

async function enrichSources(
  ragContext: RAGContext
): Promise<EnrichedSource[]> {
  const results: EnrichedSource[] = []

  // PubMed: single batch request instead of N individual requests
  const pubmedPromise = (async () => {
    const pmids = ragContext.pubmedResults.map((r) => r.pmid)
    const abstracts = await fetchPubMedAbstracts(pmids)
    ragContext.pubmedResults.forEach((r) => {
      const detail = abstracts.get(r.pmid)
      results.push({
        citation: { source: "pubmed", title: r.title, url: r.url },
        articleDetail: detail
          ? { abstract: detail.abstract, authors: detail.authors }
          : null,
      })
    })
  })()

  // EPMC + ICD-11: individual requests (their APIs don't rate-limit as aggressively)
  const epmcPromises = ragContext.europePmcResults.map((r) =>
    fetchEuropePMCDetails(r.id).then(
      (detail): EnrichedSource => ({
        citation: { source: "europe_pmc", title: r.title, url: r.url },
        articleDetail: detail
          ? { abstract: detail.abstractText, authors: detail.authors }
          : null,
      })
    )
  )

  const icd11Promises = ragContext.icd11Results.map((r) =>
    getIcd11EntityDetails(r.theCode).then(
      (detail): EnrichedSource => ({
        citation: {
          source: "icd11",
          title: `${r.theCode} - ${r.title}`,
          url: r.browserUrl,
        },
        icd11Detail: detail
          ? {
              description: detail.description,
              parents: detail.parents,
              browserUrl: detail.browserUrl,
            }
          : null,
      })
    )
  )

  const settled = await Promise.allSettled([
    pubmedPromise,
    ...epmcPromises,
    ...icd11Promises,
  ])

  // Add EPMC + ICD-11 results (PubMed results already pushed inside pubmedPromise)
  settled.slice(1).forEach((r) => {
    if (r.status === "fulfilled" && r.value) {
      results.push(r.value as EnrichedSource)
    }
  })

  return results
}

export async function POST(req: Request) {
  try {
    const {
      diseaseName,
      icdCode,
      confidence,
      evidence,
      citations,
      enabledConnectors,
    } = (await req.json()) as {
      diseaseName: string
      icdCode: string
      confidence: string
      evidence: string
      citations: DiagnosisCitation[]
      enabledConnectors?: ConnectorState
    }

    let prompt = `Diagnosis: ${diseaseName} (ICD-11: ${icdCode})
Confidence: ${confidence}
Evidence from consultation: ${evidence}`

    if (citations.length > 0) {
      prompt += `\n\nSupporting sources:`
      citations.forEach((c, i) => {
        prompt += `\n${i + 1}. [${c.source}] ${c.title}`
      })
    }

    // Fetch RAG context from enabled connectors
    const hasConnectors =
      enabledConnectors &&
      Object.values(enabledConnectors).some(Boolean)

    let sources: EnrichedSource[] = []

    if (hasConnectors) {
      try {
        const searchTerms = [`${diseaseName} ${icdCode}`.trim()]
        const ragContext = await fetchRAGContext(
          searchTerms,
          enabledConnectors
        )
        const ragText = formatRAGContextForPrompt(ragContext)
        if (ragText) {
          prompt += `\n\n--- EXTERNAL MEDICAL KNOWLEDGE ---${ragText}\n--- END EXTERNAL KNOWLEDGE ---`
        }

        // Run Grok generation + source enrichment in parallel
        const [grokResult, enrichedSources] = await Promise.all([
          generateText({
            model: xai(DEFAULT_MODEL),
            system: CLINICAL_SUPPORT_PROMPT,
            prompt,
            temperature: 0.2,
          }),
          enrichSources(ragContext),
        ])

        sources = enrichedSources

        const cleaned = grokResult.text
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim()
        const result = JSON.parse(cleaned) as ClinicalDecisionSupport

        return Response.json({ support: result, sources })
      } catch (error) {
        console.error("[clinical-support] RAG context fetch failed:", error)
      }
    }

    // Fallback: no connectors or RAG failed — run Grok alone
    const { text } = await generateText({
      model: xai(DEFAULT_MODEL),
      system: CLINICAL_SUPPORT_PROMPT,
      prompt,
      temperature: 0.2,
    })

    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim()
    const result = JSON.parse(cleaned) as ClinicalDecisionSupport

    return Response.json({ support: result, sources })
  } catch (err) {
    console.error("[clinical-support] Generation failed:", err)
    return Response.json(null, { status: 500 })
  }
}
