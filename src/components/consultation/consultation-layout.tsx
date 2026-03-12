"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { useTranslations } from "next-intl"
import type { PanelImperativeHandle } from "react-resizable-panels"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CenterPanel } from "./center-panel"
import { RightPanel } from "./right-panel"
import {
  SmartConsultationComposer,
  type SmartConsultationComposerHandle,
} from "./smart-consultation-composer"
import { ConsultationWorkspaceTabs } from "./consultation-workspace-tabs"
import { MobileTranscriptSection } from "./transcript/mobile-transcript-section"
import { useSessionStore } from "@/stores/session-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useCreateSession } from "@/hooks/use-create-session"
import { useInsightsAutoSave } from "@/hooks/use-insights-autosave"
import { useDdxAutoSave } from "@/hooks/use-ddx-autosave"
import { useLiveDdx } from "@/hooks/use-live-ddx"
import { useUnseenUpdateTracker } from "@/hooks/use-unseen-update-tracker"
import { useSpeakerIdentification } from "@/hooks/use-speaker-identification"
import { useSingleSpeakerClassification } from "@/hooks/use-single-speaker-classification"
import { useDiagnosticHighlights } from "@/hooks/use-diagnostic-highlights"
import { useMobileViewport } from "@/hooks/use-mobile"
import { useAiDoctorStt } from "@/hooks/use-ai-doctor-stt"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import { IconLoader2 } from "@tabler/icons-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useWorkspaceTabReconciliation } from "@/hooks/use-document-workspace"
import { getCoreCachedSession } from "@/hooks/use-session-loader"
import type { Session } from "@/types/session"

function ConsultationCenterSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
      <div className="shrink-0">
        <ConsultationWorkspaceTabs />
      </div>
      <div className="consultation-center-scroll flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(16rem,0.9fr)]">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TranscriptPanelSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-2xl" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-hidden p-4">
        <Skeleton className="h-[4.5rem] w-[78%] rounded-3xl" />
        <Skeleton className="ml-auto h-[5.5rem] w-[72%] rounded-3xl" />
        <Skeleton className="h-20 w-[84%] rounded-3xl" />
        <Skeleton className="ml-auto h-16 w-[58%] rounded-3xl" />
      </div>
    </div>
  )
}

function MobileTranscriptSkeleton() {
  return (
    <div className="shrink-0 border-b bg-background px-4 py-4">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-2xl" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
        <Skeleton className="h-20 w-[84%] rounded-3xl" />
        <Skeleton className="ml-auto h-[4.5rem] w-[68%] rounded-3xl" />
      </div>
    </div>
  )
}

