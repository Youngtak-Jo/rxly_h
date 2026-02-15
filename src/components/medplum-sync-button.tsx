"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  IconCloudUpload,
  IconLoader2,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { useSessionStore } from "@/stores/session-store"
import { useRecordStore } from "@/stores/record-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { toast } from "sonner"

type SyncStatus = "idle" | "syncing" | "success" | "error"

interface CreatedResource {
  resourceType: string
  id: string
  display?: string
}

export function MedplumSyncButton({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [status, setStatus] = useState<SyncStatus>("idle")
  const [createdResources, setCreatedResources] = useState<CreatedResource[]>(
    []
  )
  const [errorMessage, setErrorMessage] = useState("")

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen

  const activeSession = useSessionStore((s) => s.activeSession)
  const record = useRecordStore((s) => s.record)
  const summary = useInsightsStore((s) => s.summary)
  const keyFindings = useInsightsStore((s) => s.keyFindings)
  const redFlags = useInsightsStore((s) => s.redFlags)
  const insightsDiagnoses = useInsightsStore((s) => s.diagnoses)
  const ddxDiagnoses = useDdxStore((s) => s.diagnoses)
  const getFullTranscript = useTranscriptStore((s) => s.getFullTranscript)

  // Use DDx diagnoses if available, otherwise fall back to insights diagnoses
  const diagnoses = ddxDiagnoses.length > 0 ? ddxDiagnoses : insightsDiagnoses

  const hasRecord = !!record
  const hasInsights = !!summary
  const hasDiagnoses = diagnoses.length > 0

  const handleSync = async () => {
    if (!activeSession) return

    setStatus("syncing")
    setCreatedResources([])
    setErrorMessage("")

    try {
      const res = await fetch("/api/medplum/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: {
            title: activeSession.title,
            patientName: activeSession.patientName,
            startedAt: activeSession.startedAt,
            endedAt: activeSession.endedAt,
          },
          record: record
            ? {
                patientName: record.patientName,
                chiefComplaint: record.chiefComplaint,
                hpiText: record.hpiText,
                medications: record.medications,
                rosText: record.rosText,
                pmh: record.pmh,
                socialHistory: record.socialHistory,
                familyHistory: record.familyHistory,
                vitals: record.vitals,
                physicalExam: record.physicalExam,
                labsStudies: record.labsStudies,
                assessment: record.assessment,
                plan: record.plan,
              }
            : undefined,
          insights: hasInsights
            ? { summary, keyFindings, redFlags }
            : undefined,
          diagnoses: hasDiagnoses
            ? diagnoses.map((d) => ({
                icdCode: d.icdCode,
                diseaseName: d.diseaseName,
                confidence: d.confidence,
                evidence: d.evidence,
              }))
            : undefined,
          transcript: getFullTranscript() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setCreatedResources(data.resources || [])
      setStatus("success")
      toast.success(
        `Medplum sync complete: ${data.resourceCount} resources created`
      )
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sync to Medplum"
      setErrorMessage(message)
      setStatus("error")
      toast.error(`Medplum sync failed: ${message}`)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset state when closing
      setStatus("idle")
      setCreatedResources([])
      setErrorMessage("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            disabled={!activeSession}
            title="Sync to Medplum"
          >
            <IconCloudUpload className="size-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sync to Medplum</DialogTitle>
          <DialogDescription>
            Transform consultation data into FHIR R4 resources and sync to
            Medplum Cloud.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="text-sm font-medium">Data to sync:</div>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Patient</span>
              <Badge variant="secondary">
                {record?.patientName ||
                  activeSession?.patientName ||
                  "Unknown"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Consultation Record
              </span>
              <Badge variant={hasRecord ? "default" : "outline"}>
                {hasRecord ? "Available" : "None"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Insights</span>
              <Badge variant={hasInsights ? "default" : "outline"}>
                {hasInsights ? "Available" : "None"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Diagnoses</span>
              <Badge variant={hasDiagnoses ? "default" : "outline"}>
                {hasDiagnoses ? `${diagnoses.length} items` : "None"}
              </Badge>
            </div>
          </div>

          {/* Success: show created resources */}
          {status === "success" && createdResources.length > 0 && (
            <div className="rounded-md border bg-muted/50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-600">
                <IconCheck className="size-4" />
                Created {createdResources.length} FHIR resources
              </div>
              <div className="grid gap-1 text-xs text-muted-foreground">
                {createdResources.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <span>
                      {r.resourceType}: {r.display || r.id}
                    </span>
                    <code className="text-[10px]">{r.id.slice(0, 8)}...</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <IconAlertTriangle className="size-4" />
                {errorMessage}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === "success" ? (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          ) : (
            <Button
              onClick={handleSync}
              disabled={!activeSession || status === "syncing"}
            >
              {status === "syncing" && (
                <IconLoader2 className="size-4 animate-spin" />
              )}
              {status === "syncing" ? "Syncing..." : "Sync to Medplum"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
