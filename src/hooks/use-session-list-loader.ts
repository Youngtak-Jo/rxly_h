"use client"

import { useEffect } from "react"
import type { Session } from "@/types/session"
import { useSessionStore } from "@/stores/session-store"

let inFlightSessionListRequest: Promise<Session[] | null> | null = null

async function fetchSessionList(): Promise<Session[] | null> {
  if (!inFlightSessionListRequest) {
    inFlightSessionListRequest = (async () => {
      const res = await fetch("/api/sessions")
      if (!res.ok) throw new Error("Failed to fetch session list")
      return (await res.json()) as Session[]
    })().finally(() => {
      inFlightSessionListRequest = null
    })
  }

  return inFlightSessionListRequest
}

export function useSessionListLoader() {
  const hasLoadedSessionList = useSessionStore((s) => s.hasLoadedSessionList)
  const setSessions = useSessionStore((s) => s.setSessions)
  const setLoading = useSessionStore((s) => s.setLoading)
  const setHasLoadedSessionList = useSessionStore((s) => s.setHasLoadedSessionList)

  useEffect(() => {
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
  }, [hasLoadedSessionList, setHasLoadedSessionList, setLoading, setSessions])
}
