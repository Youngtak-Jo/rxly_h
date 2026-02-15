"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { v4 as uuid } from "uuid"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useInsightsStore } from "@/stores/insights-store"
import { IconMessagePlus, IconX } from "@tabler/icons-react"
import type { InsightSection } from "@/types/insights"

interface PopoverState {
  selectedText: string
  section: InsightSection
  top: number
  left: number
}

function findSection(node: Node | null): InsightSection | null {
  let el = node instanceof HTMLElement ? node : node?.parentElement
  while (el) {
    const section = el.getAttribute("data-section")
    if (section) return section as InsightSection
    el = el.parentElement
  }
  return null
}

const HIGHLIGHT_NAME = "inline-comment-selection"

/** Inject ::highlight() styles at runtime (build tools can't parse this pseudo-element). */
let styleInjected = false
function ensureHighlightStyle(): void {
  if (styleInjected || typeof document === "undefined") return
  styleInjected = true
  const style = document.createElement("style")
  style.textContent = [
    `::highlight(${HIGHLIGHT_NAME}){background-color:oklch(0.52 0.14 40/0.18)}`,
    `.dark ::highlight(${HIGHLIGHT_NAME}){background-color:oklch(0.72 0.14 40/0.25)}`,
  ].join("\n")
  document.head.appendChild(style)
}

/** Apply a CSS Custom Highlight to the given range (no DOM mutation). */
function applyHighlight(range: Range): void {
  if (typeof CSS === "undefined" || !("highlights" in CSS)) return
  ensureHighlightStyle()
  clearHighlight()
  const highlight = new Highlight(range)
  CSS.highlights.set(HIGHLIGHT_NAME, highlight)
}

/** Remove the CSS Custom Highlight. */
function clearHighlight(): void {
  if (typeof CSS !== "undefined" && "highlights" in CSS) {
    CSS.highlights.delete(HIGHLIGHT_NAME)
  }
}

export function InlineCommentPopover({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [comment, setComment] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOpenRef = useRef(false)

  const close = useCallback(() => {
    clearHighlight()
    isOpenRef.current = false
    setPopover(null)
    setComment("")
  }, [])

  // Clean up highlight on unmount (e.g., tab switch)
  useEffect(() => {
    return () => clearHighlight()
  }, [])

  // Shared selection processing logic (used by both mouseup and selectionchange)
  const processSelection = useCallback(() => {
    // Don't process selections while popover is open (e.g., textarea cursor)
    if (isOpenRef.current) return

    const container = containerRef.current
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    // Verify the selection is within our container
    if (
      container &&
      selection.anchorNode &&
      !container.contains(selection.anchorNode)
    ) {
      return
    }

    const text = selection.toString().trim()
    if (!text) return

    const anchorSection = findSection(selection.anchorNode)
    const focusSection = findSection(selection.focusNode)

    // Ignore cross-section selections or selections outside insight sections
    if (!anchorSection || !focusSection || anchorSection !== focusSection)
      return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Apply CSS Highlight API visual cue (no DOM mutation)
    try {
      const clonedRange = range.cloneRange()
      applyHighlight(clonedRange)
    } catch {
      // If highlight API fails, proceed without visual highlight
    }

    // Clear native selection — the CSS highlight now provides the visual cue
    selection.removeAllRanges()

    isOpenRef.current = true
    setPopover({
      selectedText: text,
      section: anchorSection,
      top: rect.bottom + 8,
      left: Math.max(8, rect.left + rect.width / 2 - 140),
    })
    setComment("")
  }, [containerRef])

  // Desktop: detect text selection via mouseup
  const handleMouseUp = useCallback(() => {
    if (isOpenRef.current) return
    // Small delay to let the selection finalize
    requestAnimationFrame(() => {
      processSelection()
    })
  }, [processSelection])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("mouseup", handleMouseUp)
    return () => container.removeEventListener("mouseup", handleMouseUp)
  }, [containerRef, handleMouseUp])

  // Mobile: detect text selection via selectionchange (handles long-press selection)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleSelectionChange = () => {
      if (isOpenRef.current) return // Skip when popover is open

      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Debounce to wait for selection handles to settle
      debounceRef.current = setTimeout(() => {
        processSelection()
      }, 400)
    }

    document.addEventListener("selectionchange", handleSelectionChange)

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange)
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [processSelection, containerRef])

  // Close on Escape or click/touch outside
  useEffect(() => {
    if (!popover) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    // Use setTimeout to avoid the same click/touch that opens the popover from closing it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      clearTimeout(timer)
    }
  }, [popover, close])

  // Auto-focus textarea when popover opens (skip on touch devices to preserve selection)
  useEffect(() => {
    if (popover) {
      const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
      if (!isTouch) {
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    }
  }, [popover])

  const handleSubmit = () => {
    if (!popover || !comment.trim()) return

    useInsightsStore.getState().addComment({
      id: uuid(),
      section: popover.section,
      selectedText: popover.selectedText,
      comment: comment.trim(),
      createdAt: Date.now(),
    })

    // Trigger immediate re-analysis
    useInsightsStore.getState()._noteTrigger?.()

    toast.success("Comment sent", {
      description: "Insights will update shortly",
      position: "bottom-center",
    })
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!popover) return null

  // Clamp position to viewport
  const top = Math.min(popover.top, window.innerHeight - 200)
  const left = Math.min(Math.max(8, popover.left), window.innerWidth - 288)

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-[280px] rounded-lg border bg-popover p-3 shadow-lg animate-in fade-in-0 zoom-in-95"
      style={{ top, left }}
    >
      {/* Selected text preview */}
      <div className="flex items-start gap-1.5 mb-2">
        <IconMessagePlus className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground line-clamp-2 italic">
          &ldquo;{popover.selectedText}&rdquo;
        </p>
      </div>

      {/* Comment input */}
      <Textarea
        ref={textareaRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add your comment..."
        className="min-h-[56px] max-h-[120px] resize-none text-sm"
        rows={2}
      />

      {/* Actions */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+Enter to send
        </span>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={close} className="h-7 px-2 text-xs">
            <IconX className="size-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!comment.trim()}
            className="h-7 px-3 text-xs"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
