export interface PubMedResult {
  pmid: string
  title: string
  source: string
  pubDate: string
  url: string
}

export interface PubMedAbstract {
  abstract: string
  authors: string[]
}

function parseArticleXml(xml: string): PubMedAbstract {
  const abstractMatch = xml.match(
    /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g
  )
  const abstract = abstractMatch
    ? abstractMatch
        .map((m) => m.replace(/<[^>]*>/g, "").trim())
        .join(" ")
    : ""

  const authors: string[] = []
  const authorMatches = xml.matchAll(
    /<Author[^>]*>[\s\S]*?<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>[\s\S]*?<\/Author>/g
  )
  for (const match of authorMatches) {
    authors.push(`${match[2]} ${match[1]}`)
  }

  return { abstract, authors: authors.slice(0, 5) }
}

export async function fetchPubMedAbstracts(
  pmids: string[]
): Promise<Map<string, PubMedAbstract>> {
  if (pmids.length === 0) return new Map()

  try {
    const url = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    )
    url.searchParams.set("db", "pubmed")
    url.searchParams.set("id", pmids.join(","))
    url.searchParams.set("rettype", "xml")
    url.searchParams.set("retmode", "xml")
    if (process.env.NCBI_API_KEY) {
      url.searchParams.set("api_key", process.env.NCBI_API_KEY)
    }

    const res = await fetch(url.toString())
    if (!res.ok) return new Map()

    const xml = await res.text()
    const results = new Map<string, PubMedAbstract>()

    const articleBlocks =
      xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []
    for (const block of articleBlocks) {
      const pmidMatch = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)
      if (!pmidMatch) continue
      results.set(pmidMatch[1], parseArticleXml(block))
    }

    return results
  } catch {
    return new Map()
  }
}

export async function fetchPubMedAbstract(
  pmid: string
): Promise<PubMedAbstract | null> {
  try {
    const url = new URL(
      "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    )
    url.searchParams.set("db", "pubmed")
    url.searchParams.set("id", pmid)
    url.searchParams.set("rettype", "xml")
    url.searchParams.set("retmode", "xml")
    if (process.env.NCBI_API_KEY) {
      url.searchParams.set("api_key", process.env.NCBI_API_KEY)
    }

    const res = await fetch(url.toString())
    if (!res.ok) return null

    const xml = await res.text()
    return parseArticleXml(xml)
  } catch {
    return null
  }
}

export async function searchPubMed(
  query: string,
  maxResults = 8
): Promise<PubMedResult[]> {
  // Step 1: ESearch to get PMIDs
  const searchUrl = new URL(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
  )
  searchUrl.searchParams.set("db", "pubmed")
  searchUrl.searchParams.set("term", query)
  searchUrl.searchParams.set("retmax", String(maxResults))
  searchUrl.searchParams.set("retmode", "json")
  searchUrl.searchParams.set("sort", "relevance")
  if (process.env.NCBI_API_KEY) {
    searchUrl.searchParams.set("api_key", process.env.NCBI_API_KEY)
  }

  const searchRes = await fetch(searchUrl.toString())
  if (!searchRes.ok) {
    throw new Error(`PubMed search failed: ${searchRes.status}`)
  }

  const searchData = await searchRes.json()
  const pmids: string[] = searchData.esearchresult?.idlist || []

  if (pmids.length === 0) return []

  // Step 2: ESummary to get article details (JSON format)
  const summaryUrl = new URL(
    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
  )
  summaryUrl.searchParams.set("db", "pubmed")
  summaryUrl.searchParams.set("id", pmids.join(","))
  summaryUrl.searchParams.set("retmode", "json")
  if (process.env.NCBI_API_KEY) {
    summaryUrl.searchParams.set("api_key", process.env.NCBI_API_KEY)
  }

  const summaryRes = await fetch(summaryUrl.toString())
  if (!summaryRes.ok) {
    throw new Error(`PubMed summary failed: ${summaryRes.status}`)
  }

  const summaryData = await summaryRes.json()
  const result = summaryData.result || {}

  return pmids
    .map((pmid) => {
      const article = result[pmid]
      if (!article) return null
      return {
        pmid,
        title: article.title || "",
        source: article.source || "",
        pubDate: article.pubdate || "",
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      }
    })
    .filter(Boolean) as PubMedResult[]
}
