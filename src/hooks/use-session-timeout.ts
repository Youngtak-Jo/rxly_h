"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const IDLE_WARNING_MS = 15 * 60 * 1000 // 15 minutes
const IDLE_LOGOUT_MS = 16 * 60 * 1000 // 16 minutes

export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }, [])

  const startTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)

    warningTimer.current = setTimeout(() => {
      setShowWarning(true)
    }, IDLE_WARNING_MS)

    logoutTimer.current = setTimeout(() => {
      logout()
    }, IDLE_LOGOUT_MS)
  }, [logout])

  const resetTimers = useCallback(() => {
    setShowWarning(false)
    startTimers()
  }, [startTimers])

  const extendSession = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"]

    const handleActivity = () => {
      if (!showWarning) {
        resetTimers()
      }
    }

    events.forEach((event) => window.addEventListener(event, handleActivity))
    startTimers()

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      )
      if (warningTimer.current) clearTimeout(warningTimer.current)
      if (logoutTimer.current) clearTimeout(logoutTimer.current)
    }
  }, [resetTimers, startTimers, showWarning])

  return { showWarning, extendSession, logout }
}
