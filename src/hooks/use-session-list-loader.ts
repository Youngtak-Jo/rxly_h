"use client"

import { useEffect } from "react"
import type { Session } from "@/types/session"
import { useSessionStore } from "@/stores/session-store"

let inFlightSessionListRequest: Promise<Session[] | null> | null = null

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string }
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error
    }
  } catch {
    // Ignore malformed error bodies and fall back to the provided message.
  }

  return `${fallback} (${response.status})`
}

async function fetchSessionList(): Promise<Session[] | null> {
  if (!inFlightSessionListRequest) {
    inFlightSessionListRequest = (async () => {
      const res = await fetch("/api/sessions")
      if (!res.ok) {
        throw new Error(await readErrorMessage(res, "Failed to fetch session list"))
      }
      return (await res.json()) as Session[]
    })().finally(() => {
      inFlightSessionListRequest = null
    })
  }

  return inFlightSessionListRequest
}

export function useSessionListLoader(enabled = true) {
  const hasLoadedSessionList = useSessionStore((s) => s.hasLoadedSessionList)
  const setSessions = useSessionStore((s) => s.setSessions)
  const setLoading = useSessionStore((s) => s.setLoading)
  const setHasLoadedSessionList = useSessionStore((s) => s.setHasLoadedSessionList)

  useEffect(() => {
    if (!enabled) return
    if (hasLoadedSessionList) return

    const loadSessions = async () => {
      setLoading(true)
      try {
        const sessions = await fetchSessionList()
        if (sessions) {
          setSessions(sessions)
          setHasLoadedSessionList(true)
        }
      } catch (error) {
        console.error("Failed to load sessions:", error)
      } finally {
        setLoading(false)
      }
    }

    void loadSessions()
  }, [enabled, hasLoadedSessionList, setHasLoadedSessionList, setLoading, setSessions])
}
