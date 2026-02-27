import { createClient } from "@supabase/supabase-js"

type UserMeta = {
  email?: string
  displayName?: string
}

let cached: Map<string, UserMeta> | null = null
let cachedAt = 0
const CACHE_TTL_MS = 60_000

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function listSupabaseUsersMap(): Promise<Map<string, UserMeta>> {
  const now = Date.now()
  if (cached && now - cachedAt < CACHE_TTL_MS) {
    return cached
  }

  const client = getAdminClient()
  if (!client) {
    return new Map()
  }

  const users = new Map<string, UserMeta>()
  let page = 1

  while (page <= 20) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error || !data?.users?.length) break

    for (const user of data.users) {
      const nameFromMeta =
        (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
        (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
        undefined

      users.set(user.id, {
        email: user.email || undefined,
        displayName: nameFromMeta,
      })
    }

    if (data.users.length < 200) break
    page += 1
  }

  cached = users
  cachedAt = now
  return users
}
