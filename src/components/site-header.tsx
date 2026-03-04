"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
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
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useSessionStore } from "@/stores/session-store"
import {
  IconPlug,
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
import { trackClientEvent } from "@/lib/telemetry/client-events"

function MobileHeaderMenu() {
  const t = useTranslations("SiteHeader")
  const tTabs = useTranslations("ConsultationTabs")
  const tCommon = useTranslations("Common")
  const activeSession = useSessionStore((s) => s.activeSession)
  const connectors = useConnectorStore((s) => s.connectors)
  const openSettings = useSettingsDialogStore((s) => s.openSettings)
  const enabledCount = Object.values(connectors).filter(Boolean).length
  const activeTab = useConsultationTabStore((s) => s.activeTab)
  const activeTabLabel = tTabs(activeTab)

  const syncStatus = useMedplumSyncStore((s) => s.status)
  const startPrepare = useMedplumSyncStore((s) => s.startPrepare)
  const openReviewDialog = useMedplumSyncStore((s) => s.openReviewDialog)
  const buildPayload = usePreparePayload()

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
          >
            <IconDotsVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePdfExport} disabled={!activeSession}>
            <IconFileTypePdf className="size-4" />
            {t("exportPdf")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)} disabled={!activeSession}>
            <IconMail className="size-4" />
            {t("sendViaEmail")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openSettings("connectors")} disabled={!activeSession}>
            <IconPlug className="size-4" />
            {t("connectors")}
            {enabledCount > 0 && (
              <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">
                {enabledCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
              ? t("preparing")
              : syncStatus === "ready"
                ? t("reviewFhirData")
                : syncStatus === "syncing"
                  ? t("syncing")
                  : t("syncToEmr")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("mobileEmailTitle")}</DialogTitle>
            <DialogDescription>
              {t("mobileEmailDescription", { tab: activeTabLabel })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="mobile-export-email">{t("recipientEmail")}</Label>
              <Input
                id="mobile-export-email"
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
              {isSending && <IconLoader2 className="size-4 animate-spin" />}
              {isSending ? t("sending") : t("sendEmail")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function SiteHeader() {
  const t = useTranslations("SiteHeader")
  const activeSession = useSessionStore((s) => s.activeSession)
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
          {activeSession?.title || t("defaultTitle")}
        </h1>

        <div data-tour="header-actions" className="ml-auto flex items-center gap-1">
          {/* Desktop: individual buttons */}
          <div className="hidden md:flex items-center gap-1">
            <ExportDropdown />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 relative text-muted-foreground hover:text-foreground"
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
