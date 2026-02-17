"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useNoteStore, type NoteEntry } from "@/stores/note-store"
import { cn } from "@/lib/utils"
import { ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import { classifyAllEntries } from "@/hooks/use-single-speaker-classification"
import { ModeSelector } from "./mode-selector"
import type { Speaker, DiagnosticKeyword, TranscriptEntry } from "@/types/session"

type TimelineItem =
  | { type: "transcript"; data: TranscriptEntry }
  | { type: "note"; data: NoteEntry }

function formatTime(createdAt: string) {
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
  const isAiResponding = useConsultationModeStore((s) => s.isAiResponding)
  const consultationMode = useConsultationModeStore((s) => s.mode)
  const singleSpeakerDetected = useTranscriptStore((s) => s.singleSpeakerDetected)
  const singleSpeakerPromptDismissed = useTranscriptStore((s) => s.singleSpeakerPromptDismissed)
  const singleSpeakerMode = useTranscriptStore((s) => s.singleSpeakerMode)
  const classifyingEntries = useTranscriptStore((s) => s.classifyingEntries)
  const activeSession = useSessionStore((s) => s.activeSession)
  const hydratingSessionId = useSessionStore((s) => s.hydratingSessionId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottom = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const isIdentified = identificationStatus === "identified"
  const isTranscriptHydrating =
    !!activeSession && hydratingSessionId === activeSession.id

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
            isTranscriptHydrating ? (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Loading transcript history...
                </p>
              </div>
            ) : (
              <ModeSelector />
            )
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
                          <img // eslint-disable-line @next/next/no-img-element
                            key={j}
                            src={url}
                            alt={`Medical image ${j + 1} from note`}
                            className="h-12 w-12 rounded object-cover border"
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 font-mono mt-1 block">
                      {formatTime(note.createdAt)}
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

            const isDarkBubble = false

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
                    align === "right" && "bg-primary/10 text-foreground backdrop-blur-sm border border-primary/15",
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
                            ? "text-primary/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {speakerLabel(entry.speaker)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-mono",
                          align === "right"
                            ? "text-muted-foreground/60"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {formatTime(entry.createdAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {isAiResponding && consultationMode === "ai-doctor" && (
            <div className="flex justify-end mt-2">
              <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-tr-sm bg-primary/10 backdrop-blur-sm border border-primary/15">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex mt-1 opacity-60",
              !interimText && "hidden",
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
                      ? "bg-primary/10 text-foreground backdrop-blur-sm border border-primary/15 rounded-tr-sm"
                      : "bg-muted/50"
              )}
            >
              <p className="text-sm leading-relaxed italic">{interimText}</p>
              <span className="text-[10px] text-muted-foreground/60">
                typing...
              </span>
            </div>
          </div>

          {/* Single-speaker notification banner */}
          {consultationMode !== "ai-doctor" && singleSpeakerDetected && !singleSpeakerPromptDismissed && !singleSpeakerMode && (
            <div className="flex justify-center mt-4">
              <div className="w-full max-w-sm rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                      Only one speaker detected
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                      Are you playing both doctor and patient roles?
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={classifyingEntries}
                        className="h-7 text-xs"
                        onClick={async () => {
                          const store = useTranscriptStore.getState()
                          const session = useSessionStore.getState().activeSession
                          const aiModel = useSettingsStore.getState().aiModel.speakerIdModel
                          if (!session?.id) return
                          store.activateSingleSpeakerMode()
                          try {
                            await classifyAllEntries(store.entries, session.id, aiModel)
                          } catch (error) {
                            console.error("Failed to classify entries:", error)
                          }
                        }}
                      >
                        {classifyingEntries ? "Classifying..." : "Yes, I am"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => {
                          useTranscriptStore.getState().dismissSingleSpeakerPrompt()
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={cn("flex justify-center mt-3", !classifyingEntries && "hidden")}>
            <span className="text-[10px] px-3 py-1 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
              Classifying roles...
            </span>
          </div>

          <div className={cn("flex justify-center mt-3", identificationStatus !== "identifying" && "hidden")}>
            <span className="text-[10px] px-3 py-1 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
              Identifying speakers...
            </span>
          </div>

          <div className={cn("flex justify-center mt-3", highlightStatus !== "loading" && "hidden")}>
            <span className="text-[10px] px-3 py-1 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
              Analyzing diagnostic keywords...
            </span>
          </div>
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 border shadow-md backdrop-blur-sm transition-opacity hover:bg-background"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
