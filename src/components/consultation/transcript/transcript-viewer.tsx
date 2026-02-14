"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useNoteStore, type NoteEntry } from "@/stores/note-store"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import type { Speaker, DiagnosticKeyword, TranscriptEntry } from "@/types/session"

type TimelineItem =
  | { type: "transcript"; data: TranscriptEntry }
  | { type: "note"; data: NoteEntry }

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatNoteTime(createdAt: string) {
  const date = new Date(createdAt)
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
}

function speakerLabel(speaker: Speaker) {
  return speaker === "DOCTOR" ? "Dr" : speaker === "PATIENT" ? "Pt" : "?"
}

const HIGHLIGHT_COLORS: Record<
  DiagnosticKeyword["category"],
  { light: string; dark: string }
> = {
  symptom: {
    light: "bg-red-100 text-red-900",
    dark: "bg-red-500/30 text-red-100",
  },
  diagnosis: {
    light: "bg-blue-100 text-blue-900",
    dark: "bg-blue-500/30 text-blue-100",
  },
  medication: {
    light: "bg-green-100 text-green-900",
    dark: "bg-green-500/30 text-green-100",
  },
  finding: {
    light: "bg-amber-100 text-amber-900",
    dark: "bg-amber-500/30 text-amber-100",
  },
  vital: {
    light: "bg-purple-100 text-purple-900",
    dark: "bg-purple-500/30 text-purple-100",
  },
}

interface TextSegment {
  text: string
  keyword: DiagnosticKeyword | null
}

function highlightText(
  text: string,
  keywords: DiagnosticKeyword[]
): TextSegment[] {
  if (!text || keywords.length === 0) return [{ text: text ?? "", keyword: null }]

  const matches: { start: number; end: number; keyword: DiagnosticKeyword }[] =
    []

  for (const kw of keywords) {
    const lowerText = text.toLowerCase()
    const lowerPhrase = kw.phrase.toLowerCase()
    let searchFrom = 0

    while (searchFrom < lowerText.length) {
      const idx = lowerText.indexOf(lowerPhrase, searchFrom)
      if (idx === -1) break
      matches.push({ start: idx, end: idx + kw.phrase.length, keyword: kw })
      searchFrom = idx + 1
    }
  }

  if (matches.length === 0) return [{ text, keyword: null }]

  // Sort by start position, then prefer longer matches
  matches.sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start)
  )

  // Remove overlapping matches (keep first/longest at each position)
  const resolved: typeof matches = []
  let lastEnd = 0
  for (const m of matches) {
    if (m.start >= lastEnd) {
      resolved.push(m)
      lastEnd = m.end
    }
  }

  // Build segments
  const segments: TextSegment[] = []
  let cursor = 0
  for (const m of resolved) {
    if (m.start > cursor) {
      segments.push({ text: text.slice(cursor, m.start), keyword: null })
    }
    segments.push({ text: text.slice(m.start, m.end), keyword: m.keyword })
    cursor = m.end
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), keyword: null })
  }

  return segments
}

const SCROLL_THRESHOLD = 50

