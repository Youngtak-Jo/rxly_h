"use client"

import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { CenterPanel } from "@/components/consultation/center-panel"
import { RightPanel } from "@/components/consultation/right-panel"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useSessionStore } from "@/stores/session-store"
import { IconStethoscope } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export default function ConsultationPage() {
  const { setSessions, setLoading } = useSessionStore()

  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true)
      try {
        const res = await fetch("/api/sessions")
        if (res.ok) {
          const sessions = await res.json()
          setSessions(sessions)
        }
      } catch (error) {
        console.error("Failed to load sessions:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [setSessions, setLoading])

  return (
    <SidebarProvider
      className="!h-svh"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-hidden">
        <SiteHeader />
        <ConsultationContent />
      </SidebarInset>
    </SidebarProvider>
  )
}

function ConsultationContent() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const { addSession, setActiveSession } = useSessionStore()

  const createSession = async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Consultation" }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const session = await res.json()
      addSession(session)
      setActiveSession(session)
    } catch (error) {
      console.error("Failed to create session:", error)
    }
  }

  if (!activeSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <IconStethoscope className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">No Active Consultation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create a new session to start recording and analyzing a
            consultation.
          </p>
        </div>
        <Button onClick={createSession} size="lg">
          Start New Consultation
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-1 min-h-0">
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <CenterPanel />
      </div>
      <div className="w-[420px] shrink-0 flex flex-col overflow-hidden">
        <RightPanel />
      </div>
    </div>
  )
}
