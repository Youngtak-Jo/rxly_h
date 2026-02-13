export interface DailyMedResult {
    setId: string
    title: string
    activeIngredients: string[]
    publishedDate: string
    url: string
}

/**
 * DailyMed only works with actual drug names (e.g., "metformin", "empagliflozin").
 * General condition phrases like "diabetic neuropathy" return 0 results.
 *
 * Strategy: try each search term individually. If the full term returns nothing,
 * try individual words (many drug names are single words).
 */
export async function searchDailyMed(
    query: string,
    maxResults = 5
): Promise<DailyMedResult[]> {
    // Split the query into individual terms to try
    const words = query
        .replace(/[":{}()\[\]\\\/;!@#$%^&*]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter((w) => w.length >= 4) // drug names are typically 4+ chars

    if (words.length === 0) return []

    // Try each word as a potential drug name, collect unique results
    const seen = new Set<string>()
    const allResults: DailyMedResult[] = []

    for (const word of words) {
        if (allResults.length >= maxResults) break

        try {
            const results = await fetchDailyMedByDrugName(word, 2)
            for (const r of results) {
                if (!seen.has(r.setId)) {
                    seen.add(r.setId)
                    allResults.push(r)
                }
            }
        } catch {
            // skip failed individual lookups
        }
    }

    return allResults.slice(0, maxResults)
}

async function fetchDailyMedByDrugName(
    drugName: string,
    limit: number
): Promise<DailyMedResult[]> {
    const url = new URL(
        "https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json"
    )
    url.searchParams.set("drug_name", drugName)
    url.searchParams.set("page", "1")
    url.searchParams.set("pagesize", String(limit))

    const res = await fetch(url.toString())
    if (!res.ok) return []

    const data = await res.json()
    const results = data.data || []

    return results.map(
        (spl: {
            setid?: string
            title?: string
            published_date?: string
            active_ingredients?: string[]
        }) => {
            const setId = spl.setid || ""
            return {
                setId,
                title: spl.title || "",
                activeIngredients: spl.active_ingredients || [],
                publishedDate: spl.published_date || "",
                url: setId
                    ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`
                    : "https://dailymed.nlm.nih.gov/dailymed/",
            }
        }
    )
}

export interface DailyMedDetails {
    title: string
    indications: string
    warnings: string
    dosageAndAdministration: string
    adverseReactions: string
}

export async function fetchDailyMedDetails(
    setId: string
): Promise<DailyMedDetails | null> {
    try {
        const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls/${setId}.json`
        const res = await fetch(url)
        if (!res.ok) return null

        const data = await res.json()
        const sections = data.data?.sections || []

        function findSection(namePattern: RegExp): string {
            const section = sections.find(
                (s: { name?: string }) => namePattern.test(s.name || "")
            )
            if (!section) return ""
            return (section.text || "")
                .replace(/<[^>]*>/g, "")
                .trim()
                .slice(0, 800)
        }

        return {
            title: data.data?.title || "",
            indications: findSection(/indications/i),
            warnings: findSection(/warnings/i),
            dosageAndAdministration: findSection(/dosage/i),
            adverseReactions: findSection(/adverse/i),
        }
    } catch {
        return null
    }
}
