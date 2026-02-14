"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useRecordingStore } from "@/stores/recording-store"
import { cn } from "@/lib/utils"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { RecordingControls } from "./recording-controls"
import { TranscriptViewer } from "./transcript-viewer"
import type { Speaker } from "@/types/session"

function speakerLabel(speaker: Speaker) {
  return speaker === "DOCTOR" ? "Dr" : speaker === "PATIENT" ? "Pt" : "?"
}

export function MobileTranscriptSection() {
  const [expanded, setExpanded] = useState(false)
  const entries = useTranscriptStore((s) => s.entries)
  const interimText = useTranscriptStore((s) => s.interimText)
  const { isRecording } = useRecordingStore()

  const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null

  return (
    <div className="border-b bg-background">
      <RecordingControls />

      {/* Collapsed: show latest transcript entry */}
      {!expanded && (lastEntry || interimText) && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-4 py-2 flex items-center gap-2 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            {interimText ? (
              <p className="text-sm text-muted-foreground italic truncate">
                {interimText}
              </p>
            ) : lastEntry ? (
              <p className="text-sm truncate">
                <span className="text-muted-foreground font-medium mr-1.5">
                  {speakerLabel(lastEntry.speaker)}
                </span>
                {lastEntry.text}
              </p>
            ) : null}
          </div>
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      )}

      {/* Empty state hint */}
      {!expanded && !lastEntry && !interimText && isRecording && (
        <div className="px-4 py-2 text-center">
          <p className="text-xs text-muted-foreground/50 italic">
            Listening...
          </p>
        </div>
      )}

      {/* Expanded: full transcript viewer */}
      {expanded && (
        <div className="relative">
          <div className={cn("max-h-[50vh] overflow-hidden")}>
            <TranscriptViewer />
          </div>
          <div className="flex justify-center border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
              className="w-full rounded-none h-8 text-xs text-muted-foreground gap-1"
            >
              <IconChevronUp className="size-3.5" />
              Collapse
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
