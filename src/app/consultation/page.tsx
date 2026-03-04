"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ConsultationAmbientShell } from "@/components/consultation/consultation-ambient-shell"
import { SiteHeader } from "@/components/site-header"
import { ConsultationLayout } from "@/components/consultation/consultation-layout"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TourProvider } from "@/components/tour/tour-provider"
import { useSessionListLoader } from "@/hooks/use-session-list-loader"

export default function ConsultationPage() {
  useSessionListLoader()

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
      <SidebarInset className="overflow-visible">
        <ConsultationAmbientShell>
          <SiteHeader />
          <ConsultationLayout />
        </ConsultationAmbientShell>
      </SidebarInset>
      <TourProvider />
    </SidebarProvider>
  )
}