function ConsultationComposerSkeleton() {
  return (
    <div className="pointer-events-none px-3 py-3 sm:px-4">
      <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-border/70 bg-background shadow-sm">
        <div className="space-y-3 p-3 sm:p-4">
          <Skeleton className="h-[72px] w-full rounded-3xl" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface ConsultationLayoutProps {
  requestedSessionId?: string | null
  initialSession?: Session | null
  isRequestedSessionPending?: boolean
}

export function ConsultationLayout({
  requestedSessionId = null,
  initialSession = null,
  isRequestedSessionPending = false,
}: ConsultationLayoutProps) {
  const t = useTranslations("ConsultationLayout")
  const activeSession = useSessionStore((s) => s.activeSession)
  const hydratingSessionId = useSessionStore((s) => s.hydratingSessionId)
  const isActiveSessionLoading = useSessionStore((s) => s.isActiveSessionLoading)
  const isSwitching = useSessionStore((s) => s.isSwitching)
  const { createSession } = useCreateSession()
  const activeTab = useConsultationTabStore((s) => s.activeTab)
  const setTranscriptCollapsed = useConsultationTabStore(
    (s) => s.setTranscriptCollapsed
  )
  const setToggleTranscript = useConsultationTabStore((s) => s.setToggleTranscript)
  const rightPanelRef = useRef<PanelImperativeHandle | null>(null)
  const composerRef = useRef<SmartConsultationComposerHandle | null>(null)
  const composerMeasureRef = useRef<HTMLDivElement | null>(null)
  const lastWorkspaceOpenRef = useRef<string | null>(null)
  const [composerHeight, setComposerHeight] = useState(0)
  const { isMobile, isReady: isMobileReady } = useMobileViewport()
  const hasRequestedSessionCoreLoaded =
    !!requestedSessionId &&
    (hydratingSessionId === requestedSessionId ||
      !!getCoreCachedSession(requestedSessionId))
  const shouldShowRequestedSessionSkeleton =
    !!requestedSessionId &&
    !!initialSession &&
    isRequestedSessionPending &&
    !hasRequestedSessionCoreLoaded &&
    !isSwitching
  const shouldShowRequestedSessionLoading =
    !!requestedSessionId &&
    !initialSession &&
    !activeSession &&
    isRequestedSessionPending &&
    !isSwitching
  const shouldBypassMobileReadyGate =
    !!requestedSessionId &&
    (!!initialSession || activeSession?.id === requestedSessionId)

  useInsightsAutoSave()
  useDdxAutoSave()
  useLiveDdx()
  useUnseenUpdateTracker()
  useWorkspaceTabReconciliation()

  // These hooks were in RightPanel but need to run on mobile too
  useSpeakerIdentification()
  useSingleSpeakerClassification()
  useDiagnosticHighlights()

  // AI Doctor STT hook — manages voice input WebSocket lifecycle
  useAiDoctorStt()

  useEffect(() => {
    if (!activeSession) {
      lastWorkspaceOpenRef.current = null
      return
    }

    const key = `${activeSession.id}:${activeTab}`
    if (lastWorkspaceOpenRef.current === key) return

    trackClientEvent({
      eventType: "workspace_opened",
      feature: activeTab,
      sessionId: activeSession.id,
      metadata: {
        source: "consultation_layout",
      },
    })

    lastWorkspaceOpenRef.current = key
  }, [activeSession, activeTab])

  const toggleRightPanel = useCallback(() => {
    const panel = rightPanelRef.current
    if (!panel) return
    if (panel.isCollapsed()) {
      panel.expand()
    } else {
      panel.collapse()
    }
  }, [])

  const handleAddFilesFromTranscript = useCallback((files: FileList) => {
    composerRef.current?.addFiles(files)
  }, [])

  useLayoutEffect(() => {
    const node = composerMeasureRef.current
    if (!node) return

    const updateHeight = (nextHeight: number) => {
      const roundedHeight = Math.ceil(nextHeight)
      setComposerHeight((currentHeight) =>
        currentHeight === roundedHeight ? currentHeight : roundedHeight
      )
    }

    updateHeight(node.getBoundingClientRect().height)

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      updateHeight(entry.contentRect.height)
    })

    resizeObserver.observe(node)

    return () => {
      resizeObserver.disconnect()
    }
  }, [activeSession, isMobile, shouldShowRequestedSessionSkeleton])

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

  // Initial loading (no session yet)
  if ((isActiveSessionLoading || shouldShowRequestedSessionLoading) && !activeSession) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      </div>
    )
  }

  if (!activeSession && !shouldShowRequestedSessionSkeleton && !isSwitching) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl">
          <Image src="/icon1.png" alt="Rxly logo" width={64} height={64} className="rounded-2xl" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t("noActiveTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("noActiveDescription")}
          </p>
        </div>
        <Button onClick={createSession} size="lg">
          {t("startNew")}
        </Button>
      </div>
    )
  }

  // Keep a neutral state until mobile breakpoint is resolved to avoid
  // a desktop-to-mobile layout jump on first paint.
  if ((activeSession || shouldShowRequestedSessionSkeleton) && !isMobileReady && !shouldBypassMobileReadyGate) {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-3">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("preparing")}</p>
      </div>
    )
  }

  const centerPanelStageStyle = {
    "--consultation-center-composer-height": `${composerHeight}px`,
    "--background": "#ffffff",
  } as CSSProperties

  const centerPanelStage = (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#ffffff]"
      style={centerPanelStageStyle}
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        {shouldShowRequestedSessionSkeleton ? <ConsultationCenterSkeleton /> : <CenterPanel />}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none">
        <div className="pb-[env(safe-area-inset-bottom)]">
          <div ref={composerMeasureRef}>
            {shouldShowRequestedSessionSkeleton ? (
              <ConsultationComposerSkeleton />
            ) : (
              <SmartConsultationComposer ref={composerRef} />
            )}
          </div>
        </div>
      </div>
    </div>
  )

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
          {activeTab !== "research" &&
            (shouldShowRequestedSessionSkeleton ? (
              <MobileTranscriptSkeleton />
            ) : (
              <MobileTranscriptSection />
            ))}
          {centerPanelStage}
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
            <div className="flex h-full min-h-0 flex-col">
              {centerPanelStage}
            </div>
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className="bg-border/70 [&>div]:border-border/70 [&>div]:bg-background/90 [&>div]:shadow-sm"
          />
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
            {shouldShowRequestedSessionSkeleton ? (
              <TranscriptPanelSkeleton />
            ) : (
              <RightPanel onAddFiles={handleAddFilesFromTranscript} />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
