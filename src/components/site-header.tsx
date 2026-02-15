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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useSessionStore } from "@/stores/session-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useSimulatedTranscript } from "@/hooks/use-simulated-transcript"
import { SCENARIOS } from "@/data/scenarios"
import {
  IconTestPipe,
  IconPlug,
  IconLayoutSidebarRightExpand,
  IconLayoutSidebarRightCollapse,
  IconDotsVertical,
  IconFileTypePdf,
  IconMail,
  IconLoader2,
} from "@tabler/icons-react"
import { ExportDropdown } from "@/components/consultation/export-dropdown"
import { MedplumSyncButton, SyncButtonIcon } from "@/components/medplum-sync-button"
import { useMedplumSyncStore } from "@/stores/medplum-sync-store"
import { usePreparePayload } from "@/hooks/use-prepare-payload"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useConnectorStore } from "@/stores/connector-store"
import { useSettingsDialogStore } from "@/stores/settings-store"
import { toast } from "sonner"
import { generatePdf, getActiveTabExportHtml } from "@/lib/export-utils"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

function SimulationDialog({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [speed, setSpeed] = useState("1.0")
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

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

    setTimeout(() => {
      startSimulation({
        speedFactor: isInstant ? 0.1 : parseFloat(speed),
        scenario: selectedScenario.entries,
        instantInsert: isInstant,
      })
      setIsOpen(false)
    }, 100)
  }

  const handleStop = () => {
    stopSimulation()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <IconTestPipe className="size-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simulation</DialogTitle>
          <DialogDescription>
            Simulate a doctor-patient conversation to test the full pipeline
            without a microphone.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Scenario</Label>
            <Select value={scenarioId} onValueChange={setScenarioId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

const TAB_LABELS: Record<string, string> = {
  insights: "Live Insights",
  ddx: "Differential Diagnosis",
  record: "Consultation Record",
  research: "Research",
}

function MobileHeaderMenu() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const connectors = useConnectorStore((s) => s.connectors)
  const openSettings = useSettingsDialogStore((s) => s.openSettings)
  const enabledCount = Object.values(connectors).filter(Boolean).length
  const activeTab = useConsultationTabStore((s) => s.activeTab)

  const syncStatus = useMedplumSyncStore((s) => s.status)
  const startPrepare = useMedplumSyncStore((s) => s.startPrepare)
  const openReviewDialog = useMedplumSyncStore((s) => s.openReviewDialog)
  const buildPayload = usePreparePayload()

  const [simDialogOpen, setSimDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handlePdfExport = async () => {
    try {
      const { blob, filename } = await generatePdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success("PDF downloaded successfully")
    } catch (err) {
      console.error("PDF export error:", err)
      toast.error("Failed to generate PDF")
    }
  }

  const handleEmailSend = async () => {
    if (!email) return
    setIsSending(true)
    try {
      const { html, tabLabel } = getActiveTabExportHtml()
      const subject = `Rxly — ${tabLabel}: ${activeSession?.title || "Consultation"}`

      const res = await fetch("/api/export/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, subject, html }),
      })

      if (!res.ok) throw new Error()

      toast.success(`Email sent to ${email}`)
      setEmailDialogOpen(false)
      setEmail("")
    } catch {
      toast.error("Failed to send email")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <IconDotsVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePdfExport} disabled={!activeSession}>
            <IconFileTypePdf className="size-4" />
            Export PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)} disabled={!activeSession}>
            <IconMail className="size-4" />
            Send via Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openSettings("connectors")} disabled={!activeSession}>
            <IconPlug className="size-4" />
            Connectors
            {enabledCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">
                {enabledCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSimDialogOpen(true)}>
            <IconTestPipe className="size-4" />
            Simulation
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (syncStatus === "idle" || syncStatus === "error") {
                const payload = buildPayload()
                if (payload && activeSession) startPrepare(activeSession.id, payload)
              } else if (syncStatus === "ready") {
                openReviewDialog()
              }
            }}
            disabled={!activeSession || syncStatus === "preparing" || syncStatus === "syncing"}
          >
            <SyncButtonIcon status={syncStatus} />
            {syncStatus === "preparing"
              ? "Preparing..."
              : syncStatus === "ready"
                ? "Review FHIR Data"
                : syncStatus === "syncing"
                  ? "Syncing..."
                  : "Sync to EMR"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send via Email</DialogTitle>
            <DialogDescription>
              Send the current {TAB_LABELS[activeTab]} content to an email address.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="mobile-export-email">Recipient Email</Label>
              <Input
                id="mobile-export-email"
                type="email"
                placeholder="doctor@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailSend()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEmailSend} disabled={!email || isSending}>
              {isSending && <IconLoader2 className="size-4 animate-spin" />}
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SimulationDialog open={simDialogOpen} onOpenChange={setSimDialogOpen} />
    </>
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
  const connectors = useConnectorStore((s) => s.connectors)
  const openSettings = useSettingsDialogStore((s) => s.openSettings)
  const enabledCount = Object.values(connectors).filter(Boolean).length

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-sm font-medium truncate min-w-0">
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
        <div data-tour="header-actions" className="ml-auto flex items-center gap-1">
          {/* Transcript toggle - desktop only */}
          {_toggleTranscript && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex size-8 text-muted-foreground hover:text-foreground"
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

          {/* Desktop: individual buttons */}
          <div className="hidden md:flex items-center gap-1">
            <ExportDropdown />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 relative"
              disabled={!activeSession}
              onClick={() => openSettings("connectors")}
            >
              <IconPlug className="size-4" />
              {enabledCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-medium text-primary-foreground flex items-center justify-center">
                  {enabledCount}
                </span>
              )}
            </Button>
            <SimulationDialog />
            <MedplumSyncButton />
          </div>

          {/* Mobile: combined dropdown */}
          <div className="md:hidden">
            <MobileHeaderMenu />
          </div>
        </div>
      </div>
    </header>
  )
}
