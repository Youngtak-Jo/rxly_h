export interface OpenFDAResult {
    drugName: string
    reactions: string[]
    reportCount: number
    seriousCount: number
    url: string
}

/**
 * Sanitize a query string for OpenFDA search syntax.
 * Removes characters that break the FDA search parser.
 */
function sanitizeQuery(query: string): string {
    return query
        .replace(/[":{}()\[\]\\\/]/g, " ") // remove special chars
        .replace(/\s+/g, " ") // collapse whitespace
        .trim()
        .split(" ")
        .slice(0, 6) // limit to first 6 words to avoid overly long queries
        .join(" ")
}

export async function searchOpenFDA(
    query: string,
    maxResults = 5
): Promise<OpenFDAResult[]> {
    const clean = sanitizeQuery(query)
    if (!clean || clean.length < 3) return []

    const url = new URL("https://api.fda.gov/drug/event.json")
    url.searchParams.set(
        "search",
        `patient.drug.openfda.generic_name:${clean}+patient.drug.openfda.brand_name:${clean}`
    )
    url.searchParams.set("count", "patient.reaction.reactionmeddrapt.exact")
    url.searchParams.set("limit", String(maxResults))
    if (process.env.OPENFDA_API_KEY) {
        url.searchParams.set("api_key", process.env.OPENFDA_API_KEY)
    }

    const res = await fetch(url.toString())
    if (!res.ok) {
        // OpenFDA returns 404 when no results found, 400 for bad queries
        if (res.status === 404 || res.status === 400) return []
        throw new Error(`OpenFDA search failed: ${res.status}`)
    }

    const data = await res.json()
    const results = data.results || []

    if (results.length === 0) return []

    // count endpoint returns { term, count } pairs — aggregate into one result
    const reactions = results.map(
        (r: { term: string; count: number }) => r.term
    )
    const totalCount = results.reduce(
        (sum: number, r: { count: number }) => sum + r.count,
        0
    )

    return [
        {
            drugName: clean,
            reactions: reactions.slice(0, 10),
            reportCount: totalCount,
            seriousCount: 0,
            url: `https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:${encodeURIComponent(clean)}`,
        },
    ]
}

export async function searchOpenFDALabeling(
    query: string,
    maxResults = 3
): Promise<
    {
        brandName: string
        genericName: string
        warnings: string
        adverseReactions: string
        url: string
    }[]
> {
    const clean = sanitizeQuery(query)
    if (!clean || clean.length < 3) return []

    const url = new URL("https://api.fda.gov/drug/label.json")
    url.searchParams.set(
        "search",
        `openfda.generic_name:${clean}+openfda.brand_name:${clean}`
    )
    url.searchParams.set("limit", String(maxResults))
    if (process.env.OPENFDA_API_KEY) {
        url.searchParams.set("api_key", process.env.OPENFDA_API_KEY)
    }

    const res = await fetch(url.toString())
    if (!res.ok) {
        if (res.status === 404 || res.status === 400) return []
        throw new Error(`OpenFDA labeling search failed: ${res.status}`)
    }

    const data = await res.json()
    const results = data.results || []

    return results.slice(0, maxResults).map(
        (r: {
            openfda?: {
                brand_name?: string[]
                generic_name?: string[]
            }
            warnings?: string[]
            adverse_reactions?: string[]
            set_id?: string
        }) => ({
            brandName: r.openfda?.brand_name?.[0] || "",
            genericName: r.openfda?.generic_name?.[0] || "",
            warnings: (r.warnings?.[0] || "").slice(0, 500),
            adverseReactions: (r.adverse_reactions?.[0] || "").slice(0, 500),
            url: r.set_id
                ? `https://api.fda.gov/drug/label.json?search=set_id:"${r.set_id}"`
                : `https://www.accessdata.fda.gov/scripts/cder/daf/`,
        })
    )
}
