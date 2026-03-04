"use client"

import { SiteHeader } from "@/components/site-header"
import { ConsultationLayout } from "@/components/consultation/consultation-layout"
import { WorkspaceShell } from "@/components/workspace/workspace-shell"

export default function ConsultationPage() {
  return (
    <WorkspaceShell header={<SiteHeader />} withTourProvider>
      <ConsultationLayout />
    </WorkspaceShell>
  )
}
