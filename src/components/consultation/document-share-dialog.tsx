"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { useTranslations } from "next-intl"
import {
  IconCopy,
  IconExternalLink,
  IconLoader2,
  IconQrcode,
  IconRefresh,
} from "@tabler/icons-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getResponseErrorMessage } from "@/lib/response-error"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import type { ConsultationExportSharePayload } from "@/hooks/use-consultation-export-actions"
import type { PublicDocumentShareResponse } from "@/types/export"

interface DocumentShareDialogProps {
  activeTab: string
  activeTabLabel: string
  buildSharePayload: () => ConsultationExportSharePayload
  canShareDocument: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  shareTarget: {
    sessionId: string
    sessionDocumentId: string
  } | null
}

export function DocumentShareDialog({
  activeTab,
  activeTabLabel,
  buildSharePayload,
  canShareDocument,
  open,
  onOpenChange,
  shareTarget,
}: DocumentShareDialogProps) {
  const t = useTranslations("ExportDropdown")
  const [share, setShare] = useState<PublicDocumentShareResponse | null>(null)
  const [qrSvg, setQrSvg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const shareSessionId = shareTarget?.sessionId ?? null
  const shareSessionDocumentId = shareTarget?.sessionDocumentId ?? null
  const shareKey =
    shareSessionId && shareSessionDocumentId
      ? `${shareSessionId}:${shareSessionDocumentId}`
      : null
  const autoCreateKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      autoCreateKeyRef.current = null
      return
    }

    if (!shareSessionId || !shareSessionDocumentId) {
      autoCreateKeyRef.current = null
      setShare(null)
      return
    }

    let cancelled = false

    const loadShare = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          sessionId: shareSessionId,
          sessionDocumentId: shareSessionDocumentId,
        })
        const response = await fetch(`/api/export/share?${params.toString()}`)
        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(response, t("shareLoadFailed"))
          )
        }

        const nextShare = (await response.json()) as PublicDocumentShareResponse | null
        if (!cancelled) {
          setShare(nextShare)
          if (nextShare && shareKey) {
            autoCreateKeyRef.current = shareKey
          }
        }
      } catch (error) {
        if (!cancelled) {
          setShare(null)
        }
        toast.error(
          error instanceof Error ? error.message : t("shareLoadFailed")
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadShare()

    return () => {
      cancelled = true
    }
  }, [open, shareKey, shareSessionDocumentId, shareSessionId, t])

  useEffect(() => {
    if (!open || !canShareDocument || !shareKey || isLoading || isGenerating || share) {
      return
    }

    if (autoCreateKeyRef.current === shareKey) {
      return
    }

    autoCreateKeyRef.current = shareKey
    let cancelled = false

    const createShare = async () => {
      try {
        const payload = buildSharePayload()
        setIsGenerating(true)

        const response = await fetch("/api/export/share", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(
            await getResponseErrorMessage(response, t("shareCreateFailed"))
          )
        }

        const nextShare = (await response.json()) as PublicDocumentShareResponse
        if (cancelled) {
          return
        }

        setShare(nextShare)
        trackClientEvent({
          eventType: "export_clicked",
          feature: "export",
          sessionId: payload.sessionId,
          metadata: {
            tab: activeTab,
            channel: "patient_share",
            sessionDocumentId: payload.sessionDocumentId,
          },
        })
      } catch (error) {
        autoCreateKeyRef.current = null
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : t("shareCreateFailed")
          )
        }
      } finally {
        if (!cancelled) {
          setIsGenerating(false)
        }
      }
    }

    void createShare()

    return () => {
      cancelled = true
    }
  }, [
    activeTab,
    buildSharePayload,
    canShareDocument,
    isGenerating,
    isLoading,
    open,
    share,
    shareKey,
    t,
  ])

  useEffect(() => {
    if (!share?.shareUrl) {
      setQrSvg(null)
      return
    }

    let cancelled = false

    void QRCode.toString(share.shareUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      type: "svg",
      width: 224,
    })
      .then((svg: string) => {
        if (!cancelled) {
          setQrSvg(svg)
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to generate QR code", error)
        if (!cancelled) {
          setQrSvg(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [share?.shareUrl])

  const handleCreateOrReplace = async () => {
    const isReplacing = !!share

    try {
      const payload = buildSharePayload()
      setIsGenerating(true)

      const response = await fetch("/api/export/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, t("shareCreateFailed"))
        )
      }

      const nextShare = (await response.json()) as PublicDocumentShareResponse
      setShare(nextShare)
      trackClientEvent({
        eventType: "export_clicked",
        feature: "export",
        sessionId: payload.sessionId,
        metadata: {
          tab: activeTab,
          channel: "patient_share",
          sessionDocumentId: payload.sessionDocumentId,
        },
      })
      toast.success(
        isReplacing ? t("shareReplaced") : t("shareCreated")
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("shareCreateFailed")
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!share?.shareUrl) return

    try {
      await navigator.clipboard.writeText(share.shareUrl)
      toast.success(t("shareCopied"))
    } catch {
      toast.error(t("shareCopyFailed"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("shareTitle")}</DialogTitle>
          <DialogDescription>
            {t("shareDescription", { tab: activeTabLabel })}
          </DialogDescription>
        </DialogHeader>

        {!canShareDocument ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            {t("shareUnavailable")}
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{activeTabLabel}</Badge>
              {share ? (
                <Badge variant="outline">{t("shareActiveBadge")}</Badge>
              ) : (
                <Badge variant="outline">{t("shareMissingBadge")}</Badge>
              )}
            </div>

            <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 md:grid-cols-[240px_minmax(0,1fr)]">
              <div className="flex min-h-60 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-white">
                {isLoading || isGenerating ? (
                  <IconLoader2 className="size-7 animate-spin text-muted-foreground" />
                ) : qrSvg ? (
                  <div
                    className="size-56 [&_svg]:h-full [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 px-6 text-center text-sm text-muted-foreground">
                    <IconQrcode className="size-8" />
                    <p>{t("shareQrPlaceholder")}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {t("shareLinkLabel")}
                  </p>
                  <Input
                    readOnly
                    value={share?.shareUrl ?? ""}
                    placeholder={t("shareLinkPlaceholder")}
                  />
                </div>

                <p className="text-sm leading-6 text-muted-foreground">
                  {share
                    ? t("shareReplaceWarning")
                    : t("shareGenerateHint")}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleCreateOrReplace}
                    disabled={!canShareDocument || isGenerating}
                  >
                    {isGenerating ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : share ? (
                      <IconRefresh className="size-4" />
                    ) : (
                      <IconQrcode className="size-4" />
                    )}
                    {share ? t("replaceShare") : t("createShare")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyLink}
                    disabled={!share?.shareUrl}
                  >
                    <IconCopy className="size-4" />
                    {t("copyShareLink")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    disabled={!share?.shareUrl}
                  >
                    <a
                      href={share?.shareUrl || "#"}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <IconExternalLink className="size-4" />
                      {t("openSharedPage")}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("closeShareDialog")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
