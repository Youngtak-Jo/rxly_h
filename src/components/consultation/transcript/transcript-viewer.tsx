"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useTranscriptStore } from "@/stores/transcript-store"

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function TranscriptViewer() {
  const { entries, interimText, interimSpeaker } = useTranscriptStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries, interimText])

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
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
                  entry.speaker === "DOCTOR" ? "default" : "secondary"
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
      </div>
    </ScrollArea>
  )
}
