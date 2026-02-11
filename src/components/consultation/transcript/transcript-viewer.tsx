"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { useTranscriptStore } from "@/stores/transcript-store"
import { ChevronDown } from "lucide-react"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

const SCROLL_THRESHOLD = 50

export function TranscriptViewer() {
  const { entries, interimText, interimSpeaker } = useTranscriptStore()
  const identificationStatus = useTranscriptStore(
    (s) => s.identificationStatus
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottom = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const atBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_THRESHOLD
    isAtBottom.current = atBottom
    setShowScrollButton(!atBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    isAtBottom.current = true
    setShowScrollButton(false)
  }, [])

  useEffect(() => {
    if (scrollRef.current && isAtBottom.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries, interimText])

  return (
    <div className="relative h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        <div className="p-4 space-y-3">
          {entries.length === 0 && !interimText && (
            <p className="text-sm text-muted-foreground/50 italic text-center py-8">
              Transcript will appear here when recording starts...
            </p>
          )}

          {entries.map((entry) => (
            <div key={entry.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    entry.speaker === "DOCTOR"
                      ? "default"
                      : entry.speaker === "PATIENT"
                        ? "secondary"
                        : "outline"
                  }
                  className="text-[10px] px-1.5 py-0"
                >
                  {entry.speaker === "DOCTOR"
                    ? "Dr"
                    : entry.speaker === "PATIENT"
                      ? "Pt"
                      : "?"}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {formatTime(entry.startTime)}
                </span>
              </div>
              <p className="text-sm leading-relaxed pl-1">{entry.text}</p>
            </div>
          ))}

          {interimText && (
            <div className="space-y-1 opacity-60">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {interimSpeaker === "DOCTOR"
                    ? "Dr"
                    : interimSpeaker === "PATIENT"
                      ? "Pt"
                      : "?"}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  typing...
                </span>
              </div>
              <p className="text-sm leading-relaxed pl-1 italic">
                {interimText}
              </p>
            </div>
          )}

          {identificationStatus === "identifying" && (
            <div className="flex justify-center py-1">
              <Badge
                variant="outline"
                className="text-[10px] px-2 py-0.5 text-muted-foreground animate-pulse"
              >
                Identifying speakers...
              </Badge>
            </div>
          )}
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 border shadow-md backdrop-blur-sm transition-opacity hover:bg-background"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
