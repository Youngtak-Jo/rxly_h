"use client"

import { useMemo, useState } from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { IconDice, IconTestPipe } from "@tabler/icons-react"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function SimulationDialog() {
  const [open, setOpen] = useState(false)
  const [speed, setSpeed] = useState("0.5")
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)
  const [skipInterim, setSkipInterim] = useState(false)
  const [autoCreateSession, setAutoCreateSession] = useState(true)

  const activeSession = useSessionStore((s) => s.activeSession)
  const { addSession, setActiveSession } = useSessionStore()
  const { isRecording } = useRecordingStore()
  const { startSimulation, stopSimulation } = useSimulatedTranscript()

  const selectedScenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0],
    [scenarioId]
  )

  const estimatedDuration = useMemo(() => {
    const speedFactor = parseFloat(speed)
    const totalDelayMs = selectedScenario.entries.reduce(
      (sum, e) => sum + e.delayMs * speedFactor,
      0
    )
    const totalInterimMs = selectedScenario.entries.reduce(
      (sum, e) => sum + e.text.split(" ").length * 80 * speedFactor,
      0
    )
    const totalSec = Math.round((totalDelayMs + totalInterimMs) / 1000)
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}m ${s}s`
  }, [selectedScenario, speed])

  const handleRandomScenario = () => {
    const others = SCENARIOS.filter((s) => s.id !== scenarioId)
    const random = others[Math.floor(Math.random() * others.length)]
    setScenarioId(random.id)
  }

  const handleStart = async () => {
    let sessionReady = !!activeSession
    if (!activeSession && autoCreateSession) {
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Consultation" }),
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

    // Small delay to let session state propagate
    setTimeout(() => {
      startSimulation({
        speedFactor: parseFloat(speed),
        skipInterim,
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
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-foreground"
        >
          <IconTestPipe className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simulation</DialogTitle>
          <DialogDescription>
            Simulate a doctor-patient conversation to test the full pipeline
            without a microphone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Scenario selector */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Scenario</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs text-muted-foreground"
                onClick={handleRandomScenario}
              >
                <IconDice className="size-3" />
                Random
              </Button>
            </div>
            <Select value={scenarioId} onValueChange={setScenarioId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nameKo} — {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedScenario.description}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedScenario.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">
                  {tag}
                </Badge>
              ))}
              <span className="text-[10px] text-muted-foreground ml-auto">
                {selectedScenario.entries.length} utterances · ~{estimatedDuration}
              </span>
            </div>
          </div>

          {/* Speed */}
          <div className="grid gap-2">
            <Label>Speed</Label>
            <Select value={speed} onValueChange={setSpeed}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.0">1x (Real-time)</SelectItem>
                <SelectItem value="0.5">2x</SelectItem>
                <SelectItem value="0.25">4x</SelectItem>
                <SelectItem value="0.1">10x (Fastest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="skip-interim"
              checked={skipInterim}
              onCheckedChange={(v) => setSkipInterim(v === true)}
            />
            <Label htmlFor="skip-interim" className="font-normal">
              Skip interim text animation
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="auto-create"
              checked={autoCreateSession}
              onCheckedChange={(v) => setAutoCreateSession(v === true)}
            />
            <Label htmlFor="auto-create" className="font-normal">
              Auto-create session if none active
            </Label>
          </div>
        </div>

        <DialogFooter>
          {isRecording ? (
            <Button variant="destructive" onClick={handleStop}>
              Stop Simulation
            </Button>
          ) : (
            <Button onClick={handleStart}>Start Simulation</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SiteHeader() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const { isRecording, isPaused, duration } = useRecordingStore()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          {activeSession?.title || "Rxly Consultation"}
        </h1>
        {isRecording && (
          <div className="ml-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <Badge variant="secondary" className="text-xs font-mono">
              {isPaused ? "Paused" : formatDuration(duration)}
            </Badge>
          </div>
        )}
        {process.env.NODE_ENV === "development" && (
          <div className="ml-auto">
            <SimulationDialog />
          </div>
        )}
      </div>
    </header>
  )
}
