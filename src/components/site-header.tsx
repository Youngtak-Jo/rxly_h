"use client"

import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
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
import {
  IconTestPipe,
  IconLayoutSidebarRightExpand,
  IconLayoutSidebarRightCollapse,
} from "@tabler/icons-react"
import { ConnectorsDialog } from "@/components/consultation/note-input/connectors-dialog"
import { ExportDropdown } from "@/components/consultation/export-dropdown"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function SimulationDialog() {
  const [open, setOpen] = useState(false)
  const [speed, setSpeed] = useState("0.5")
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)

  const activeSession = useSessionStore((s) => s.activeSession)
  const { addSession, setActiveSession } = useSessionStore()
  const { isRecording, isSimulating } = useRecordingStore()
  const { startSimulation, stopSimulation } = useSimulatedTranscript()

  const selectedScenario =
    SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0]

  const handleStart = async () => {
    let sessionReady = !!activeSession
    if (!activeSession) {
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

    const isInstant = speed === "instant"

    // Small delay to let session state propagate
    setTimeout(() => {
      startSimulation({
        speedFactor: isInstant ? 0.1 : parseFloat(speed),
        skipInterim: true,
        scenario: selectedScenario.entries,
        instantInsert: isInstant,
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
            <Label>Scenario</Label>
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
                <Separator className="my-1" />
                <SelectItem value="instant">즉시삽입 (Instant)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          {isSimulating ? (
            <Button variant="destructive" onClick={handleStop}>
              Stop Simulation
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={isRecording}>
              Start Simulation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SiteHeader() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const { isRecording, isPaused, duration } = useRecordingStore()
  const isTranscriptCollapsed = useConsultationTabStore(
    (s) => s.isTranscriptCollapsed
  )
  const _toggleTranscript = useConsultationTabStore(
    (s) => s._toggleTranscript
  )

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
        <div className="ml-auto flex items-center gap-1">
          {_toggleTranscript && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={_toggleTranscript}
              title={isTranscriptCollapsed ? "Show transcript" : "Hide transcript"}
            >
              {isTranscriptCollapsed ? (
                <IconLayoutSidebarRightExpand className="size-4" />
              ) : (
                <IconLayoutSidebarRightCollapse className="size-4" />
              )}
            </Button>
          )}
          <ExportDropdown />
          <ConnectorsDialog />
          <SimulationDialog />
        </div>
      </div>
    </header>
  )
}
