"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IconLoader2,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react"
import { MonitorUp } from "lucide-react"
import { useSessionStore } from "@/stores/session-store"
import {
  useMedplumSyncStore,
  type MedplumSyncStatus,
} from "@/stores/medplum-sync-store"
import { usePreparePayload } from "@/hooks/use-prepare-payload"
import { FhirBundleReview } from "@/components/fhir-bundle-review"

// --- Icon by status ---

export function SyncButtonIcon({ status }: { status: MedplumSyncStatus }) {
  switch (status) {
    case "idle":
      return <MonitorUp className="size-4" />
    case "preparing":
      return <IconLoader2 className="size-4 animate-spin" />
    case "ready":
    case "reviewing":
      return <MonitorUp className="size-4 text-green-500" />
    case "syncing":
      return <IconLoader2 className="size-4 animate-spin" />
    case "success":
      return <IconCheck className="size-4 text-green-500" />
    case "error":
      return <IconAlertTriangle className="size-4 text-destructive" />
  }
}

// --- Main component ---

export function MedplumSyncButton() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const status = useMedplumSyncStore((s) => s.status)
  const dialogOpen = useMedplumSyncStore((s) => s.dialogOpen)
  const startPrepare = useMedplumSyncStore((s) => s.startPrepare)
  const openReviewDialog = useMedplumSyncStore((s) => s.openReviewDialog)
  const closeDialog = useMedplumSyncStore((s) => s.closeDialog)
  const confirmSync = useMedplumSyncStore((s) => s.confirmSync)
  const reset = useMedplumSyncStore((s) => s.reset)
  const restoreFromCache = useMedplumSyncStore((s) => s.restoreFromCache)
  const buildPayload = usePreparePayload()

  // Restore from cache (or reset) when session changes
  const activeSessionId = activeSession?.id
  useEffect(() => {
    if (activeSessionId) {
      restoreFromCache(activeSessionId)
    } else {
      reset()
    }
  }, [activeSessionId, restoreFromCache, reset])

  const handleClick = () => {
    if (status === "idle" || status === "error") {
      const payload = buildPayload()
      if (payload && activeSession) startPrepare(activeSession.id, payload)
    } else if (status === "ready") {
      openReviewDialog()
    } else if (status === "success") {
      reset()
    }
  }

  const isDisabled =
    !activeSession || status === "preparing" || status === "syncing"

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        disabled={isDisabled}
        onClick={handleClick}
        title={getButtonTitle(status)}
      >
        <SyncButtonIcon status={status} />
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85dvh] sm:max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Review FHIR Data</DialogTitle>
            <DialogDescription>
              Review and edit the generated FHIR resources before sending to
              your EMR.
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-6 flex-1 min-h-0 overflow-y-auto px-6">
            <FhirBundleReview />
          </div>

          <DialogFooter>
            {status === "success" ? (
              <Button variant="outline" onClick={closeDialog}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmSync}
                  disabled={status === "syncing"}
                >
                  {status === "syncing" && (
                    <IconLoader2 className="size-4 animate-spin" />
                  )}
                  {status === "syncing" ? "Sending..." : "Send to EMR"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function getButtonTitle(status: MedplumSyncStatus): string {
  switch (status) {
    case "idle":
      return "Sync to EMR"
    case "preparing":
      return "Preparing FHIR data..."
    case "ready":
      return "Review FHIR data (click to open)"
    case "reviewing":
      return "Reviewing FHIR data"
    case "syncing":
      return "Sending to EMR..."
    case "success":
      return "Sync complete (click to reset)"
    case "error":
      return "Sync failed (click to retry)"
  }
}
