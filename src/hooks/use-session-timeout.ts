"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const IDLE_WARNING_MS = 15 * 60 * 1000 // 15 minutes
const IDLE_LOGOUT_MS = 16 * 60 * 1000 // 16 minutes

export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false)
  const showWarningRef = useRef(false)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setWarning = useCallback((value: boolean) => {
    showWarningRef.current = value
    setShowWarning(value)
  }, [])

  const logout = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }, [])

  const startTimers = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)

    warningTimer.current = setTimeout(() => {
      setWarning(true)
    }, IDLE_WARNING_MS)

    logoutTimer.current = setTimeout(() => {
      logout()
    }, IDLE_LOGOUT_MS)
  }, [logout, setWarning])

  const resetTimers = useCallback(() => {
    setWarning(false)
    startTimers()
  }, [setWarning, startTimers])

  const extendSession = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  const dismissWarning = useCallback(() => {
    setWarning(false)
  }, [setWarning])

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"]

    const handleActivity = () => {
      if (!showWarningRef.current) {
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
  }, [resetTimers, startTimers])

  return { showWarning, extendSession, dismissWarning, logout }
}
