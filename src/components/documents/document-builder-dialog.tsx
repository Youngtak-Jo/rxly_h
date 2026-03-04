"use client"

import { useCallback, useRef, useState } from "react"
import { IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

import { DocumentBuilderFlow, type DocumentBuilderFlowHandle } from "@/components/documents/document-builder-flow"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useDocumentBuilderDialogStore } from "@/stores/document-builder-dialog-store"

export function DocumentBuilderDialog() {
  const router = useRouter()
  const t = useTranslations("DocumentBuilder")
  const open = useDocumentBuilderDialogStore((state) => state.open)
  const mode = useDocumentBuilderDialogStore((state) => state.mode)
  const templateId = useDocumentBuilderDialogStore((state) => state.templateId)
  const routeBacked = useDocumentBuilderDialogStore((state) => state.routeBacked)
  const reset = useDocumentBuilderDialogStore((state) => state.reset)

  const flowRef = useRef<DocumentBuilderFlowHandle>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false)

  const finishClose = useCallback(() => {
    setCloseConfirmOpen(false)
    setIsDirty(false)
    reset()
    if (routeBacked) {
      router.replace("/documents")
    }
  }, [reset, routeBacked, router])

  const requestClose = useCallback(() => {
    if (isDirty) {
      setCloseConfirmOpen(true)
      return
    }

    finishClose()
  }, [finishClose, isDirty])

  const keepForLaterAndClose = useCallback(() => {
    flowRef.current?.keepForLater()
    finishClose()
  }, [finishClose])

  const discardLocalDraftAndClose = useCallback(() => {
    flowRef.current?.discardLocalDraft()
    finishClose()
  }, [finishClose])

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            requestClose()
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="h-[100dvh] w-screen max-w-none gap-0 overflow-hidden rounded-none p-0 sm:h-[min(90dvh,880px)] sm:w-[min(96vw,1280px)] sm:max-w-[1280px] sm:rounded-3xl"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="border-b px-4 py-4 text-left sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <DialogTitle>
                    {mode === "create" ? t("titleNew") : t("titleEdit")}
                  </DialogTitle>
                  <DialogDescription>{t("subtitle")}</DialogDescription>
                </div>

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  onClick={requestClose}
                  aria-label={t("navigation.close")}
                >
                  <IconX className="size-4" />
                </Button>
              </div>
            </DialogHeader>

            {open ? (
              <DocumentBuilderFlow
                ref={flowRef}
                initialMode={mode}
                initialTemplateId={templateId}
                routeBacked={routeBacked}
                onClose={finishClose}
                onDirtyChange={setIsDirty}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("navigation.closeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("navigation.closeDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col-reverse gap-2 sm:grid sm:grid-cols-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCloseConfirmOpen(false)}
            >
              {t("navigation.cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={keepForLaterAndClose}
            >
              {t("navigation.keepForLater")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={discardLocalDraftAndClose}
            >
              {t("navigation.discardDraft")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
