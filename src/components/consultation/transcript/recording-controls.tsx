"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import {
  ConsultationTopRail,
  ConsultationTopRailAction,
} from "@/components/consultation/consultation-top-chrome"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useSessionStore } from "@/stores/session-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { trackClientEvent } from "@/lib/telemetry/client-events"

export function RecordingControls() {
  const t = useTranslations("TranscriptViewer")
  const tHeader = useTranslations("SiteHeader")
  const { isRecording, isPaused, duration, setDuration, isSimulating } =
    useRecordingStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const mode = useConsultationModeStore((s) => s.mode)
  const toggleTranscript = useConsultationTabStore((s) => s._toggleTranscript)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prevRecordingRef = useRef(isRecording)

  const isAiDoctorMode = mode === "ai-doctor"

  // Duration timer — only for live recording mode.
  // Simulation manages its own duration timer in the hook.
  useEffect(() => {
    if (isSimulating) return

    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration(duration + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRecording, isPaused, duration, setDuration, isSimulating])

  useEffect(() => {
    if (!activeSession) {
      prevRecordingRef.current = isRecording
      return
    }

    if (!prevRecordingRef.current && isRecording) {
      trackClientEvent({
        eventType: "recording_started",
        feature: isAiDoctorMode ? "ai_doctor" : "transcript",
        sessionId: activeSession.id,
      })
    } else if (prevRecordingRef.current && !isRecording) {
      trackClientEvent({
        eventType: "recording_stopped",
        feature: isAiDoctorMode ? "ai_doctor" : "transcript",
        sessionId: activeSession.id,
      })
    }

    prevRecordingRef.current = isRecording
  }, [activeSession, isAiDoctorMode, isRecording])

  const headerLabel = isAiDoctorMode
    ? t("headerAiConsultation")
    : t("headerTranscript")
  const showTimer = !isAiDoctorMode && isRecording

  return (
    <ConsultationTopRail className="justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3.5">
        <h3 className="truncate text-sm font-medium">{headerLabel}</h3>
        {isRecording && (
          <Badge
            variant="secondary"
            className="shrink-0 gap-1 rounded-sm border border-border/60 bg-background/80 text-[10px] font-mono text-foreground shadow-none"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            {isAiDoctorMode
              ? t("status.active")
              : isPaused
                ? t("status.paused")
                : t("status.live")}
          </Badge>
        )}
      </div>
      {(showTimer || toggleTranscript) && (
        <div className="flex items-stretch">
          {showTimer && (
            <span className="flex h-full items-center border-l border-border/70 px-3.5 font-mono text-xs text-muted-foreground">
              {Math.floor(duration / 60)
                .toString()
                .padStart(2, "0")}
              :
              {(duration % 60).toString().padStart(2, "0")}
            </span>
          )}
          {toggleTranscript && (
            <ConsultationTopRailAction
              aria-label={tHeader("hideTranscript")}
              title={tHeader("hideTranscript")}
              className="px-3 text-xs"
              onClick={toggleTranscript}
            >
              {t("hideShort")}
            </ConsultationTopRailAction>
          )}
        </div>
      )}
    </ConsultationTopRail>
  )
}
