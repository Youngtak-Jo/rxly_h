"use client"

import { useEffect, type CSSProperties, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { ConsultationAmbientShell } from "@/components/consultation/consultation-ambient-shell"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TourProvider } from "@/components/tour/tour-provider"
import { useSessionListLoader } from "@/hooks/use-session-list-loader"
import { useDocumentWorkspaceLoader } from "@/hooks/use-document-workspace"
import { useUser } from "@/hooks/use-user"

interface WorkspaceShellProps {
  header: ReactNode
  children: ReactNode
  withTourProvider?: boolean
  loadDocumentWorkspace?: boolean
}

export function WorkspaceShell({
  header,
  children,
  withTourProvider = false,
  loadDocumentWorkspace = true,
}: WorkspaceShellProps) {
  const router = useRouter()
  const { user, loading } = useUser()
  const isAuthenticated = !!user

  useSessionListLoader(!loading && isAuthenticated)
  useDocumentWorkspaceLoader(!loading && isAuthenticated && loadDocumentWorkspace)

  useEffect(() => {
    if (loading || isAuthenticated) return
    router.replace("/login")
  }, [isAuthenticated, loading, router])

  return (
    <SidebarProvider
      className="!h-svh"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset className="overflow-visible">
        <ConsultationAmbientShell>
          {header}
          {children}
        </ConsultationAmbientShell>
      </SidebarInset>
      {withTourProvider ? <TourProvider /> : null}
    </SidebarProvider>
  )
}
