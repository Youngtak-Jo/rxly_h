"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { RecordingSegmentPlayer } from "@/components/consultation/transcript/recording-segment-player"
import { useRecordingSegmentStore } from "@/stores/recording-segment-store"
import type { RecordingSegmentSummary } from "@/lib/transcript-playback"
import { ChevronLeft, ChevronRight, FileAudio } from "lucide-react"

interface PendingSeekTarget {
  segmentId: string
  timeSeconds: number
  revision: number
}

interface RecordingSegmentsDockProps {
  selectedSegmentId: string | null
  followLatest: boolean
  onSelectSegment: (id: string) => void
  seekTarget: PendingSeekTarget | null
  segmentSummaries: Map<string, RecordingSegmentSummary>
}

export function RecordingSegmentsDock({
  selectedSegmentId,
  followLatest,
  onSelectSegment,
  seekTarget,
  segmentSummaries,
}: RecordingSegmentsDockProps) {
  const t = useTranslations("TranscriptViewer")
  const segments = useRecordingSegmentStore((state) => state.segments)

  if (segments.length === 0) {
    return null
  }

  const shouldFollowLatest =
    followLatest ||
    !selectedSegmentId ||
    !segments.some((segment) => segment.id === selectedSegmentId)

  const selectedIndex = shouldFollowLatest
    ? 0
    : Math.max(
        0,
        segments.findIndex((segment) => segment.id === selectedSegmentId)
      )
  const selectedSegment = segments[selectedIndex] || null

  const paginationLabel = t("recordingsPosition", {
    current: selectedIndex + 1,
    total: segments.length,
  })

  const showPagination = segments.length > 1

  const goToIndex = (nextIndex: number) => {
    const nextSegment = segments[nextIndex]
    if (!nextSegment) return

    onSelectSegment(nextSegment.id)
  }

  return (
    <div className="-mb-4 -mx-4 shrink-0 border-t bg-background/95 backdrop-blur-sm">
      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <FileAudio className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">{t("recordingsTitle")}</h4>
          </div>

          {showPagination && (
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => goToIndex(selectedIndex - 1)}
                disabled={selectedIndex === 0}
                aria-label={t("recordingsPrevious")}
                title={t("recordingsPrevious")}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground">
                {paginationLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => goToIndex(selectedIndex + 1)}
                disabled={selectedIndex >= segments.length - 1}
                aria-label={t("recordingsNext")}
                title={t("recordingsNext")}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </div>

        {selectedSegment && (
          <RecordingSegmentPlayer
            key={`${selectedSegment.id}:${selectedSegment.status}:${selectedSegment.audioUrl ?? ""}:${selectedSegment.localObjectUrl ?? ""}`}
            segment={selectedSegment}
            seekTarget={seekTarget}
            summary={segmentSummaries.get(selectedSegment.id)}
          />
        )}
      </div>
    </div>
  )
}
