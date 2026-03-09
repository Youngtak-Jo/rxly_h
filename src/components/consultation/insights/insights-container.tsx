"use client"

import { useCallback, useMemo, useRef } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { DocumentRenderer } from "@/components/consultation/documents/document-editor"
import { DocumentShell } from "@/components/consultation/documents/document-shell"
import { InlineCommentPopover } from "./inline-comment-popover"
import { insightsToRichTextDocument } from "@/lib/documents/rich-text"
import { useInsightsStore } from "@/stores/insights-store"
import { useNoteStore } from "@/stores/note-store"
import { useSessionStore } from "@/stores/session-store"
import { deleteCachedSession } from "@/hooks/use-session-loader"

export function InsightsContainer() {
  const t = useTranslations("InsightsPanel")
  const activeSession = useSessionStore((state) => state.activeSession)
  const summary = useInsightsStore((state) => state.summary)
  const rawKeyFindings = useInsightsStore((state) => state.keyFindings)
  const rawRedFlags = useInsightsStore((state) => state.redFlags)
  const checklistItems = useInsightsStore((state) => state.checklistItems)
  const isProcessing = useInsightsStore((state) => state.isProcessing)
  const pendingComments = useInsightsStore((state) => state.pendingComments)
  const setChecklistItemChecked = useInsightsStore(
    (state) => state.setChecklistItemChecked
  )
  const notes = useNoteStore((state) => state.notes)
  const containerRef = useRef<HTMLDivElement>(null)
  const checklistRequestSeqRef = useRef(new Map<string, number>())

  const keyFindings = useMemo(
    () => (Array.isArray(rawKeyFindings) ? rawKeyFindings : []),
    [rawKeyFindings]
  )
  const redFlags = useMemo(
    () => (Array.isArray(rawRedFlags) ? rawRedFlags : []),
    [rawRedFlags]
  )
  const uploadedImages = notes.flatMap((note) =>
    (note.imageUrls || []).map((url) => ({
      url,
      alt: note.content || t("medicalImage"),
    }))
  )

  const hasDocumentContent =
    !!summary ||
    keyFindings.length > 0 ||
    redFlags.length > 0 ||
    checklistItems.length > 0 ||
    uploadedImages.length > 0

  const documentValue = useMemo(
    () =>
      insightsToRichTextDocument({
        summary,
        keyFindings,
        redFlags,
        checklistItems,
        images: uploadedImages,
        labels: {
          summary: t("summary"),
          keyFindings: t("keyFindings"),
          redFlags: t("redFlags"),
          checklist: t("checklist"),
          images: t("imagingUploads"),
        },
      }),
    [checklistItems, keyFindings, redFlags, summary, t, uploadedImages]
  )

  const handleReadOnlyChecklistToggle = useCallback(
    (itemId: string, checked: boolean) => {
      const sessionId = activeSession?.id
      if (!sessionId) return false

      const currentItem = useInsightsStore
        .getState()
        .checklistItems.find((item) => item.id === itemId)
      if (!currentItem) return false

      const previousChecked = currentItem.isChecked
      if (previousChecked === checked) return true

      setChecklistItemChecked(itemId, checked)

      const nextSeq =
        (checklistRequestSeqRef.current.get(itemId) ?? 0) + 1
      checklistRequestSeqRef.current.set(itemId, nextSeq)

      void fetch(`/api/sessions/${sessionId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          isChecked: checked,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Failed to update checklist item")
          }
          deleteCachedSession(sessionId)
        })
        .catch(() => {
          if (checklistRequestSeqRef.current.get(itemId) !== nextSeq) return
          setChecklistItemChecked(itemId, previousChecked)
          toast.error("Failed to update checklist item")
        })
        .finally(() => {
          if (checklistRequestSeqRef.current.get(itemId) === nextSeq) {
            checklistRequestSeqRef.current.delete(itemId)
          }
        })

      return true
    },
    [activeSession?.id, setChecklistItemChecked]
  )

  return (
    <div ref={containerRef} data-tour="insights-panel">
      <DocumentShell
        ambientState={isProcessing ? "updating" : "idle"}
        empty={!hasDocumentContent && !isProcessing}
        emptyMessage={t("emptyState")}
        footerMeta={
          pendingComments.length > 0 ? (
            <span>
              {t("pendingComments", { count: pendingComments.length })}
            </span>
          ) : null
        }
      >
        {hasDocumentContent ? (
          <DocumentRenderer
            value={documentValue}
            embedded
            onReadOnlyChecklistToggle={handleReadOnlyChecklistToggle}
          />
        ) : null}
        <InlineCommentPopover containerRef={containerRef} />
      </DocumentShell>
    </div>
  )
}
