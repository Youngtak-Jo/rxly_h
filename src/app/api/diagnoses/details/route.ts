import { NextResponse } from "next/server"
import { getIcd11EntityDetails } from "@/lib/connectors/icd11"
import { logger } from "@/lib/logger"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { fetchPubMedAbstracts } from "@/lib/connectors/pubmed"
import { fetchEuropePMCDetails } from "@/lib/connectors/europe-pmc"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import type {
  DiagnosisCitation,
  DiagnosisDetails,
  DiagnosisDetailArticle,
  FetchStatus,
  Icd11Detail,
} from "@/types/insights"

const ICD11_TIMEOUT_MS = 15000
const ARTICLE_TIMEOUT_MS = 10000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ])
}

function extractPmidFromUrl(url: string): string | null {
  const match1 = url.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d+)/)
  if (match1) return match1[1]
  const match2 = url.match(/ncbi\.nlm\.nih\.gov\/pubmed\/(\d+)/)
  if (match2) return match2[1]
  const match3 = url.match(/\/pubmed\/?.*[?&]term=(\d+)/)
  if (match3) return match3[1]
  const numMatch = url.match(/\/(\d{7,10})\/?/)
  return numMatch?.[1] || null
}

function extractEpmcIdFromUrl(url: string): string | null {
  const match1 = url.match(/europepmc\.org\/article\/\w+\/(\w+)/)
  if (match1) return match1[1]
  const match2 = url.match(/europepmc\.org\/article\/PMC\/(PMC\d+)/)
  if (match2) return match2[1]
  const idMatch = url.match(/\/(\d{6,10})\/?$/)
  return idMatch?.[1] || null
}

