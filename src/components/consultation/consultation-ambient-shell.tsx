"use client"

import type { ReactNode } from "react"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useTranscriptStore } from "@/stores/transcript-store"

type ConsultationAmbientState = "idle" | "live" | "transcribing" | "paused"

export function ConsultationAmbientShell({
  children,
}: {
  children: ReactNode
}) {
  const isRecording = useRecordingStore((s) => s.isRecording)
  const isPaused = useRecordingStore((s) => s.isPaused)
  const interimText = useTranscriptStore((s) => s.interimText)
  const mode = useConsultationModeStore((s) => s.mode)
  const isMicActive = useConsultationModeStore((s) => s.isMicActive)

  const isVoiceLive = mode === "ai-doctor" ? isMicActive || isRecording : isRecording
  const hasInterim = interimText.trim().length > 0

  let recordingState: ConsultationAmbientState = "idle"

  if (isRecording && isPaused) {
    recordingState = "paused"
  } else if (isVoiceLive && hasInterim) {
    recordingState = "transcribing"
  } else if (isVoiceLive) {
    recordingState = "live"
  }

  return (
    <div
      className="consultation-ambient-shell relative isolate flex min-h-0 flex-1 flex-col"
      data-recording-state={recordingState}
    >
      <div className="consultation-ambient-shell__inner relative z-[1] flex min-h-0 flex-1 flex-col bg-[#ffffff]">
        <div className="consultation-ambient-shell__content">
          {children}
        </div>
        <div
          aria-hidden="true"
          className="consultation-ambient-shell__inset-glow"
        />
      </div>
    </div>
  )
}
