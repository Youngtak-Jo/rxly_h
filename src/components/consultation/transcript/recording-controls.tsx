"use client"

import { useCallback, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRecordingStore } from "@/stores/recording-store"
import { useSessionStore } from "@/stores/session-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useDeepgram } from "@/hooks/use-deepgram"
import { useAiDoctor } from "@/hooks/use-ai-doctor"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react"

export function RecordingControls() {
  const t = useTranslations("TranscriptViewer")
  const { isRecording, isPaused, duration, setDuration, isSimulating, simulationControls } =
    useRecordingStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const isSwitching = useSessionStore((s) => s.isSwitching)
  const hydratingSessionId = useSessionStore((s) => s.hydratingSessionId)
  const { startListening, stopListening, pauseListening, resumeListening } =
    useDeepgram()
  const { endConsultation } = useAiDoctor()
  const mode = useConsultationModeStore((s) => s.mode)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const prevRecordingRef = useRef(isRecording)

  const isAiDoctorMode = mode === "ai-doctor"
  const isTranscriptHydrating =
    !!activeSession && hydratingSessionId === activeSession.id
  const isStartDisabled = !activeSession || isSwitching || isTranscriptHydrating

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

  const handleStart = useCallback(async () => {
    if (!activeSession || isSwitching || isTranscriptHydrating) return
    await startListening()
  }, [
    activeSession,
    isSwitching,
    isTranscriptHydrating,
    startListening,
  ])

  const handleStop = useCallback(() => {
    if (isAiDoctorMode) {
      void endConsultation()
    } else if (isSimulating && simulationControls) {
      simulationControls.stop()
    } else {
      stopListening()
    }
  }, [isAiDoctorMode, endConsultation, isSimulating, simulationControls, stopListening])

  const handlePauseResume = useCallback(() => {
    if (isSimulating && simulationControls) {
      if (isPaused) {
        simulationControls.resume()
      } else {
        simulationControls.pause()
      }
    } else {
      if (isPaused) {
        resumeListening()
      } else {
        pauseListening()
      }
    }
  }, [isPaused, isSimulating, simulationControls, pauseListening, resumeListening])

  const headerLabel = isAiDoctorMode
    ? t("headerAiConsultation")
    : t("headerTranscript")

  return (
    <div className="flex items-center gap-2 border-b px-4 py-3">
      <div className="flex items-center gap-2 flex-1">
        <h3 className="text-sm font-medium">{headerLabel}</h3>
        {isRecording && (
          <Badge variant="secondary" className="text-[10px] font-mono gap-1">
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
      <div className="flex items-center gap-1">
        {!isRecording ? (
          !isAiDoctorMode ? (
            <Button
              onClick={handleStart}
              size="sm"
              className="gap-1.5 h-8"
              disabled={isStartDisabled}
            >
              {t("startRecording")}
            </Button>
          ) : null
        ) : (
          <>
            {/* Hide pause/resume in AI doctor mode */}
            {!isAiDoctorMode && (
              <Button
                onClick={handlePauseResume}
                variant="outline"
                size="icon"
                className="h-8 w-8"
                title={isPaused ? t("resume") : t("pause")}
                aria-label={isPaused ? t("resume") : t("pause")}
              >
                {isPaused ? (
                  <IconPlayerPlay className="size-3.5" />
                ) : (
                  <IconPlayerPause className="size-3.5" />
                )}
              </Button>
            )}
            <Button
              onClick={handleStop}
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              title={t("stop")}
              aria-label={t("stop")}
            >
              <IconPlayerStop className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
