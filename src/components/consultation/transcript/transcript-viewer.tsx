"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useNoteStore, type NoteEntry } from "@/stores/note-store"
import { useRecordingSegmentStore } from "@/stores/recording-segment-store"
import { cn } from "@/lib/utils"
import { ChevronDown, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import { classifyAllEntries } from "@/hooks/use-single-speaker-classification"
import {
  buildRecordingSegmentSummaries,
  resolveEntryPlaybackTarget,
} from "@/lib/transcript-playback"
import { ModeSelector } from "./mode-selector"
import type { TranscriptEntry } from "@/types/session"
import { NoteBubble } from "./note-bubble"
import { RecordingSegmentsDock } from "./recording-segments-dock"
import { TranscriptBubble } from "./transcript-bubble"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"

type TimelineItem =
  | { type: "transcript"; data: TranscriptEntry }
  | { type: "note"; data: NoteEntry }

export function TranscriptViewer() {
  const t = useTranslations("TranscriptViewer")
  const { entries, interimText, interimSpeaker } = useTranscriptStore()
  const recordingSegments = useRecordingSegmentStore((s) => s.segments)
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

  const virtuosoRef = useRef<VirtuosoHandle>(null)
  const isAtBottom = useRef(true)
  const seekRevisionRef = useRef(0)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [followLatest, setFollowLatest] = useState(true)
  const [pendingSeekTarget, setPendingSeekTarget] = useState<{
    segmentId: string
    timeSeconds: number
    revision: number
  } | null>(null)

  const isIdentified = identificationStatus === "identified"
  const isTranscriptHydrating =
    !!activeSession && hydratingSessionId === activeSession.id

  const segmentSummaries = useMemo(() => {
    return buildRecordingSegmentSummaries(entries, recordingSegments)
  }, [entries, recordingSegments])

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

  const scrollToBottom = useCallback(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: "smooth" })
    }
    isAtBottom.current = true
    setShowScrollButton(false)
  }, [])

  // Auto-scroll when new items arrive if we are at bottom
  useEffect(() => {
    if (isAtBottom.current && virtuosoRef.current) {
      // Delay slightly so the DOM update (especially footer height) completes
      const timeoutId = setTimeout(() => {
        if (virtuosoRef.current) {
          virtuosoRef.current.scrollTo({ top: Number.MAX_SAFE_INTEGER, behavior: "auto" })
        }
      }, 50)
      return () => clearTimeout(timeoutId)
    }
  }, [timeline.length, interimText, singleSpeakerDetected, classifyingEntries, identificationStatus, highlightStatus])

  const handleSelectSegment = useCallback((segmentId: string) => {
    setSelectedSegmentId(segmentId)
    setFollowLatest(recordingSegments[0]?.id === segmentId)
  }, [recordingSegments])

  const handleSeekEntry = useCallback((entry: TranscriptEntry) => {
    const target = resolveEntryPlaybackTarget(entry, recordingSegments)
    if (!target) return

    seekRevisionRef.current += 1
    setSelectedSegmentId(target.segmentId)
    setFollowLatest(false)
    setPendingSeekTarget({
      segmentId: target.segmentId,
      timeSeconds: target.timeSeconds,
      revision: seekRevisionRef.current,
    })
  }, [recordingSegments])

  const renderItem = useCallback((index: number, item: TimelineItem) => {
    if (item.type === "note") {
      return <NoteBubble note={item.data as NoteEntry} />
    }

    const entry = item.data as TranscriptEntry
    const playbackTarget = resolveEntryPlaybackTarget(entry, recordingSegments)
    // Find previous transcript for continuous speech grouping
    let prevSpeaker = null
    for (let i = index - 1; i >= 0; i--) {
      if (timeline[i].type === "transcript") {
        prevSpeaker = (timeline[i].data as TranscriptEntry).speaker
        break
      }
    }

    return (
      <TranscriptBubble
        entry={entry}
        prevSpeaker={prevSpeaker}
        isIdentified={isIdentified}
        diagnosticKeywords={diagnosticKeywords}
        isFirst={index === 0}
        isSeekable={!!playbackTarget}
        onSeek={playbackTarget ? () => handleSeekEntry(entry) : undefined}
      />
    )
  }, [diagnosticKeywords, handleSeekEntry, isIdentified, recordingSegments, timeline])

  return (
    <div data-tour="transcript-viewer" className="relative h-full flex flex-col p-4">
      {timeline.length === 0 && !interimText && (
        isTranscriptHydrating ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center shrink-0">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("loadingHistory")}
            </p>
          </div>
        ) : (
          <div className="shrink-0 mb-4">
            <ModeSelector />
          </div>
        )
      )}

      <div className="flex-1 min-h-0 relative">
        <Virtuoso
          ref={virtuosoRef}
          data={timeline}
          itemContent={renderItem}
          initialTopMostItemIndex={{ index: "LAST", align: "end" }}
          followOutput={(isAtBottom) => isAtBottom ? "auto" : false}
          atBottomStateChange={(bottom: boolean) => {
            isAtBottom.current = bottom
            setShowScrollButton(!bottom)
          }}
          className="h-full w-full"
          components={{
            Footer: () => (
              <div className="pb-4">
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
                      {t("typing")}
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
                            {t("singleSpeakerDetectedTitle")}
                          </p>
                          <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                            {t("singleSpeakerDetectedDescription")}
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
                              {classifyingEntries
                                ? t("classifyingRoles")
                                : t("singleSpeakerConfirm")}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => {
                                useTranscriptStore.getState().dismissSingleSpeakerPrompt()
                              }}
                            >
                              {t("dismiss")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={cn("flex justify-center mt-3", !classifyingEntries && "hidden")}>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
                    {t("classifyingRoles")}
                  </span>
                </div>

                <div className={cn("flex justify-center mt-3", identificationStatus !== "identifying" && "hidden")}>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
                    {t("identifyingSpeakers")}
                  </span>
                </div>

                <div className={cn("flex justify-center mt-3", highlightStatus !== "loading" && "hidden")}>
                  <span className="text-[10px] px-3 py-1 rounded-full bg-muted/50 text-muted-foreground animate-pulse">
                    {t("analyzingKeywords")}
                  </span>
                </div>
              </div>
            )
          }}
        />

        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 border shadow-md backdrop-blur-sm transition-opacity hover:bg-background"
            aria-label={t("scrollToLatest")}
            title={t("scrollToLatest")}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <RecordingSegmentsDock
        selectedSegmentId={selectedSegmentId}
        followLatest={followLatest}
        onSelectSegment={handleSelectSegment}
        seekTarget={pendingSeekTarget}
        segmentSummaries={segmentSummaries}
      />
    </div>
  )
}
