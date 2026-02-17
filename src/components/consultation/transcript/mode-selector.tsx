"use client"

import { useState } from "react"
import {
  useConsultationModeStore,
  type ConsultationMode,
} from "@/stores/consultation-mode-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useSessionStore } from "@/stores/session-store"
import { useAiDoctor } from "@/hooks/use-ai-doctor"
import { cn } from "@/lib/utils"
import { IconStethoscope, IconRobot, IconAlertTriangle } from "@tabler/icons-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const activeSession = useSessionStore((s) => s.activeSession)
  const { startConsultation } = useAiDoctor()
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  if (isRecording || consultationStarted) return null

  function handleOptionClick(value: ConsultationMode) {
    if (value === "ai-doctor") {
      setShowDisclaimer(true)
      return
    }
    setMode(value)
  }

  function handleConsent() {
    setMode("ai-doctor")
    setShowDisclaimer(false)
    startConsultation()

    if (activeSession) {
      fetch(`/api/sessions/${activeSession.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "AI_DOCTOR" }),
      }).catch(() => {})

      useSessionStore.getState().updateSession(activeSession.id, { mode: "AI_DOCTOR" })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 py-6 px-4">
        <p className="text-xs text-muted-foreground/60 mb-1">
          Choose your consultation mode
        </p>
        {OPTIONS.map((option) => {
          const selected = mode === option.value
          const Icon = option.icon
          return (
            <button
              key={option.value}
              onClick={() => handleOptionClick(option.value)}
              className={cn(
                "w-full flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-all",
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

      <AlertDialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-center sm:text-center sm:place-items-center">
            <div className="mx-auto inline-flex size-12 items-center justify-center rounded-full bg-amber-500/10">
              <IconAlertTriangle className="size-6 text-amber-500" />
            </div>
            <AlertDialogTitle>AI Doctor Disclaimer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Before proceeding, please read and agree to the following:
                </p>
                <ul className="list-disc pl-4 space-y-1.5 text-left text-xs">
                  <li>
                    The AI Doctor is <strong>not a licensed medical professional</strong> and does not replace professional medical advice, diagnosis, or treatment.
                  </li>
                  <li>
                    All information provided is <strong>for reference purposes only</strong> and should not be considered a medical diagnosis or prescription.
                  </li>
                  <li>
                    <strong>The accuracy of AI responses is not guaranteed.</strong> Always consult a qualified healthcare provider for medical decisions.
                  </li>
                  <li>
                    In case of an emergency, please call <strong>119</strong> or visit the nearest emergency room immediately.
                  </li>
                  <li>
                    By proceeding, you acknowledge that you use this feature <strong>at your own risk</strong> and that the service provider is not liable for any outcomes resulting from the use of this AI consultation.
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConsent}>
              I Agree
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
