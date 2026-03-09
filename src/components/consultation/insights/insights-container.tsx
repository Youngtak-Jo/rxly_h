"use client"

import { useMemo, useRef } from "react"
import { useTranslations } from "next-intl"
import { DocumentRenderer } from "@/components/consultation/documents/document-editor"
import { DocumentShell } from "@/components/consultation/documents/document-shell"
import { InlineCommentPopover } from "./inline-comment-popover"
import { insightsToRichTextDocument } from "@/lib/documents/rich-text"
import { useInsightsStore } from "@/stores/insights-store"
import { useNoteStore } from "@/stores/note-store"

export function InsightsContainer() {
  const t = useTranslations("InsightsPanel")
  const summary = useInsightsStore((state) => state.summary)
  const rawKeyFindings = useInsightsStore((state) => state.keyFindings)
  const rawRedFlags = useInsightsStore((state) => state.redFlags)
  const checklistItems = useInsightsStore((state) => state.checklistItems)
  const isProcessing = useInsightsStore((state) => state.isProcessing)
  const pendingComments = useInsightsStore((state) => state.pendingComments)
  const notes = useNoteStore((state) => state.notes)
  const containerRef = useRef<HTMLDivElement>(null)

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
        {hasDocumentContent ? <DocumentRenderer value={documentValue} embedded /> : null}
        <InlineCommentPopover containerRef={containerRef} />
      </DocumentShell>
    </div>
  )
}
