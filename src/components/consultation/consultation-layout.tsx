"use client"

import { useCallback, useEffect, useRef } from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { CenterPanel } from "./center-panel"
import { RightPanel } from "./right-panel"
import { useSessionStore } from "@/stores/session-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useRecordAutoSave } from "@/hooks/use-record-autosave"
import { useInsightsAutoSave } from "@/hooks/use-insights-autosave"
import { useDdxAutoSave } from "@/hooks/use-ddx-autosave"
import { useLiveDdx } from "@/hooks/use-live-ddx"
import { useLiveRecord } from "@/hooks/use-live-record"
import { useUnseenUpdateTracker } from "@/hooks/use-unseen-update-tracker"
import { IconStethoscope, IconLoader2 } from "@tabler/icons-react"
import { v4 as uuidv4 } from "uuid"

export function ConsultationLayout() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const isLoading = useSessionStore((s) => s.isLoading)
  const { addSession, setActiveSession } = useSessionStore()
  const { setTranscriptCollapsed, setToggleTranscript } =
    useConsultationTabStore()
  const rightPanelRef = useRef<PanelImperativeHandle | null>(null)

  useRecordAutoSave()
  useInsightsAutoSave()
  useDdxAutoSave()
  useLiveDdx()
  useLiveRecord()
  useUnseenUpdateTracker()

  const toggleRightPanel = useCallback(() => {
    const panel = rightPanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }, [])

  // Register toggle function in store so SiteHeader can call it
  useEffect(() => {
    setToggleTranscript(toggleRightPanel)
    return () => setToggleTranscript(null)
  }, [toggleRightPanel, setToggleTranscript])

  const createSession = async () => {
    const tempId = uuidv4()
    const now = new Date().toISOString()
    const optimisticSession = {
      id: tempId,
      title: "New Consultation",
      patientName: null,
      startedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    addSession(optimisticSession)
    setActiveSession(optimisticSession)

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Consultation" }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const realSession = await res.json()

      const store = useSessionStore.getState()
      store.setSessions(
        store.sessions.map((s) => (s.id === tempId ? realSession : s))
      )
      if (store.activeSession?.id === tempId) {
        store.setActiveSession(realSession)
      }
    } catch (error) {
      console.error("Failed to create session:", error)
      const store = useSessionStore.getState()
      store.setSessions(store.sessions.filter((s) => s.id !== tempId))
      if (store.activeSession?.id === tempId) {
        store.setActiveSession(null)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading consultation...</p>
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 p-8 text-center">
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
    <div className="relative flex-1 min-h-0 min-w-0">
      <div className="absolute inset-0">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel defaultSize="55" minSize="30">
            <CenterPanel />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel
            panelRef={rightPanelRef}
            defaultSize="45"
            minSize="25"
            maxSize="70"
            collapsible
            collapsedSize="0"
            onResize={(size) => {
              setTranscriptCollapsed(size.asPercentage === 0)
            }}
          >
            <RightPanel />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
