"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
import { trackClientEvent } from "@/lib/telemetry/client-events"

export function ExportDropdown() {
  const t = useTranslations("ExportDropdown")
  const tTabs = useTranslations("ConsultationTabs")
  const tCommon = useTranslations("Common")
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const activeSession = useSessionStore((s) => s.activeSession)
  const activeTab = useConsultationTabStore((s) => s.activeTab)
  const activeTabLabel = tTabs(activeTab)

  const handlePdfExport = async () => {
    try {
      const { blob, filename } = await generatePdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      if (activeSession) {
        trackClientEvent({
          eventType: "export_clicked",
          feature: "export",
          sessionId: activeSession.id,
          metadata: { tab: activeTab, channel: "pdf" },
        })
      }
      toast.success(t("pdfSuccess"))
    } catch (err) {
      console.error("PDF export error:", err)
      toast.error(t("pdfFailed"))
    }
  }

  const handleEmailSend = async () => {
    if (!email) return
    setIsSending(true)
    try {
      const { html, tabLabel } = getActiveTabExportHtml()
      const subject = `Rxly — ${tabLabel}: ${activeSession?.title || t("consultationFallback")}`

      const res = await fetch("/api/export/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, subject, html }),
      })

      if (!res.ok) throw new Error()

      if (activeSession) {
        trackClientEvent({
          eventType: "export_clicked",
          feature: "export",
          sessionId: activeSession.id,
          metadata: { tab: activeTab, channel: "email" },
        })
      }
      toast.success(t("emailSent", { email }))
      setEmailDialogOpen(false)
      setEmail("")
    } catch {
      toast.error(t("emailFailed"))
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
            title={t("export")}
          >
            <IconShare className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("menuLabel", { tab: activeTabLabel })}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handlePdfExport}>
            <IconFileTypePdf className="size-4" />
            {t("downloadPdf")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
            <IconMail className="size-4" />
            {t("sendViaEmail")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sendViaEmailTitle")}</DialogTitle>
            <DialogDescription>
              {t("sendViaEmailDescription", { tab: activeTabLabel })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="export-email">{t("recipientEmail")}</Label>
              <Input
                id="export-email"
                type="email"
                placeholder={tCommon("emailPlaceholder")}
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
              {isSending ? t("sending") : t("sendEmail")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
