"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  IconFileTypePdf,
  IconLoader2,
  IconMail,
  IconQrcode,
  IconShare,
} from "@tabler/icons-react"
import { DocumentShareDialog } from "@/components/consultation/document-share-dialog"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useConsultationExportActions } from "@/hooks/use-consultation-export-actions"

export function ExportDropdown() {
  const t = useTranslations("ExportDropdown")
  const tCommon = useTranslations("Common")
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
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
            disabled={!activeSession}
            title={t("export")}
          >
            <IconShare className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("menuLabel", { tab: activeTabLabel })}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void handlePdfExport()}>
            <IconFileTypePdf className="size-4" />
            {t("downloadPdf")}
          </DropdownMenuItem>
          {canShareDocument ? (
            <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
              <IconQrcode className="size-4" />
              {t("shareWithPatient")}
            </DropdownMenuItem>
          ) : null}
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
                onKeyDown={(e) => e.key === "Enter" && void handleEmailSend()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void handleEmailSend()} disabled={!email || isSending}>
              {isSending ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : null}
              {isSending ? t("sending") : t("sendEmail")}
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
