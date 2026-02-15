"use client"

import { useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRecordingStore } from "@/stores/recording-store"
import { useSessionStore } from "@/stores/session-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useDeepgram } from "@/hooks/use-deepgram"
import { useAiDoctor } from "@/hooks/use-ai-doctor"
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerStop,
} from "@tabler/icons-react"

export function RecordingControls() {
  const { isRecording, isPaused, duration, setDuration, isSimulating, simulationControls } =
    useRecordingStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const { startListening, stopListening, pauseListening, resumeListening } =
    useDeepgram()
  const { startConsultation, endConsultation } = useAiDoctor()
  const mode = useConsultationModeStore((s) => s.mode)
  const consultationStarted = useConsultationModeStore(
    (s) => s.consultationStarted
  )
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleStart = useCallback(async () => {
    if (!activeSession) return
    if (isAiDoctorMode) {
      startConsultation()
    } else {
      await startListening()
    }
  }, [activeSession, isAiDoctorMode, startConsultation, startListening])

  const handleStop = useCallback(() => {
    if (isAiDoctorMode) {
      endConsultation()
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

  const headerLabel =
    isAiDoctorMode && consultationStarted ? "AI Consultation" : "Transcript"

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
            {isAiDoctorMode ? "ACTIVE" : isPaused ? "PAUSED" : "LIVE"}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!isRecording ? (
          <Button
            onClick={handleStart}
            size="sm"
            className="gap-1.5 h-8"
            disabled={!activeSession}
          >
            {isAiDoctorMode ? "Start AI Consultation" : "Start Recording"}
          </Button>
        ) : (
          <>
            {/* Hide pause/resume in AI doctor mode */}
            {!isAiDoctorMode && (
              <Button
                onClick={handlePauseResume}
                variant="outline"
                size="icon"
                className="h-8 w-8"
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
            >
              <IconPlayerStop className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
