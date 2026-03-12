"use client"

import { SiteHeader } from "@/components/site-header"
import { ConsultationLayout } from "@/components/consultation/consultation-layout"
import { WorkspaceShell } from "@/components/workspace/workspace-shell"
import { useSessionLoader } from "@/hooks/use-session-loader"
import type { Session } from "@/types/session"

interface ConsultationSessionClientProps {
  sessionId: string
  initialSession: Session | null
}

export function ConsultationSessionClient({
  sessionId,
  initialSession,
}: ConsultationSessionClientProps) {
  const { hasResolvedInitialLoad } = useSessionLoader(sessionId, {
    seedSession: initialSession,
  })

  return (
    <WorkspaceShell
      header={<SiteHeader initialSessionTitle={initialSession?.title ?? null} />}
      withTourProvider
    >
      <ConsultationLayout
        requestedSessionId={sessionId}
        initialSession={initialSession}
        isRequestedSessionPending={!hasResolvedInitialLoad}
      />
    </WorkspaceShell>
  )
}
