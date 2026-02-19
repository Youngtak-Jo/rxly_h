"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { PanelImperativeHandle } from "react-resizable-panels"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { CenterPanel } from "./center-panel"
import { RightPanel } from "./right-panel"
import { NoteInputBar } from "./note-input/note-input-bar"
import { MobileTranscriptSection } from "./transcript/mobile-transcript-section"
import { useSessionStore } from "@/stores/session-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useRecordAutoSave } from "@/hooks/use-record-autosave"
import { useInsightsAutoSave } from "@/hooks/use-insights-autosave"
import { useDdxAutoSave } from "@/hooks/use-ddx-autosave"
import { usePatientHandoutAutoSave } from "@/hooks/use-patient-handout-autosave"
import { useLiveDdx } from "@/hooks/use-live-ddx"
import { useLiveRecord } from "@/hooks/use-live-record"
import { useLivePatientHandout } from "@/hooks/use-live-patient-handout"
import { useUnseenUpdateTracker } from "@/hooks/use-unseen-update-tracker"
import { useSpeakerIdentification } from "@/hooks/use-speaker-identification"
import { useSingleSpeakerClassification } from "@/hooks/use-single-speaker-classification"
import { useDiagnosticHighlights } from "@/hooks/use-diagnostic-highlights"
import { useMobileViewport } from "@/hooks/use-mobile"
import { useAiDoctorStt } from "@/hooks/use-ai-doctor-stt"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { IconLoader2 } from "@tabler/icons-react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"
import { cn } from "@/lib/utils"

export function ConsultationLayout() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const isLoading = useSessionStore((s) => s.isLoading)
  const isSwitching = useSessionStore((s) => s.isSwitching)
  const { addSession, setActiveSession } = useSessionStore()
  const router = useRouter()
  const activeTab = useConsultationTabStore((s) => s.activeTab)
  const setTranscriptCollapsed = useConsultationTabStore(
    (s) => s.setTranscriptCollapsed
  )
  const setToggleTranscript = useConsultationTabStore((s) => s.setToggleTranscript)
  const rightPanelRef = useRef<PanelImperativeHandle | null>(null)
  const { isMobile, isReady: isMobileReady } = useMobileViewport()

  useRecordAutoSave()
  useInsightsAutoSave()
  useDdxAutoSave()
  usePatientHandoutAutoSave()
  useLiveDdx()
  useLiveRecord()
  useLivePatientHandout()
  useUnseenUpdateTracker()

  // These hooks were in RightPanel but need to run on mobile too
  useSpeakerIdentification()
  useSingleSpeakerClassification()
  useDiagnosticHighlights()

  // AI Doctor STT hook — manages voice input WebSocket lifecycle
  useAiDoctorStt()

  const toggleRightPanel = useCallback(() => {
    const panel = rightPanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }, [])

  // Register toggle function in store so SiteHeader can call it (desktop only)
  useEffect(() => {
    if (!isMobileReady) {
      setToggleTranscript(null)
      return
    }
    if (!isMobile) {
      setToggleTranscript(toggleRightPanel)
      return () => setToggleTranscript(null)
    } else {
      setToggleTranscript(null)
    }
  }, [toggleRightPanel, setToggleTranscript, isMobile, isMobileReady])

  const createSession = async () => {
    const tempId = uuidv4()
    const now = new Date().toISOString()
    const optimisticSession = {
      id: tempId,
      title: "New Consultation",
      patientName: null,
      mode: "DOCTOR" as const,
      startedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    // Reset AI doctor mode for new session
    useConsultationModeStore.getState().reset()

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
      router.push(`/consultation/${realSession.id}`)
    } catch (error) {
      console.error("Failed to create session:", error)
      const store = useSessionStore.getState()
      store.setSessions(store.sessions.filter((s) => s.id !== tempId))
      if (store.activeSession?.id === tempId) {
        store.setActiveSession(null)
      }
    }
  }

  // Initial loading (no session yet)
  if (isLoading && !activeSession) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading consultation...</p>
      </div>
    )
  }

  if (!activeSession && !isSwitching) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl">
          <Image src="/icon1.png" alt="Rxly logo" width={64} height={64} className="rounded-2xl" />
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

  // Keep a neutral state until mobile breakpoint is resolved to avoid
  // a desktop-to-mobile layout jump on first paint.
  if (activeSession && !isMobileReady) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Preparing consultation...</p>
      </div>
    )
  }

  // Mobile layout: vertical stack
  if (isMobile) {
    return (
      <div className="relative flex-1 min-h-0 min-w-0 flex flex-col">
        {isSwitching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 transition-opacity duration-150">
            <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <div className={cn(
          "flex flex-col flex-1 min-h-0 transition-opacity duration-200",
          isSwitching ? "opacity-40 pointer-events-none" : "opacity-100"
        )}>
          {activeTab !== "research" && <MobileTranscriptSection />}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CenterPanel />
          </div>
          {activeTab !== "research" && (
            <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">
              <NoteInputBar />
            </div>
          )}
        </div>
      </div>
    )
  }

  // Desktop layout: resizable panels
  return (
    <div className="relative flex-1 min-h-0 min-w-0">
      {isSwitching && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 transition-opacity duration-150">
          <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-200",
        isSwitching ? "opacity-40 pointer-events-none" : "opacity-100"
      )}>
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
