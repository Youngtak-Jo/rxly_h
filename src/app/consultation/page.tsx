"use client"

import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ConsultationLayout } from "@/components/consultation/consultation-layout"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useSessionStore } from "@/stores/session-store"
import { TourProvider } from "@/components/tour/tour-provider"

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
        <ConsultationLayout />
      </SidebarInset>
      <TourProvider />
    </SidebarProvider>
  )
}
