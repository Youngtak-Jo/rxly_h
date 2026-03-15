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
import {
  IconPlug,
  IconDotsVertical,
  IconFileTypePdf,
  IconLayoutSidebarRightExpand,
  IconLoader2,
  IconMail,
  IconQrcode,
} from "@tabler/icons-react"
import { DocumentShareDialog } from "@/components/consultation/document-share-dialog"
import { ExportDropdown } from "@/components/consultation/export-dropdown"
import { MedplumSyncButton, SyncButtonIcon } from "@/components/medplum-sync-button"
import { useConsultationExportActions } from "@/hooks/use-consultation-export-actions"
import { useMedplumSyncStore } from "@/stores/medplum-sync-store"
import { usePreparePayload } from "@/hooks/use-prepare-payload"
import { useConnectorStore } from "@/stores/connector-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsDialogStore } from "@/stores/settings-store"

function MobileHeaderMenu() {
  const t = useTranslations("SiteHeader")
  const tExport = useTranslations("ExportDropdown")
  const tCommon = useTranslations("Common")
  const connectors = useConnectorStore((s) => s.connectors)
  const openSettings = useSettingsDialogStore((s) => s.openSettings)
  const enabledCount = Object.values(connectors).filter(Boolean).length
  const {
    activeSession,
    activeTab,
    activeTabLabel,
    buildDocumentSharePayload,
    canShareDocument,
    handlePdfExport,
    sendEmail,
    shareTarget,
  } = useConsultationExportActions()

  const syncStatus = useMedplumSyncStore((s) => s.status)
  const startPrepare = useMedplumSyncStore((s) => s.startPrepare)
  const openReviewDialog = useMedplumSyncStore((s) => s.openReviewDialog)
  const buildPayload = usePreparePayload()

  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleEmailSend = async () => {
    if (!email.trim()) return

    setIsSending(true)
    const wasSent = await sendEmail(email)
    setIsSending(false)

    if (wasSent) {
      setEmailDialogOpen(false)
      setEmail("")
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
          <DropdownMenuItem onClick={() => void handlePdfExport()} disabled={!activeSession}>
            <IconFileTypePdf className="size-4" />
            {t("exportPdf")}
          </DropdownMenuItem>
          {canShareDocument ? (
            <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
              <IconQrcode className="size-4" />
              {tExport("shareWithPatient")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)} disabled={!activeSession}>
            <IconMail className="size-4" />
            {tExport("sendViaEmail")}
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
            <DialogTitle>{tExport("sendViaEmailTitle")}</DialogTitle>
            <DialogDescription>
              {tExport("sendViaEmailDescription", { tab: activeTabLabel })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="mobile-export-email">{tExport("recipientEmail")}</Label>
              <Input
                id="mobile-export-email"
                type="email"
                placeholder={tCommon("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleEmailSend()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void handleEmailSend()} disabled={!email || isSending}>
              {isSending && <IconLoader2 className="size-4 animate-spin" />}
              {isSending ? tExport("sending") : tExport("sendEmail")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentShareDialog
        activeTab={activeTab}
        activeTabLabel={activeTabLabel}
        buildSharePayload={buildDocumentSharePayload}
        canShareDocument={canShareDocument}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareTarget={shareTarget}
      />
    </>
  )
}

interface SiteHeaderProps {
  initialSessionTitle?: string | null
}

export function SiteHeader({ initialSessionTitle = null }: SiteHeaderProps) {
  const t = useTranslations("SiteHeader")
  const tTranscript = useTranslations("TranscriptViewer")
  const activeSession = useSessionStore((s) => s.activeSession)
  const connectors = useConnectorStore((s) => s.connectors)
  const openSettings = useSettingsDialogStore((s) => s.openSettings)
  const toggleMobileTranscript = useConsultationTabStore(
    (s) => s.toggleMobileTranscript
  )
  const isMobileTranscriptOpen = useConsultationTabStore(
    (s) => s.isMobileTranscriptOpen
  )
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
          {activeSession?.title || initialSessionTitle || t("defaultTitle")}
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
          <div className="md:hidden flex items-center gap-1">
            <MobileHeaderMenu />
            <Button
              variant={isMobileTranscriptOpen ? "secondary" : "ghost"}
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              disabled={!activeSession}
              onClick={toggleMobileTranscript}
              aria-label={t("showTranscript")}
              title={tTranscript("headerTranscript")}
            >
              <IconLayoutSidebarRightExpand className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