function extractIcdCodeFromTitle(title: string): string | null {
  // Titles look like "5A11 - Type 2 diabetes mellitus" or "5A22.Z/5A11 - Diabetic acidosis..."
  const match = title.match(/^([\w.\/]+)\s*[-–—]/)
  return match?.[1]?.trim() || null
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const { icdCode, citations } = (await req.json()) as {
      icdCode: string
      citations: DiagnosisCitation[]
    }

    const icd11Citations = citations.filter((c) => c.source === "icd11")
    const articleCitations = citations.filter((c) => c.source !== "icd11")

    logger.info(
      `[diagnosis-details] Fetching for ICD: ${icdCode}, icd11 citations: ${icd11Citations.length}, article citations: ${articleCitations.length}`
    )

    const fetchStatus: FetchStatus = {
      icd11: [],
      articles: [],
    }

    // ICD-11 details — fetch for each ICD-11 citation
    const icd11Promises: Promise<Icd11Detail | null>[] = icd11Citations.map(
      async (cite) => {
        // Extract the code from the citation title, fall back to the main icdCode
        const code = extractIcdCodeFromTitle(cite.title) || icdCode
        try {
          const result = await withTimeout(
            getIcd11EntityDetails(code),
            ICD11_TIMEOUT_MS
          )
          fetchStatus.icd11.push({
            url: cite.url,
            status: result ? "success" : "failed",
          })
          return result
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          let status: "failed" | "timeout" | "no_credentials" = "failed"
          if (msg.includes("credentials")) status = "no_credentials"
          else if (msg === "timeout") status = "timeout"
          fetchStatus.icd11.push({ url: cite.url, status })
          logger.error(
            `[diagnosis-details] ICD-11 fetch failed for ${code}:`,
            err
          )
          return null
        }
      }
    )

    // Article details — PubMed uses batch, EPMC uses individual requests
    const pubmedCitations = articleCitations.filter(
      (c) => c.source === "pubmed"
    )
    const epmcCitations = articleCitations.filter(
      (c) => c.source === "europe_pmc"
    )

    // Extract PMIDs and track which citations have valid IDs
    const pubmedEntries = pubmedCitations.map((cite) => ({
      cite,
      pmid: extractPmidFromUrl(cite.url),
    }))

    // Report extraction failures
    pubmedEntries
      .filter((e) => !e.pmid)
      .forEach((e) => {
        logger.warn(
          `[diagnosis-details] Could not extract PMID from: ${e.cite.url}`
        )
        fetchStatus.articles.push({
          source: e.cite.source,
          url: e.cite.url,
          status: "id_extraction_failed",
        })
      })

    // Batch fetch all PubMed abstracts in a single request
    const validPmids = pubmedEntries
      .filter((e) => e.pmid)
      .map((e) => e.pmid!)

    const pubmedBatchPromise = validPmids.length > 0
      ? withTimeout(fetchPubMedAbstracts(validPmids), ARTICLE_TIMEOUT_MS)
          .catch((err) => {
            const isTimeout =
              err instanceof Error && err.message === "timeout"
            validPmids.forEach((pmid) => {
              const entry = pubmedEntries.find((e) => e.pmid === pmid)
              if (entry) {
                fetchStatus.articles.push({
                  source: entry.cite.source,
                  url: entry.cite.url,
                  status: isTimeout ? "timeout" : "failed",
                })
              }
            })
            logger.error(
              `[diagnosis-details] PubMed batch fetch failed:`,
              err
            )
            return new Map<string, { abstract: string; authors: string[] }>()
          })
      : Promise.resolve(
          new Map<string, { abstract: string; authors: string[] }>()
        )

    // EPMC: individual requests (no batch API)
    const epmcPromises: Promise<DiagnosisDetailArticle | null>[] =
      epmcCitations.map(async (cite) => {
        try {
          const id = extractEpmcIdFromUrl(cite.url)
          if (!id) {
            logger.warn(
              `[diagnosis-details] Could not extract EPMC ID from: ${cite.url}`
            )
            fetchStatus.articles.push({
              source: cite.source,
              url: cite.url,
              status: "id_extraction_failed",
            })
            return null
          }
          const result = await withTimeout(
            fetchEuropePMCDetails(id),
            ARTICLE_TIMEOUT_MS
          )
          if (!result) {
            fetchStatus.articles.push({
              source: cite.source,
              url: cite.url,
              status: "failed",
            })
            return null
          }
          fetchStatus.articles.push({
            source: cite.source,
            url: cite.url,
            status: "success",
          })
          return {
            source: "europe_pmc" as const,
            title: cite.title,
            abstract: result.abstractText,
            authors: result.authors,
            url: cite.url,
          }
        } catch (err) {
          const isTimeout =
            err instanceof Error && err.message === "timeout"
          fetchStatus.articles.push({
            source: cite.source,
            url: cite.url,
            status: isTimeout ? "timeout" : "failed",
          })
          logger.error(
            `[diagnosis-details] EPMC article fetch failed:`,
            err
          )
          return null
        }
      })

    // Build PubMed articles from batch result
    const buildPubmedArticles = async (): Promise<
      (DiagnosisDetailArticle | null)[]
    > => {
      const abstractsMap = await pubmedBatchPromise
      return pubmedEntries
        .filter((e) => e.pmid)
        .map((e) => {
          const result = abstractsMap.get(e.pmid!)
          if (!result) {
            fetchStatus.articles.push({
              source: e.cite.source,
              url: e.cite.url,
              status: "failed",
            })
            return null
          }
          fetchStatus.articles.push({
            source: e.cite.source,
            url: e.cite.url,
            status: "success",
          })
          return {
            source: "pubmed" as const,
            title: e.cite.title,
            abstract: result.abstract,
            authors: result.authors,
            url: e.cite.url,
          }
        })
    }

    const articlePromises = [buildPubmedArticles(), Promise.all(epmcPromises)]

    const [icd11Results, [pubmedArticles, epmcArticles]] = await Promise.all([
      Promise.all(icd11Promises),
      Promise.all(articlePromises),
    ])

    const allArticles = [...pubmedArticles, ...epmcArticles]

    const details: DiagnosisDetails = {
      icd11Details: icd11Results,
      articles: allArticles.filter(Boolean) as DiagnosisDetailArticle[],
      fetchStatus,
    }

    logger.info(
      `[diagnosis-details] Result: icd11=${icd11Results.filter(Boolean).length}/${icd11Results.length}, articles=${details.articles.length}`
    )

    logAudit({ userId: user.id, action: "READ", resource: "diagnosis_details" })
    return Response.json(details)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Diagnosis details fetch error:", error)
    return Response.json(
      {
        icd11Details: [],
        articles: [],
        fetchStatus: { icd11: [], articles: [] },
      } satisfies DiagnosisDetails,
      { status: 500 }
    )
  }
}
