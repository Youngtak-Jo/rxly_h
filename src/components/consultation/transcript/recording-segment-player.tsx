"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { useLocale, useTimeZone, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatDate } from "@/i18n/format"
import type { RecordingSegmentSummary } from "@/lib/transcript-playback"
import { cn } from "@/lib/utils"
import { logRecordingDiagnostic } from "@/lib/audio-recordings"
import { useRecordingSegmentStore } from "@/stores/recording-segment-store"
import type { RecordingSegmentEntry } from "@/stores/recording-segment-store"
import { LoaderCircle, PauseIcon, PlayIcon } from "lucide-react"

type PlayerState =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "error"
  | "unsupported"

interface RecordingSegmentPlayerProps {
  segment: RecordingSegmentEntry
  seekTarget: {
    segmentId: string
    timeSeconds: number
    revision: number
  } | null
  summary?: RecordingSegmentSummary
}

function formatTime(seconds: number) {
  const clampedSeconds = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(clampedSeconds / 60)
  const secs = clampedSeconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function getSegmentSource(segment: RecordingSegmentEntry) {
  if (segment.status === "unsupported") return null
  return segment.localObjectUrl || segment.audioUrl || null
}

export function RecordingSegmentPlayer({
  segment,
  seekTarget,
  summary,
}: RecordingSegmentPlayerProps) {
  const t = useTranslations("TranscriptViewer")
  const locale = useLocale() as UiLocale
  const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE
  const audioRef = useRef<HTMLAudioElement>(null)
  const metadataLoadedRef = useRef(false)
  const wasPlayingBeforeSeekRef = useRef(false)
  const pendingSeekRef = useRef<{ timeSeconds: number; revision: number } | null>(null)
  const appliedSeekRevisionRef = useRef<number | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState>(() =>
    segment.status === "unsupported"
      ? "unsupported"
      : getSegmentSource(segment)
        ? "idle"
        : "error"
  )
  const [currentTime, setCurrentTime] = useState(0)
  const [metadataDuration, setMetadataDuration] = useState<number | null>(null)

  const source = getSegmentSource(segment)
  const fallbackDurationSeconds =
    segment.durationMs > 0 ? segment.durationMs / 1000 : 0
  const totalDuration = metadataDuration ?? fallbackDurationSeconds
  const isPlaying = playerState === "playing"
  const isLoading = playerState === "loading"
  const isUnsupported =
    playerState === "unsupported" || segment.status === "unsupported"

  const timestampLabel = useMemo(() => {
    return formatDate(segment.startedAt, locale, timeZone, {
      month: locale === "ko" ? "long" : "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }, [locale, segment.startedAt, timeZone])

  const summaryLabel = useMemo(() => {
    if (!summary || summary.utteranceCount <= 0) return null

    const parts = [t("recordingsUtterances", { count: summary.utteranceCount })]

    if (summary.doctorCount > 0) {
      parts.push(t("recordingsSpeakerDoctor", { count: summary.doctorCount }))
    }
    if (summary.patientCount > 0) {
      parts.push(t("recordingsSpeakerPatient", { count: summary.patientCount }))
    }
    if (summary.unknownCount > 0) {
      parts.push(t("recordingsSpeakerUnknown", { count: summary.unknownCount }))
    }

    return parts.join(" · ")
  }, [summary, t])

  const applyPausedSeek = useCallback((requestedSeconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    const maxSeconds =
      Number.isFinite(audio.duration) && !Number.isNaN(audio.duration)
        ? audio.duration
        : totalDuration
    const nextTime =
      maxSeconds > 0
        ? Math.min(Math.max(requestedSeconds, 0), maxSeconds)
        : Math.max(requestedSeconds, 0)

    audio.pause()
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
    setPlayerState("paused")
  }, [totalDuration])

  const handlePlaybackFailure = useCallback((reason: string) => {
    setPlayerState("unsupported")
    logRecordingDiagnostic("recording_playback_error", {
      chosenMime: segment.mimeType,
      blobType: segment.blob?.type ?? null,
      fileSizeBytes: segment.fileSizeBytes,
      sessionId: segment.sessionId,
      metadataLoaded: metadataLoadedRef.current,
      reason,
    })

    if (!segment.localObjectUrl && segment.status !== "unsupported") {
      useRecordingSegmentStore
        .getState()
        .markSegmentUnsupported(segment.id, reason)
    }
  }, [
    segment.blob,
    segment.fileSizeBytes,
    segment.id,
    segment.localObjectUrl,
    segment.mimeType,
    segment.sessionId,
    segment.status,
  ])

  const statusText = useMemo(() => {
    if (isUnsupported) return t("recordingsUnsupported")
    if (segment.status === "uploading") return t("recordingsSaving")
    if (segment.status === "error") return t("recordingsUploadFailed")
    if (!source) return t("recordingsUnavailable")
    return null
  }, [isUnsupported, segment.status, source, t])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const syncDuration = () => {
      const nextDuration =
        Number.isFinite(audio.duration) && !Number.isNaN(audio.duration)
          ? audio.duration
          : null
      if (nextDuration !== null) {
        metadataLoadedRef.current = true
        setMetadataDuration(nextDuration)
      }
    }

    const handleLoadedMetadata = () => {
      syncDuration()
      if (pendingSeekRef.current) {
        applyPausedSeek(pendingSeekRef.current.timeSeconds)
        appliedSeekRevisionRef.current = pendingSeekRef.current.revision
        pendingSeekRef.current = null
        return
      }
      setPlayerState(audio.paused ? "paused" : "playing")
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handlePlay = () => {
      setPlayerState("playing")
    }

    const handlePause = () => {
      if (!audio.ended) {
        setPlayerState("paused")
      }
    }

    const handleWaiting = () => {
      setPlayerState("loading")
    }

    const handleEnded = () => {
      setCurrentTime(totalDuration || audio.currentTime)
      setPlayerState("paused")
    }

    const handleError = () => {
      const mediaError = audio.error
      const reason =
        mediaError?.message ||
        `media-error-${mediaError?.code ?? "unknown"}`
      handlePlaybackFailure(reason)
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("durationchange", syncDuration)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("playing", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("waiting", handleWaiting)
    audio.addEventListener("stalled", handleWaiting)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("durationchange", syncDuration)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("playing", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("waiting", handleWaiting)
      audio.removeEventListener("stalled", handleWaiting)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [applyPausedSeek, handlePlaybackFailure, totalDuration])

  useEffect(() => {
    const audio = audioRef.current
    if (
      !audio ||
      !seekTarget ||
      seekTarget.segmentId !== segment.id ||
      !source ||
      isUnsupported ||
      appliedSeekRevisionRef.current === seekTarget.revision
    ) {
      return
    }

    pendingSeekRef.current = {
      timeSeconds: seekTarget.timeSeconds,
      revision: seekTarget.revision,
    }

    if (metadataLoadedRef.current) {
      const frameId = requestAnimationFrame(() => {
        applyPausedSeek(seekTarget.timeSeconds)
        appliedSeekRevisionRef.current = seekTarget.revision
        pendingSeekRef.current = null
      })
      return () => cancelAnimationFrame(frameId)
    }
  }, [applyPausedSeek, isUnsupported, seekTarget, segment.id, source])

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio || !source || isUnsupported) return

    if (!audio.paused) {
      audio.pause()
      return
    }

    setPlayerState("loading")

    try {
      await audio.play()
    } catch {
      handlePlaybackFailure("play-rejected")
    }
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-background/95 p-3 shadow-sm">
      <audio
        ref={audioRef}
        className="hidden"
        src={source ?? undefined}
        preload="metadata"
      />

      <div className="flex items-start gap-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => {
            void togglePlayback()
          }}
          disabled={!source || isUnsupported}
          className="size-10 shrink-0 rounded-full"
        >
          {isLoading ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : isPlaying ? (
            <PauseIcon className="size-4" />
          ) : (
            <PlayIcon className="size-4" />
          )}
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-5">
            {timestampLabel}
          </p>
          {summaryLabel && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {summaryLabel}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2.5 space-y-1">
        <SliderPrimitive.Root
          value={[Math.min(currentTime, totalDuration || 0)]}
          min={0}
          max={totalDuration || 0}
          step={0.25}
          disabled={!source || isUnsupported || totalDuration <= 0}
          className="group/slider relative flex h-4 touch-none items-center select-none data-[disabled]:opacity-50"
          onValueChange={(values) => {
            const audio = audioRef.current
            if (!audio) return
            audio.currentTime = values[0]
            setCurrentTime(values[0])
          }}
          onPointerDown={() => {
            const audio = audioRef.current
            if (!audio) return
            wasPlayingBeforeSeekRef.current = !audio.paused
            audio.pause()
          }}
          onPointerUp={() => {
            const audio = audioRef.current
            if (!audio) return
            if (wasPlayingBeforeSeekRef.current) {
              void audio.play().catch(() => {
                handlePlaybackFailure("seek-play-rejected")
              })
            }
          }}
        >
          <SliderPrimitive.Track className="bg-muted relative h-[4px] w-full grow overflow-hidden rounded-full">
            <SliderPrimitive.Range className="bg-primary absolute h-full" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="relative flex h-0 w-0 items-center justify-center opacity-0 group-hover/slider:opacity-100 focus-visible:opacity-100 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
            <div className="bg-foreground absolute size-3 rounded-full" />
          </SliderPrimitive.Thumb>
        </SliderPrimitive.Root>

        <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration || 0)}</span>
        </div>

        {statusText && (
          <p
            className={cn(
              "text-xs",
              segment.status === "uploading"
                ? "text-muted-foreground"
                : "text-amber-600 dark:text-amber-300"
            )}
          >
            {statusText}
          </p>
        )}
      </div>
    </div>
  )
}
