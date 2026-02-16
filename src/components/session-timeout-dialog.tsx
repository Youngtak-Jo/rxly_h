"use client"

import { useSessionTimeout } from "@/hooks/use-session-timeout"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function SessionTimeoutDialog() {
  const { showWarning, extendSession, dismissWarning, logout } = useSessionTimeout()

  return (
    <Dialog
      open={showWarning}
      onOpenChange={(open) => {
        if (!open) dismissWarning()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Expiring</DialogTitle>
          <DialogDescription>
            Your session is about to expire due to inactivity. You will be
            logged out in 1 minute to protect patient data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={logout}>
            Log Out Now
          </Button>
          <Button onClick={extendSession}>Continue Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
