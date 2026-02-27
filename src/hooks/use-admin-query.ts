"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type CacheEntry<T> = {
  data: T
  expiresAt: number
}

const responseCache = new Map<string, CacheEntry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const data = (await res.json().catch(() => null)) as
    | { error?: string }
    | null
  return data?.error || fallback
}

export interface AdminFetchOptions {
  cacheKey: string
  url: string
  ttlMs?: number
  force?: boolean
  forceServerRefresh?: boolean
  signal?: AbortSignal
}

export async function adminFetchJson<T>(options: AdminFetchOptions): Promise<T> {
  const ttlMs = options.ttlMs ?? 45_000
  const now = Date.now()
  const canDedupeInFlight = !options.signal

  if (!options.force) {
    const cached = responseCache.get(options.cacheKey)
    if (cached && cached.expiresAt > now) {
      return cached.data as T
    }

    if (canDedupeInFlight) {
      const pending = inFlight.get(options.cacheKey)
      if (pending) {
        return pending as Promise<T>
      }
    }
  }

  const requestPromise = fetch(options.url, {
    cache: "no-store",
    signal: options.signal,
    headers: options.forceServerRefresh
      ? { "x-admin-refresh": "1" }
      : undefined,
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Failed to load admin data"))
      }
      return (await res.json()) as T
    })
    .then((data) => {
      responseCache.set(options.cacheKey, {
        data,
        expiresAt: Date.now() + ttlMs,
      })
      return data
    })
    .finally(() => {
      inFlight.delete(options.cacheKey)
    })

  if (canDedupeInFlight) {
    inFlight.set(options.cacheKey, requestPromise)
  }
  return requestPromise
}

export function invalidateAdminCache(prefix?: string) {
  if (!prefix) {
    responseCache.clear()
    return
  }

  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key)
    }
  }
}

type UseAdminQueryInput = {
  cacheKey: string
  url: string
  enabled?: boolean
  ttlMs?: number
  refreshToken?: number
}

type UseAdminQueryResult<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
  isRefreshing: boolean
  reload: () => Promise<void>
}

export function useAdminQuery<T>(input: UseAdminQueryInput): UseAdminQueryResult<T> {
  const {
    cacheKey,
    url,
    enabled = true,
    ttlMs = 45_000,
    refreshToken = 0,
  } = input

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const latestRefreshToken = useRef(refreshToken)
  const controllerRef = useRef<AbortController | null>(null)

  const load = useCallback(
    async (force = false) => {
      if (!enabled) return

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      setError(null)
      setIsLoading(true)
      if (force) {
        setIsRefreshing(true)
      }

      try {
        const next = await adminFetchJson<T>({
          cacheKey,
          url,
          ttlMs,
          force,
          forceServerRefresh: force,
          signal: controller.signal,
        })
        setData(next)
      } catch (cause) {
        if (cause instanceof Error && cause.name === "AbortError") {
          return
        }
        setError(
          cause instanceof Error ? cause.message : "Failed to load admin data"
        )
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null
        }
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [cacheKey, enabled, ttlMs, url]
  )

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    const hasRefreshChanged = latestRefreshToken.current !== refreshToken
    latestRefreshToken.current = refreshToken
    void load(hasRefreshChanged && refreshToken > 0)

    return () => {
      controllerRef.current?.abort()
    }
  }, [enabled, load, refreshToken])

  const reload = useCallback(async () => {
    await load(true)
  }, [load])

  return useMemo(
    () => ({
      data,
      error,
      isLoading,
      isRefreshing,
      reload,
    }),
    [data, error, isLoading, isRefreshing, reload]
  )
}
