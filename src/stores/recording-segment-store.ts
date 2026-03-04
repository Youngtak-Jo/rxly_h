import { create } from "zustand"
import type { RecordingSegment } from "@/types/session"

export type RecordingSegmentStatus =
  | "uploading"
  | "ready"
  | "error"
  | "unsupported"

export interface RecordingSegmentEntry extends RecordingSegment {
  status: RecordingSegmentStatus
  localObjectUrl?: string
  blob?: Blob
  unsupportedReason?: string
}

function revokeEntryUrl(entry: RecordingSegmentEntry) {
  if (
    typeof URL.revokeObjectURL === "function" &&
    entry.localObjectUrl?.startsWith("blob:")
  ) {
    URL.revokeObjectURL(entry.localObjectUrl)
  }
}

function sortSegments<T extends { startedAt: string; createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const startedDelta =
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    if (startedDelta !== 0) return startedDelta
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

interface RecordingSegmentState {
  segments: RecordingSegmentEntry[]
  hydrateSegments: (remoteSegments: RecordingSegment[]) => void
  addUploadingSegment: (segment: RecordingSegmentEntry) => void
  markSegmentReady: (id: string, persisted: RecordingSegment) => void
  markSegmentError: (id: string) => void
  markSegmentUnsupported: (id: string, reason?: string) => void
  reset: () => void
}

export const useRecordingSegmentStore = create<RecordingSegmentState>(
  (set, get) => ({
    segments: [],

    hydrateSegments: (remoteSegments) =>
      set((state) => {
        const mergedRemote = remoteSegments.map<RecordingSegmentEntry>((segment) => {
          return {
            ...segment,
            status: segment.audioUrl ? "ready" : "error",
          }
        })

        const remoteIds = new Set(remoteSegments.map((segment) => segment.id))
        const localOnly = state.segments.filter(
          (segment) => !remoteIds.has(segment.id) && segment.status !== "ready"
        )

        return {
          segments: sortSegments([...mergedRemote, ...localOnly]),
        }
      }),

    addUploadingSegment: (segment) =>
      set((state) => ({
        segments: sortSegments([
          segment,
          ...state.segments.filter((item) => item.id !== segment.id),
        ]),
      })),

    markSegmentReady: (id, persisted) =>
      set((state) => ({
        segments: sortSegments(
          state.segments.map((segment) => {
            if (segment.id !== id) return segment

            revokeEntryUrl(segment)
            return {
              ...persisted,
              status: "ready",
            }
          })
        ),
      })),

    markSegmentError: (id) =>
      set((state) => ({
        segments: state.segments.map((segment) =>
          segment.id === id ? { ...segment, status: "error" } : segment
        ),
      })),

    markSegmentUnsupported: (id, reason) =>
      set((state) => ({
        segments: state.segments.map((segment) =>
          segment.id === id
            ? {
                ...segment,
                status: "unsupported",
                unsupportedReason: reason,
              }
            : segment
        ),
      })),

    reset: () => {
      for (const segment of get().segments) {
        revokeEntryUrl(segment)
      }
      set({ segments: [] })
    },
  })
)
