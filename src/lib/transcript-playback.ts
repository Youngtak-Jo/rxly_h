import type { RecordingSegment, TranscriptEntry } from "@/types/session"

export interface TranscriptPlaybackTarget {
  segmentId: string
  timeSeconds: number
  source: "exact" | "legacy-single-segment"
}

export interface RecordingSegmentSummary {
  segmentId: string
  utteranceCount: number
  doctorCount: number
  patientCount: number
  unknownCount: number
}

function clampTime(value: number, durationMs: number) {
  const maxSeconds = durationMs > 0 ? durationMs / 1000 : 0
  return Math.min(Math.max(value, 0), maxSeconds)
}

export function resolveEntryPlaybackTarget(
  entry: TranscriptEntry,
  segments: RecordingSegment[]
): TranscriptPlaybackTarget | null {
  if (segments.length === 0) return null

  if (entry.recordingSegmentId) {
    const segment = segments.find((item) => item.id === entry.recordingSegmentId)
    if (!segment) return null

    return {
      segmentId: segment.id,
      timeSeconds: clampTime(entry.startTime, segment.durationMs),
      source: "exact",
    }
  }

  if (segments.length !== 1) return null

  return {
    segmentId: segments[0].id,
    timeSeconds: clampTime(entry.startTime, segments[0].durationMs),
    source: "legacy-single-segment",
  }
}

export function buildRecordingSegmentSummaries(
  entries: TranscriptEntry[],
  segments: RecordingSegment[]
): Map<string, RecordingSegmentSummary> {
  const summaries = new Map<string, RecordingSegmentSummary>()

  for (const segment of segments) {
    summaries.set(segment.id, {
      segmentId: segment.id,
      utteranceCount: 0,
      doctorCount: 0,
      patientCount: 0,
      unknownCount: 0,
    })
  }

  for (const entry of entries) {
    const target = resolveEntryPlaybackTarget(entry, segments)
    if (!target) continue

    const summary = summaries.get(target.segmentId)
    if (!summary) continue

    summary.utteranceCount += 1
    if (entry.speaker === "DOCTOR") {
      summary.doctorCount += 1
    } else if (entry.speaker === "PATIENT") {
      summary.patientCount += 1
    } else {
      summary.unknownCount += 1
    }
  }

  return summaries
}
