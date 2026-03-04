"use client"

import { use } from "react"
import { SiteHeader } from "@/components/site-header"
import { ConsultationLayout } from "@/components/consultation/consultation-layout"
import { useSessionLoader } from "@/hooks/use-session-loader"
import { WorkspaceShell } from "@/components/workspace/workspace-shell"

export default function ConsultationSessionPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)

    // Auto-load the session from URL param
    useSessionLoader(id)

    return (
        <WorkspaceShell header={<SiteHeader />} withTourProvider>
            <ConsultationLayout />
        </WorkspaceShell>
    )
}
