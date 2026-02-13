let cachedToken: string | null = null
let tokenExpiresAt: number = 0

async function getIcd11Token(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  const clientId = process.env.ICD11_CLIENT_ID
  const clientSecret = process.env.ICD11_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("ICD-11 API credentials not configured")
  }

  const res = await fetch(
    "https://icdaccessmanagement.who.int/connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "icdapi_access",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`ICD-11 token request failed: ${res.status}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000
  return cachedToken!
}

export interface Icd11SearchResult {
  theCode: string
  title: string
  uri: string
  browserUrl: string
  score: number
}

export interface Icd11EntityDetails {
  description: string
  parents: { code: string; title: string }[]
  browserUrl: string
}

export async function getIcd11EntityDetails(
  icdCode: string
): Promise<Icd11EntityDetails | null> {
  try {
    const token = await getIcd11Token()

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Accept-Language": "en",
      "API-Version": "v2",
    }

    // Normalize code: remove dots for lookup (e.g. "BA00.0" → "BA00.0" kept as-is, API handles both)
    const cleanCode = icdCode.trim()

    // Try direct MMS code lookup first (fastest, most reliable)
    const codeUrl = `https://id.who.int/icd/release/11/2024-01/mms/codeInfo/${encodeURIComponent(cleanCode)}`
    const codeRes = await fetch(codeUrl, { headers })

    let stemId = ""
    if (codeRes.ok) {
      const codeData = await codeRes.json()
      // stemId is the MMS URI for this code
      stemId = codeData.stemId || ""
    }

    // If code lookup failed, fall back to search
    if (!stemId) {
      const searchUrl = new URL(
        "https://id.who.int/icd/release/11/2024-01/mms/search"
      )
      searchUrl.searchParams.set("q", cleanCode)
      searchUrl.searchParams.set("flatResults", "true")
      searchUrl.searchParams.set("useFlexisearch", "true")

      const searchRes = await fetch(searchUrl.toString(), { headers })
      if (!searchRes.ok) {
        console.error(`ICD-11 search failed for "${cleanCode}": ${searchRes.status}`)
        return null
      }

      const searchData = await searchRes.json()
      const entity = (searchData.destinationEntities || [])[0]
      stemId = entity?.id || ""
    }

    if (!stemId) {
      console.error(`ICD-11 entity not found for code "${cleanCode}"`)
      return null
    }

    // Fetch full entity details from the MMS URI
    // WHO API returns http:// URIs but requires https:// for authenticated requests
    const entityUrl = stemId.replace(/^http:\/\//, "https://")
    const entityRes = await fetch(entityUrl, { headers })
    if (!entityRes.ok) {
      console.error(`ICD-11 entity fetch failed for ${stemId}: ${entityRes.status}`)
      return null
    }

    const entityData = await entityRes.json()

    const entityId = stemId.split("/").pop() || ""
    const description =
      entityData.definition?.["@value"] ||
      entityData.longDefinition?.["@value"] ||
      entityData.description?.["@value"] ||
      ""

    // Extract parent info from the entity data
    const parents: { code: string; title: string }[] = []
    if (entityData.parent && Array.isArray(entityData.parent)) {
      // Fetch only the first parent to keep response fast
      try {
        const parentUrl = entityData.parent[0].replace(/^http:\/\//, "https://")
        const parentRes = await fetch(parentUrl, { headers })
        if (parentRes.ok) {
          const parentData = await parentRes.json()
          parents.push({
            code: parentData.codeRange || parentData.code || "",
            title:
              parentData.title?.["@value"] ||
              (typeof parentData.title === "string" ? parentData.title : ""),
          })
        }
      } catch {
        // skip failed parent fetch
      }
    }

    return {
      description,
      parents,
      browserUrl: entityId
        ? `https://icd.who.int/browse/2024-01/mms/en#${entityId}`
        : "",
    }
  } catch (error) {
    console.error("ICD-11 entity details error:", error)
    return null
  }
}

export async function searchIcd11(
  query: string,
  maxResults = 8
): Promise<Icd11SearchResult[]> {
  const token = await getIcd11Token()

  const url = new URL(
    "https://id.who.int/icd/release/11/2024-01/mms/search"
  )
  url.searchParams.set("q", query)
  url.searchParams.set("subtreeFilterUsesFoundationDescendants", "false")
  url.searchParams.set("includeKeywordResult", "false")
  url.searchParams.set("useFlexisearch", "true")
  url.searchParams.set("flatResults", "true")

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Accept-Language": "en",
      "API-Version": "v2",
    },
  })

  if (!res.ok) {
    throw new Error(`ICD-11 search failed: ${res.status}`)
  }

  const data = await res.json()
  const entities = data.destinationEntities || []

  return entities.slice(0, maxResults).map(
    (entity: {
      theCode?: string
      title?: string
      id?: string
      score?: number
    }) => {
      const entityUri = entity.id || ""
      const entityId = entityUri.split("/").pop() || ""
      return {
        theCode: entity.theCode || "",
        title: (entity.title || "").replace(/<[^>]*>/g, ""),
        uri: entityUri,
        browserUrl: entityId
          ? `https://icd.who.int/browse/2024-01/mms/en#${entityId}`
          : "",
        score: entity.score || 0,
      }
    }
  )
}
