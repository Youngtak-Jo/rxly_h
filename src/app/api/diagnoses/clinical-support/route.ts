import { NextResponse } from "next/server"
import { generateText } from "ai"
import { DEFAULT_MODEL } from "@/lib/grok"
import { getModel } from "@/lib/ai-provider"
import { CLINICAL_SUPPORT_PROMPT } from "@/lib/prompts"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
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
import { logger } from "@/lib/logger"

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

  // Tier 1 connectors — pass through as-is (no dedicated detail APIs)
  const openfdaSources: EnrichedSource[] = ragContext.openfdaResults.map(
    (r) => ({
      citation: { source: "openfda", title: `FDA Adverse Events: ${r.drugName}`, url: r.url },
      articleDetail: {
        abstract: `Top reported reactions: ${r.reactions.join(", ")}. Total reports: ${r.reportCount}`,
        authors: [],
      },
    })
  )

  const clinicalTrialsSources: EnrichedSource[] =
    ragContext.clinicalTrialsResults.map((r) => ({
      citation: { source: "clinical_trials", title: r.title, url: r.url },
      articleDetail: {
        abstract: `${r.nctId} | Phase: ${r.phase} | Status: ${r.status} | Conditions: ${r.conditions.join(", ")}`,
        authors: [],
      },
    }))

  const dailymedSources: EnrichedSource[] = ragContext.dailymedResults.map(
    (r) => ({
      citation: { source: "dailymed", title: r.title, url: r.url },
      articleDetail: {
        abstract: `Active ingredients: ${r.activeIngredients.join(", ") || "N/A"}`,
        authors: [],
      },
    })
  )

  // Add Tier 1 connector sources
  results.push(...openfdaSources, ...clinicalTrialsSources, ...dailymedSources)

  return results
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "ai")
    if (!allowed) return rateLimitResponse()

    const {
      diseaseName,
      icdCode,
      confidence,
      evidence,
      citations,
      enabledConnectors,
      model: modelOverride,
    } = (await req.json()) as {
      diseaseName: string
      icdCode: string
      confidence: string
      evidence: string
      citations: DiagnosisCitation[]
      enabledConnectors?: ConnectorState
      model?: string
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
            model: getModel(modelOverride || DEFAULT_MODEL),
            system: CLINICAL_SUPPORT_PROMPT,
            prompt,
            temperature: 0.2,
          }),
          enrichSources(ragContext),
        ])

        sources = enrichedSources

        let result: ClinicalDecisionSupport
        try {
          const cleaned = grokResult.text
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim()
          result = JSON.parse(cleaned) as ClinicalDecisionSupport
        } catch {
          logger.error("[clinical-support] AI returned invalid JSON (with RAG)")
          return NextResponse.json({ error: "AI returned invalid response format" }, { status: 502 })
        }

        logAudit({ userId: user.id, action: "READ", resource: "clinical_support" })
        return Response.json({ support: result, sources })
      } catch (error) {
        logger.error("[clinical-support] RAG context fetch failed:", error)
      }
    }

    // Fallback: no connectors or RAG failed — run Grok alone
    const { text } = await generateText({
      model: getModel(modelOverride || DEFAULT_MODEL),
      system: CLINICAL_SUPPORT_PROMPT,
      prompt,
      temperature: 0.2,
    })

    let result: ClinicalDecisionSupport
    try {
      const cleaned = text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim()
      result = JSON.parse(cleaned) as ClinicalDecisionSupport
    } catch {
      logger.error("[clinical-support] AI returned invalid JSON")
      return NextResponse.json({ error: "AI returned invalid response format" }, { status: 502 })
    }

    logAudit({ userId: user.id, action: "READ", resource: "clinical_support" })
    return Response.json({ support: result, sources })
  } catch (err) {
    if (err instanceof NextResponse) return err
    logger.error("[clinical-support] Generation failed:", err)
    return Response.json(null, { status: 500 })
  }
}