export function TranscriptViewer() {
  const { entries, interimText, interimSpeaker } = useTranscriptStore()
  const identificationStatus = useTranscriptStore(
    (s) => s.identificationStatus
  )
  const diagnosticKeywords = useTranscriptStore((s) => s.diagnosticKeywords)
  const highlightStatus = useTranscriptStore((s) => s.highlightStatus)
  const notes = useNoteStore((s) => s.notes)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottom = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const isIdentified = identificationStatus === "identified"

  // Merge transcript entries and notes into a unified timeline
  const timeline = useMemo<TimelineItem[]>(() => {
    const transcriptItems: TimelineItem[] = entries.map((e) => ({
      type: "transcript",
      data: e,
    }))
    const noteItems: TimelineItem[] = notes.map((n) => ({
      type: "note",
      data: n,
    }))
    const all = [...transcriptItems, ...noteItems]

    all.sort((a, b) => {
      const timeA = new Date(a.data.createdAt).getTime()
      const timeB = new Date(b.data.createdAt).getTime()
      return timeA - timeB
    })

    return all
  }, [entries, notes])

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
  }, [entries, interimText, notes])

  // Track previous transcript item for speaker grouping
  const getPrevTranscriptEntry = (currentIndex: number) => {
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (timeline[i].type === "transcript") {
        return timeline[i].data as TranscriptEntry
      }
    }
    return null
  }

  return (
    <div data-tour="transcript-viewer" className="relative h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        <div className="p-4 flex flex-col">
          {timeline.length === 0 && !interimText && (
            <p className="text-sm text-muted-foreground/50 italic text-center py-8">
              Transcript will appear here when recording starts...
            </p>
          )}

          {timeline.map((item, i) => {
            if (item.type === "note") {
              const note = item.data as NoteEntry
              return (
                <div key={`note-${note.id}`} className="mt-3">
                  <div className="border-l-2 border-primary bg-muted/50 rounded-r-lg px-3 py-2">
                    {note.content && (
                      <p className="text-sm leading-relaxed">{note.content}</p>
                    )}
                    {note.imageUrls && note.imageUrls.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {note.imageUrls.map((url, j) => (
                          <img
                            key={j}
                            src={url}
                            alt=""
                            className="h-12 w-12 rounded object-cover border"
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 font-mono mt-1 block">
                      {formatNoteTime(note.createdAt)}
                    </span>
                  </div>
                </div>
              )
            }

            // Transcript entry
            const entry = item.data as TranscriptEntry
            const prevTranscript = getPrevTranscriptEntry(i)
            const isSameSpeaker = prevTranscript?.speaker === entry.speaker
            const showMeta = !isSameSpeaker

            const align = !isIdentified
              ? "center"
              : entry.speaker === "PATIENT"
                ? "left"
                : entry.speaker === "DOCTOR"
                  ? "right"
                  : "center"

            const isDarkBubble = align === "right"

            return (
              <div
                key={entry.id}
                className={cn(
                  "flex",
                  align === "left" && "justify-start",
                  align === "right" && "justify-end",
                  align === "center" && "justify-center",
                  isSameSpeaker ? "mt-1" : i === 0 ? "mt-0" : "mt-3"
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] px-3 py-2",
                    // bubble shapes
                    align === "left" && "rounded-2xl rounded-tl-sm",
                    align === "right" && "rounded-2xl rounded-tr-sm",
                    align === "center" && "rounded-2xl",
                    // colors
                    align === "left" && "bg-muted",
                    align === "right" && "bg-primary text-primary-foreground",
                    align === "center" && "bg-muted/50"
                  )}
                >
                  <p className="text-sm leading-relaxed">
                    {diagnosticKeywords.length > 0
                      ? highlightText(entry.text, diagnosticKeywords).map(
                          (seg, j) =>
                            seg.keyword ? (
                              <mark
                                key={j}
                                className={cn(
                                  "rounded px-0.5 -mx-0.5",
                                  isDarkBubble
                                    ? HIGHLIGHT_COLORS[seg.keyword.category]
                                        .dark
                                    : HIGHLIGHT_COLORS[seg.keyword.category]
                                        .light
                                )}
                                title={seg.keyword.category}
                              >
                                {seg.text}
                              </mark>
                            ) : (
                              <span key={j}>{seg.text}</span>
                            )
                        )
                      : entry.text}
                  </p>
                  {showMeta && (
                    <div
                      className={cn(
                        "flex items-center gap-1.5 mt-1",
                        align === "right" ? "justify-end" : "justify-start"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] font-medium",
                          align === "right"
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        )}
                      >
                        {speakerLabel(entry.speaker)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono",
                          align === "right"
                            ? "text-primary-foreground/40"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {formatTime(entry.startTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {interimText && (
            <div
              className={cn(
                "flex mt-1 opacity-60",
                !isIdentified
                  ? "justify-center"
                  : interimSpeaker === "PATIENT"
                    ? "justify-start"
                    : interimSpeaker === "DOCTOR"
                      ? "justify-end"
                      : "justify-center"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] px-3 py-2 rounded-2xl",
                  !isIdentified
                    ? "bg-muted/50"
                    : interimSpeaker === "PATIENT"
                      ? "bg-muted rounded-tl-sm"
                      : interimSpeaker === "DOCTOR"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/50"
                )}
              >
                <p className="text-sm leading-relaxed italic">{interimText}</p>
                <span className="text-[10px] text-muted-foreground/60">
                  typing...
                </span>
              </div>
            </div>
          )}

          {identificationStatus === "identifying" && (
            <div className="flex justify-center mt-3">
              <span className="text-[10px] px-3 py-1 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
                Identifying speakers...
              </span>
            </div>
          )}

          {highlightStatus === "loading" && (
            <div className="flex justify-center mt-3">
              <span className="text-[10px] px-3 py-1 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
                Analyzing diagnostic keywords...
              </span>
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
