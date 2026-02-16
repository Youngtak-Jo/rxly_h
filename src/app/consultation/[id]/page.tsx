"use client"

import { use } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ConsultationLayout } from "@/components/consultation/consultation-layout"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useSessionStore } from "@/stores/session-store"
import { useSessionLoader } from "@/hooks/use-session-loader"
import { TourProvider } from "@/components/tour/tour-provider"
import { useEffect } from "react"

export default function ConsultationSessionPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const { setSessions, setLoading } = useSessionStore()

    // Load session list on mount
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

    // Auto-load the session from URL param
    useSessionLoader(id)

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
