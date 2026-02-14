"use client"

import {
  useConsultationModeStore,
  type ConsultationMode,
} from "@/stores/consultation-mode-store"
import { useRecordingStore } from "@/stores/recording-store"
import { cn } from "@/lib/utils"
import { IconStethoscope, IconRobot } from "@tabler/icons-react"

const OPTIONS: {
  value: ConsultationMode
  label: string
  description: string
  icon: typeof IconStethoscope
}[] = [
    {
      value: "doctor",
      label: "I am the doctor.",
      description: "Record a live consultation with your patient.",
      icon: IconStethoscope,
    },
    {
      value: "ai-doctor",
      label: "I need an AI doctor",
      description: "Chat with an AI doctor for a virtual consultation.",
      icon: IconRobot,
    },
  ]

export function ModeSelector() {
  const mode = useConsultationModeStore((s) => s.mode)
  const setMode = useConsultationModeStore((s) => s.setMode)
  const consultationStarted = useConsultationModeStore(
    (s) => s.consultationStarted
  )
  const isRecording = useRecordingStore((s) => s.isRecording)

  if (isRecording || consultationStarted) return null

  return (
    <div className="flex flex-col items-center gap-3 py-6 px-4">
      <p className="text-xs text-muted-foreground/60 mb-1">
        Choose your consultation mode
      </p>
      {OPTIONS.map((option) => {
        const selected = mode === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            onClick={() => setMode(option.value)}
            className={cn(
              "w-full max-w-xs flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                selected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/40"
              )}
            >
              {selected && (
                <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    selected
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium leading-tight",
                    selected ? "text-primary" : "text-foreground"
                  )}
                >
                  {option.label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                {option.description}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
