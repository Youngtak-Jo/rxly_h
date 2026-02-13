export interface ClinicalTrialResult {
    nctId: string
    title: string
    status: string
    phase: string
    conditions: string[]
    interventions: string[]
    url: string
}

/**
 * Sanitize query for ClinicalTrials.gov v2 API.
 * The API rejects queries with certain special characters.
 */
function sanitizeQuery(query: string): string {
    return query
        .replace(/[":{}()\[\]\\\/;!@#$%^&*]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .slice(0, 8) // limit to 8 words
        .join(" ")
}

export async function searchClinicalTrials(
    query: string,
    maxResults = 5
): Promise<ClinicalTrialResult[]> {
    const clean = sanitizeQuery(query)
    if (!clean || clean.length < 3) return []

    const url = new URL("https://clinicaltrials.gov/api/v2/studies")
    url.searchParams.set("query.term", clean)
    url.searchParams.set("pageSize", String(maxResults))
    url.searchParams.set("sort", "LastUpdatePostDate:desc")
    url.searchParams.set("format", "json")

    const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
    })

    if (!res.ok) {
        // Return empty on 400 (bad query) instead of throwing
        if (res.status === 400) return []
        throw new Error(`ClinicalTrials.gov search failed: ${res.status}`)
    }

    const data = await res.json()
    const studies = data.studies || []

    return studies.slice(0, maxResults).map(
        (study: {
            protocolSection?: {
                identificationModule?: {
                    nctId?: string
                    briefTitle?: string
                }
                statusModule?: {
                    overallStatus?: string
                }
                designModule?: {
                    phases?: string[]
                }
                conditionsModule?: {
                    conditions?: string[]
                }
                armsInterventionsModule?: {
                    interventions?: { name?: string }[]
                }
            }
        }) => {
            const proto = study.protocolSection || {}
            const nctId = proto.identificationModule?.nctId || ""
            return {
                nctId,
                title: proto.identificationModule?.briefTitle || "",
                status: proto.statusModule?.overallStatus || "",
                phase: (proto.designModule?.phases || []).join(", ") || "N/A",
                conditions: proto.conditionsModule?.conditions || [],
                interventions: (
                    proto.armsInterventionsModule?.interventions || []
                ).map((i: { name?: string }) => i.name || ""),
                url: nctId
                    ? `https://clinicaltrials.gov/study/${nctId}`
                    : "https://clinicaltrials.gov",
            }
        }
    )
}
