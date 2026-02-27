type CacheEntry<T> = {
  value: T
  expiresAt: number
}

type AdminCacheState = {
  valueCache: Map<string, CacheEntry<unknown>>
  inFlight: Map<string, Promise<unknown>>
}

declare global {
  var __adminCacheState: AdminCacheState | undefined
}

function getCacheState(): AdminCacheState {
  if (!globalThis.__adminCacheState) {
    globalThis.__adminCacheState = {
      valueCache: new Map<string, CacheEntry<unknown>>(),
      inFlight: new Map<string, Promise<unknown>>(),
    }
  }
  return globalThis.__adminCacheState
}

export function clearAdminCache(prefix?: string) {
  const state = getCacheState()
  if (!prefix) {
    state.valueCache.clear()
    return
  }

  for (const key of state.valueCache.keys()) {
    if (key.startsWith(prefix)) {
      state.valueCache.delete(key)
    }
  }
}

export async function withAdminCache<T>(input: {
  key: string
  ttlMs: number
  skipCache?: boolean
  loader: () => Promise<T>
}): Promise<T> {
  const state = getCacheState()
  const now = Date.now()

  if (!input.skipCache) {
    const cached = state.valueCache.get(input.key)
    if (cached && cached.expiresAt > now) {
      return cached.value as T
    }

    const pending = state.inFlight.get(input.key)
    if (pending) {
      return pending as Promise<T>
    }
  }

  const loadPromise = input
    .loader()
    .then((value) => {
      state.valueCache.set(input.key, {
        value,
        expiresAt: Date.now() + input.ttlMs,
      })
      return value
    })
    .finally(() => {
      state.inFlight.delete(input.key)
    })

  state.inFlight.set(input.key, loadPromise)

  return loadPromise
}
