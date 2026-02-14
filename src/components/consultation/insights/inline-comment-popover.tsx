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

export function InlineCommentPopover({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [comment, setComment] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const close = useCallback(() => {
    setPopover(null)
    setComment("")
  }, [])

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    // Small delay to let the selection finalize
    requestAnimationFrame(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) return

      const text = selection.toString().trim()
      if (!text) return

      const anchorSection = findSection(selection.anchorNode)
      const focusSection = findSection(selection.focusNode)

      // Ignore cross-section selections or selections outside insight sections
      if (!anchorSection || !focusSection || anchorSection !== focusSection)
        return

      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()

      setPopover({
        selectedText: text,
        section: anchorSection,
        top: rect.bottom + 8,
        left: Math.max(8, rect.left + rect.width / 2 - 140),
      })
      setComment("")
    })
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("mouseup", handleMouseUp)
    return () => container.removeEventListener("mouseup", handleMouseUp)
  }, [containerRef, handleMouseUp])

  // Close on Escape or click outside
  useEffect(() => {
    if (!popover) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        close()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    // Use setTimeout to avoid the same click that opens the popover from closing it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
      clearTimeout(timer)
    }
  }, [popover, close])

  // Auto-focus textarea when popover opens
  useEffect(() => {
    if (popover) {
      setTimeout(() => textareaRef.current?.focus(), 50)
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
        <span className="text-[10px] text-muted-foreground">
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
