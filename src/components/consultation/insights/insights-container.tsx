"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useInsightsStore } from "@/stores/insights-store"
import { useNoteStore } from "@/stores/note-store"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  IconFileText,
  IconSearch,
  IconAlertTriangle,
  IconChecklist,
  IconPhoto,
} from "@tabler/icons-react"
import { InlineCommentPopover } from "./inline-comment-popover"

export function InsightsContainer() {
  const summary = useInsightsStore((s) => s.summary)
  const rawKeyFindings = useInsightsStore((s) => s.keyFindings)
  const rawRedFlags = useInsightsStore((s) => s.redFlags)
  const keyFindings = Array.isArray(rawKeyFindings) ? rawKeyFindings : []
  const redFlags = Array.isArray(rawRedFlags) ? rawRedFlags : []
  const checklistItems = useInsightsStore((s) => s.checklistItems)
  const isProcessing = useInsightsStore((s) => s.isProcessing)
  const toggleChecklistItem = useInsightsStore((s) => s.toggleChecklistItem)
  const notes = useNoteStore((s) => s.notes)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const pendingComments = useInsightsStore((s) => s.pendingComments)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasContent = summary || keyFindings.length > 0 || redFlags.length > 0
  const checkedCount = checklistItems.filter((item) => item.isChecked).length
  const toastIdRef = useRef<string | number | null>(null)

  // Toast lifecycle for insights update
  useEffect(() => {
    if (isProcessing && hasContent) {
      toastIdRef.current = toast.loading("AI is updating insights...", {
        description: "Analyzing latest conversation data",
        duration: Infinity,
        position: "bottom-center",
      })
    } else if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current)
      toastIdRef.current = null
    }
  }, [isProcessing, hasContent])

  // Cleanup toast on unmount
  useEffect(() => {
    return () => {
      if (toastIdRef.current !== null) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [])

  // Collect all uploaded images from notes
  const uploadedImages = notes.flatMap((note) =>
    (note.imageUrls || []).map((url) => ({
      url,
      noteId: note.id,
      noteContent: note.content,
      createdAt: note.createdAt,
    }))
  )

  return (
    <div ref={containerRef} data-tour="insights-panel" className={`space-y-6 ${isProcessing && hasContent ? "animate-breathe insights-shimmer-overlay" : ""}`}>
      <h1 className="sr-only">Live Insights</h1>
      {isProcessing && !hasContent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Analyzing conversation...
        </div>
      )}


      {/* Summary */}
      <section data-section="summary">
        <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
          <IconFileText className="size-4 text-blue-500" />
          Summary
        </h3>
        {summary ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">
            Summary will appear here as the conversation progresses...
          </p>
        )}
      </section>

      {/* Key Findings */}
      <section data-section="keyFindings">
        <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
          <IconSearch className="size-4 text-emerald-500" />
          Key Findings
          {Array.isArray(keyFindings) && keyFindings.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {keyFindings.length}
            </Badge>
          )}
        </h3>
        {Array.isArray(keyFindings) && keyFindings.length > 0 ? (
          <ul className="space-y-1.5">
            {keyFindings.map((finding) => (
              <li
                key={finding}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {finding}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">
            Key findings will be identified as the conversation progresses...
          </p>
        )}
      </section>

      {/* Red Flags */}
      {Array.isArray(redFlags) && redFlags.length > 0 && (
        <section data-section="redFlags">
          <h3 className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 mb-2">
            <IconAlertTriangle className="size-4" />
            Red Flags
            <Badge variant="destructive" className="text-[10px]">
              {redFlags.length}
            </Badge>
          </h3>
          <ul className="space-y-1.5">
            {redFlags.map((flag) => (
              <li
                key={flag}
                className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {flag}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Checklist */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
          <IconChecklist className="size-4 text-violet-500" />
          Checklist
          {checklistItems.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {checkedCount}/{checklistItems.length}
            </Badge>
          )}
        </h3>
        {checklistItems.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 italic">
            Checklist items will appear as the AI identifies action items...
          </p>
        ) : (
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2">
                <Checkbox
                  id={item.id}
                  checked={item.isChecked}
                  onCheckedChange={() => toggleChecklistItem(item.id)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={item.id}
                  className={`text-sm cursor-pointer ${item.isChecked
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                    }`}
                >
                  {item.label}
                  {item.isAutoChecked && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground/60">
                      (auto)
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Imaging Uploads */}
      {uploadedImages.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 text-sm font-medium mb-2">
            <IconPhoto className="size-4 text-amber-500" />
            Imaging Uploads
            <Badge variant="secondary" className="text-[10px]">
              {uploadedImages.length}
            </Badge>
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
            {uploadedImages.map((img, i) => (
              <button
                key={`${img.noteId}-${i}`}
                onClick={() => setSelectedImage(img.url)}
                className="group relative aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-primary/50 transition-all max-w-16"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.noteContent || "Medical image"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Pending Comments Indicator */}
      {pendingComments.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          {pendingComments.length} comment{pendingComments.length > 1 ? "s" : ""} pending...
        </div>
      )}

      {/* Inline Comment Popover */}
      <InlineCommentPopover containerRef={containerRef} />

      {/* Image Lightbox */}
      <Dialog
        open={!!selectedImage}
        onOpenChange={() => setSelectedImage(null)}
      >
        <DialogContent className="max-w-[95vw] md:max-w-3xl p-2">
          <DialogTitle className="sr-only">Medical Image</DialogTitle>
          {selectedImage && (
            <img // eslint-disable-line @next/next/no-img-element
              src={selectedImage}
              alt="Medical image"
              className="w-full h-auto rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
