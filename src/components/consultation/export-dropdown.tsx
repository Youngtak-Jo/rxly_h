"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  IconShare,
  IconFileTypePdf,
  IconMail,
  IconLoader2,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useSessionStore } from "@/stores/session-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { getActiveTabExportHtml, generatePdf } from "@/lib/export-utils"

const TAB_LABELS: Record<string, string> = {
  insights: "Live Insights",
  ddx: "Differential Diagnosis",
  record: "Consultation Record",
  research: "Research",
  patientHandout: "Patient Handout",
}

export function ExportDropdown() {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const activeSession = useSessionStore((s) => s.activeSession)
  const activeTab = useConsultationTabStore((s) => s.activeTab)

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
            disabled={!activeSession}
            title="Export"
          >
            <IconShare className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            Export: {TAB_LABELS[activeTab]}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlePdfExport}>
            <IconFileTypePdf className="size-4" />
            Download as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
            <IconMail className="size-4" />
            Send via Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send via Email</DialogTitle>
            <DialogDescription>
              Send the current {TAB_LABELS[activeTab]} content to an email
              address.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="export-email">Recipient Email</Label>
              <Input
                id="export-email"
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
              {isSending && (
                <IconLoader2 className="size-4 animate-spin" />
              )}
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
