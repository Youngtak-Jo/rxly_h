"use client"

import { use } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ConsultationLayout } from "@/components/consultation/consultation-layout"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useSessionLoader } from "@/hooks/use-session-loader"
import { TourProvider } from "@/components/tour/tour-provider"
import { useSessionListLoader } from "@/hooks/use-session-list-loader"

export default function ConsultationSessionPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    useSessionListLoader()

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
