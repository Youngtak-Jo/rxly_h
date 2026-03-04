"use client"

import { useState, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSessionStore } from "@/stores/session-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useSimulatedTranscript } from "@/hooks/use-simulated-transcript"
import { SCENARIOS } from "@/data/scenarios"

const SIMULATION_SPEED_PRESETS = [
  { value: "1.0", labelKey: "realTime" },
  { value: "0.5", labelKey: "x2" },
  { value: "0.3333333333", labelKey: "x3" },
  { value: "0.25", labelKey: "x4" },
] as const

interface SimulationDialogProps {
  trigger?: ReactNode
}

export function SimulationDialog({ trigger }: SimulationDialogProps) {
  const t = useTranslations("SiteHeader")
  const [open, setOpen] = useState(false)
  const [speed, setSpeed] = useState<string>(SIMULATION_SPEED_PRESETS[0].value)
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)

  const activeSession = useSessionStore((s) => s.activeSession)
  const addSession = useSessionStore((s) => s.addSession)
  const setActiveSession = useSessionStore((s) => s.setActiveSession)
  const { isRecording, isSimulating } = useRecordingStore()
  const { startSimulation, stopSimulation } = useSimulatedTranscript()

  const selectedScenario =
    SCENARIOS.find((scenario) => scenario.id === scenarioId) || SCENARIOS[0]

  const handleStart = async () => {
    let sessionReady = !!activeSession
    if (!activeSession) {
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t("newConsultation") }),
        })
        if (res.ok) {
          const session = await res.json()
          addSession(session)
          setActiveSession(session)
          sessionReady = true
        }
      } catch (error) {
        console.error("Failed to create session:", error)
      }
    }

    if (!sessionReady) return

    setTimeout(() => {
      startSimulation({
        speedFactor: parseFloat(speed),
        scenario: selectedScenario.entries,
      })
      setOpen(false)
    }, 100)
  }

  const handleStop = () => {
    stopSimulation()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("simulationTitle")}</DialogTitle>
          <DialogDescription>{t("simulationDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>{t("scenario")}</Label>
            <Select value={scenarioId} onValueChange={setScenarioId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {t(`scenarios.${scenario.id}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>{t("speed")}</Label>
            <Select value={speed} onValueChange={setSpeed}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIMULATION_SPEED_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {t(`speedOptions.${preset.labelKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          {isSimulating ? (
            <Button variant="destructive" onClick={handleStop}>
              {t("stopSimulation")}
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={isRecording}>
              {t("startSimulation")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
