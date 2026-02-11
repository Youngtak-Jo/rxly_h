"use client"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { CenterPanel } from "./center-panel"
import { RightPanel } from "./right-panel"
import { useSessionStore } from "@/stores/session-store"
import { IconStethoscope } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function ConsultationLayout() {
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
            Create a new session to start recording and analyzing a consultation.
          </p>
        </div>
        <Button onClick={createSession} size="lg">
          Start New Consultation
        </Button>
      </div>
    )
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="flex-1">
      <ResizablePanel defaultSize={65} minSize={40}>
        <CenterPanel />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
        <RightPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
