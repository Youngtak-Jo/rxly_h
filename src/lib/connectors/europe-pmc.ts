export interface EuropePMCResult {
  id: string
  pmid?: string
  title: string
  authorString: string
  journalTitle: string
  pubYear: string
  url: string
}

export interface EuropePMCDetails {
  abstractText: string
  authors: string[]
}

export async function fetchEuropePMCDetails(
  articleId: string
): Promise<EuropePMCDetails | null> {
  try {
    const searchUrl = new URL(
      "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    )
    searchUrl.searchParams.set("query", `EXT_ID:${articleId}`)
    searchUrl.searchParams.set("format", "json")
    searchUrl.searchParams.set("resultType", "core")
    searchUrl.searchParams.set("pageSize", "1")

    const res = await fetch(searchUrl.toString())
    if (!res.ok) return null

    const data = await res.json()
    const article = data.resultList?.result?.[0]
    if (!article) return null

    const authors: string[] = (article.authorList?.author || [])
      .slice(0, 5)
      .map((a: { fullName?: string }) => a.fullName || "")
      .filter(Boolean)

    return {
      abstractText: article.abstractText || "",
      authors,
    }
  } catch {
    return null
  }
}

export async function searchEuropePMC(
  query: string,
  maxResults = 8
): Promise<EuropePMCResult[]> {
  const url = new URL(
    "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
  )
  url.searchParams.set("query", query)
  url.searchParams.set("format", "json")
  url.searchParams.set("pageSize", String(maxResults))
  url.searchParams.set("resultType", "lite")

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`Europe PMC search failed: ${res.status}`)
  }

  const data = await res.json()
  const results = data.resultList?.result || []

  return results.map(
    (r: {
      id?: string
      pmid?: string
      title?: string
      authorString?: string
      journalTitle?: string
      pubYear?: string
      source?: string
    }) => ({
      id: r.id || "",
      pmid: r.pmid || undefined,
      title: r.title || "",
      authorString: r.authorString || "",
      journalTitle: r.journalTitle || "",
      pubYear: r.pubYear || "",
      url: r.pmid
        ? `https://europepmc.org/article/MED/${r.pmid}`
        : `https://europepmc.org/article/${r.source || "MED"}/${r.id}`,
    })
  )
}
