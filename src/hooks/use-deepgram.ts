"use client"

import { useCallback, useRef } from "react"
import { useRecordingStore } from "@/stores/recording-store"
import { useRecordingSegmentStore } from "@/stores/recording-segment-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useLiveInsights } from "@/hooks/use-live-insights"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import {
  clearRecordingCaptureConfigCache,
  getRecordingExtension,
  logRecordingDiagnostic,
  normalizeRecordingMimeType,
  probeRecordingCaptureConfig,
} from "@/lib/audio-recordings"
import { getResponseErrorMessage } from "@/lib/response-error"
import { toast } from "sonner"
import { v4 as uuid } from "uuid"
import type { RecordingSegment, Speaker } from "@/types/session"

const SAMPLE_RATE = 16000

/** Languages supported by Deepgram Nova-3 Medical (English only) */
const MEDICAL_MODEL_LANGUAGES = [
  "en", "en-US", "en-AU", "en-CA", "en-GB", "en-IE", "en-IN", "en-NZ",
]

interface FinalizedRecordingSegment {
  id: string
  sessionId: string
  blob: Blob
  mimeType: string
  blobType: string
  recorderMimeType: string
  durationMs: number
  startedAt: string
  endedAt: string
  createdAt: string
}

/**
 * Resolve speaker label from raw Deepgram speaker ID.
 * Reads the store directly (no closure) so the WebSocket handler
 * always picks up the latest AI-identified mapping.
 */
function resolveSpeaker(speakerId: number): Speaker {
  const { speakerRoleMap } = useTranscriptStore.getState()
  if (speakerRoleMap[speakerId]) {
    return speakerRoleMap[speakerId]
  }
  return "UNKNOWN"
}

interface WordInfo {
  word: string
  speaker: number
  start: number
  end: number
}

/**
 * Group consecutive words by speaker so a single Deepgram segment
 * that contains overlapping speakers is split into per-speaker chunks.
 */
function splitBySpeaker(words: WordInfo[]): { speakerId: number; text: string; start: number; end: number }[] {
  if (words.length === 0) return []

  const chunks: { speakerId: number; text: string; start: number; end: number }[] = []
  let currentSpeaker = words[0].speaker
  let currentWords: string[] = [words[0].word]
  let chunkStart = words[0].start
  let chunkEnd = words[0].end

  for (let i = 1; i < words.length; i++) {
    const w = words[i]
    if (w.speaker !== currentSpeaker) {
      chunks.push({
        speakerId: currentSpeaker,
        text: currentWords.join(" "),
        start: chunkStart,
        end: chunkEnd,
      })
      currentSpeaker = w.speaker
      currentWords = [w.word]
      chunkStart = w.start
      chunkEnd = w.end
    } else {
      currentWords.push(w.word)
      chunkEnd = w.end
    }
  }
  chunks.push({
    speakerId: currentSpeaker,
    text: currentWords.join(" "),
    start: chunkStart,
    end: chunkEnd,
  })

  return chunks
}

export function useDeepgram() {
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const mediaChunksRef = useRef<Blob[]>([])
  const mediaRecorderMimeTypeRef = useRef<string | null>(null)
  const recordingSessionIdRef = useRef<string | null>(null)
  const segmentIdRef = useRef<string | null>(null)
  const segmentStartedAtRef = useRef<number | null>(null)
  const pausedStartedAtRef = useRef<number | null>(null)
  const accumulatedPausedMsRef = useRef(0)
  const archiveUnavailableToastShownRef = useRef(false)
  const sessionStartTimeRef = useRef<number>(0)
  const finalAnalysisCalledRef = useRef(false)
  const recentChunkKeysRef = useRef<string[]>([])
  const recentChunkKeySetRef = useRef<Set<string>>(new Set())

  const { setRecording, setPaused, setError, setDuration } = useRecordingStore()
  const { triggerAnalysis, runFinalAnalysis } = useLiveInsights()

  const getActiveElapsedSeconds = useCallback(() => {
    const now = Date.now()
    const pausedMs = accumulatedPausedMsRef.current
    const activeElapsedMs = now - sessionStartTimeRef.current - pausedMs
    return Math.max(0, activeElapsedMs / 1000)
  }, [])

  const resetSegmentCaptureState = useCallback(() => {
    mediaRecorderRef.current = null
    mediaChunksRef.current = []
    mediaRecorderMimeTypeRef.current = null
    recordingSessionIdRef.current = null
    segmentIdRef.current = null
    segmentStartedAtRef.current = null
    pausedStartedAtRef.current = null
    accumulatedPausedMsRef.current = 0
  }, [])

  const uploadRecordingSegment = useCallback(async (segment: FinalizedRecordingSegment) => {
    const objectUrl = URL.createObjectURL(segment.blob)
    useRecordingSegmentStore.getState().addUploadingSegment({
      id: segment.id,
      sessionId: segment.sessionId,
      storagePath: "",
      audioUrl: null,
      mimeType: segment.mimeType,
      fileSizeBytes: segment.blob.size,
      durationMs: segment.durationMs,
      startedAt: segment.startedAt,
      endedAt: segment.endedAt,
      createdAt: segment.createdAt,
      status: "uploading",
      localObjectUrl: objectUrl,
      blob: segment.blob,
    })

    const extension = getRecordingExtension(segment.mimeType) || "mp4"
    const formData = new FormData()
    formData.append("file", segment.blob, `${segment.id}.${extension}`)
    formData.append("id", segment.id)
    formData.append("startedAt", segment.startedAt)
    formData.append("endedAt", segment.endedAt)
    formData.append("durationMs", String(segment.durationMs))

    try {
      const res = await fetch(`/api/sessions/${segment.sessionId}/recordings`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error(
          await getResponseErrorMessage(res, "Failed to save recording segment")
        )
      }

      const persisted = (await res.json()) as RecordingSegment
      useRecordingSegmentStore.getState().markSegmentReady(segment.id, persisted)
      deleteCachedSession(segment.sessionId)
    } catch (error) {
      console.error("Failed to upload recording segment:", error)
      useRecordingSegmentStore.getState().markSegmentError(segment.id)
      toast.error(
        error instanceof Error ? error.message : "Failed to save recording segment"
      )
    }
  }, [])

  const finalizeRecordingSegment = useCallback(async (): Promise<FinalizedRecordingSegment | null> => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      resetSegmentCaptureState()
      return null
    }

    const stoppedAtMs = Date.now()
    const startedAtMs = segmentStartedAtRef.current
    const sessionId = recordingSessionIdRef.current
    const segmentId = segmentIdRef.current
    const pausedMs =
      accumulatedPausedMsRef.current +
      (pausedStartedAtRef.current
        ? stoppedAtMs - pausedStartedAtRef.current
        : 0)
    const recorderMimeType = mediaRecorder.mimeType || mediaRecorderMimeTypeRef.current || ""
    const mimeType =
      normalizeRecordingMimeType(
        mediaRecorderMimeTypeRef.current || mediaRecorder.mimeType
      ) || "audio/mp4"

    const segment = await new Promise<FinalizedRecordingSegment | null>((resolve) => {
      const handleStop = () => {
        const blob = new Blob(mediaChunksRef.current, {
          type: recorderMimeType || mimeType,
        })
        resetSegmentCaptureState()

        if (!segmentId || !sessionId || !startedAtMs || blob.size === 0) {
          resolve(null)
          return
        }

        const finalizedSegment = {
          id: segmentId,
          sessionId,
          blob,
          mimeType,
          blobType: blob.type || recorderMimeType || mimeType,
          recorderMimeType,
          durationMs: Math.max(0, stoppedAtMs - startedAtMs - pausedMs),
          startedAt: new Date(startedAtMs).toISOString(),
          endedAt: new Date(stoppedAtMs).toISOString(),
          createdAt: new Date(stoppedAtMs).toISOString(),
        }

        logRecordingDiagnostic("recording_segment_finalized", {
          sessionId,
          chosenMime: mimeType,
          recorderMime: recorderMimeType,
          blobType: finalizedSegment.blobType,
          fileSizeBytes: blob.size,
          metadataLoaded: false,
        })

        resolve(finalizedSegment)
      }

      mediaRecorder.addEventListener("stop", handleStop, { once: true })
      mediaRecorder.stop()
    })

    return segment
  }, [resetSegmentCaptureState])

  const startAudioArchiveCapture = useCallback(async (stream: MediaStream, sessionId: string) => {
    const captureConfig = await probeRecordingCaptureConfig(sessionId)
    if (!captureConfig) {
      if (!archiveUnavailableToastShownRef.current) {
        archiveUnavailableToastShownRef.current = true
        toast.warning("Audio archive unavailable in this browser")
      }
      resetSegmentCaptureState()
      return
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: captureConfig.recorderMimeType,
      })
      mediaRecorderRef.current = mediaRecorder
      mediaRecorderMimeTypeRef.current = captureConfig.storageMimeType
      recordingSessionIdRef.current = sessionId
      segmentIdRef.current = uuid()
      segmentStartedAtRef.current = Date.now()
      pausedStartedAtRef.current = null
      accumulatedPausedMsRef.current = 0
      mediaChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        clearRecordingCaptureConfigCache()
        console.error("MediaRecorder error:", event)
        toast.error("Failed to capture recording audio")
      }

      mediaRecorder.start()
    } catch (error) {
      clearRecordingCaptureConfigCache()
      console.error("Failed to start MediaRecorder:", error)
      if (!archiveUnavailableToastShownRef.current) {
        archiveUnavailableToastShownRef.current = true
        toast.warning("Audio archive unavailable in this browser")
      }
      resetSegmentCaptureState()
    }
  }, [resetSegmentCaptureState])

  const rememberChunkKey = useCallback((key: string) => {
    if (recentChunkKeySetRef.current.has(key)) return

    recentChunkKeySetRef.current.add(key)
    recentChunkKeysRef.current.push(key)

    // Keep bounded memory for long recordings.
    if (recentChunkKeysRef.current.length > 2000) {
      const oldest = recentChunkKeysRef.current.shift()
      if (oldest) {
        recentChunkKeySetRef.current.delete(oldest)
      }
    }
  }, [])

  const hasChunkKey = useCallback((key: string) => {
    return recentChunkKeySetRef.current.has(key)
  }, [])

  const makeChunkFingerprint = useCallback(
    (speakerId: number, text: string, start: number, end: number) => {
      const normalizedText = text.trim().replace(/\s+/g, " ").toLowerCase()
      return [
        speakerId,
        Math.round(start * 100),
        Math.round(end * 100),
        normalizedText,
      ].join("|")
    },
    []
  )

  const startListening = useCallback(async () => {
    try {
      // Fresh dedupe window for each recording start.
      recentChunkKeysRef.current = []
      recentChunkKeySetRef.current.clear()

      // Reset speaker identification state so detection re-triggers for the new recording segment
      useTranscriptStore.getState().resetSpeakerIdentification()

      // Get temporary token
      const tokenRes = await fetch("/api/deepgram/token", { method: "POST" })
      if (!tokenRes.ok) {
        throw new Error(
          await getResponseErrorMessage(
            tokenRes,
            "Failed to get Deepgram token"
          )
        )
      }
      const tokenPayload = (await tokenRes.json()) as {
        token: string
        tokenType?: "bearer" | "token"
      }
      const token = tokenPayload.token
      const tokenType = tokenPayload.tokenType || "bearer"

      // Read settings at connection time
      const settings = useSettingsStore.getState()

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: SAMPLE_RATE,
          echoCancellation: settings.audio.echoCancellation,
          noiseSuppression: settings.audio.noiseSuppression,
        },
      })
      streamRef.current = stream

      // Create AudioContext and worklet
      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioContextRef.current = audioContext

      await audioContext.audioWorklet.addModule("/audio-worklet-processor.js")
      const source = audioContext.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(
        audioContext,
        "linear-pcm-processor"
      )
      workletNodeRef.current = workletNode
      source.connect(workletNode)
      workletNode.connect(audioContext.destination)

      // Capture session ID at connection time (stable for the session)
      const sessionId = useSessionStore.getState().activeSession?.id || ""

      if (sessionId) {
        await startAudioArchiveCapture(stream, sessionId)
      } else {
        resetSegmentCaptureState()
      }

      // Open WebSocket to Deepgram
      const model = MEDICAL_MODEL_LANGUAGES.includes(settings.stt.language)
        ? "nova-3-medical"
        : "nova-3"

      const params = new URLSearchParams({
        model,
        encoding: "linear16",
        sample_rate: String(SAMPLE_RATE),
        channels: "1",
        diarize: String(settings.stt.diarize),
        smart_format: String(settings.stt.smartFormat),
        language: settings.stt.language,
        interim_results: "true",
        endpointing: String(settings.audio.endpointing),
        utterance_end_ms: String(settings.audio.utteranceEndMs),
        vad_events: "true",
      })

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${params}`,
        [tokenType, token]
      )
      wsRef.current = ws

      sessionStartTimeRef.current = Date.now()

      ws.onopen = () => {
        setRecording(true)
        setDuration(0)

        // Forward audio chunks
        workletNode.port.onmessage = (event) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(event.data)
          }
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "Results") {
            const transcript =
              data.channel?.alternatives?.[0]?.transcript || ""
            if (!transcript.trim()) return

            const words: WordInfo[] = (
              data.channel?.alternatives?.[0]?.words || []
            ).map((w: { word: string; speaker: number; start: number; end: number }) => ({
              word: w.word,
              speaker: w.speaker ?? 0,
              start: w.start,
              end: w.end,
            }))

            const baseTime = getActiveElapsedSeconds()

            if (data.is_final && words.length > 0) {
              // Split segment at speaker boundaries
              const chunks = splitBySpeaker(words)
              const { addFinalEntry } = useTranscriptStore.getState()

              for (const chunk of chunks) {
                const speaker = resolveSpeaker(chunk.speakerId)
                const startTime = baseTime - (data.duration || 0) + chunk.start
                const endTime = baseTime - (data.duration || 0) + chunk.end
                const dedupeKey = makeChunkFingerprint(
                  chunk.speakerId,
                  chunk.text,
                  startTime,
                  endTime
                )

                if (hasChunkKey(dedupeKey)) {
                  continue
                }
                rememberChunkKey(dedupeKey)

                const entry = {
                  id: uuid(),
                  sessionId,
                  recordingSegmentId: segmentIdRef.current,
                  speaker,
                  rawSpeakerId: chunk.speakerId,
                  text: chunk.text,
                  startTime: Math.max(0, startTime),
                  endTime: Math.max(0, endTime),
                  confidence:
                    data.channel?.alternatives?.[0]?.confidence || 0,
                  isFinal: true,
                  createdAt: new Date().toISOString(),
                }

                // Guard against near-identical duplicate append right next to each other.
                const existing = useTranscriptStore.getState().entries
                const lastEntry = existing[existing.length - 1]
                const normalizedChunkText = chunk.text.trim().replace(/\s+/g, " ").toLowerCase()
                const normalizedLastText = lastEntry?.text
                  ?.trim()
                  .replace(/\s+/g, " ")
                  .toLowerCase()
                if (
                  lastEntry &&
                  normalizedLastText === normalizedChunkText &&
                  lastEntry.rawSpeakerId === chunk.speakerId &&
                  Math.abs((lastEntry.endTime ?? 0) - endTime) < 1
                ) {
                  continue
                }

                addFinalEntry(entry)

                // Persist to DB (fire-and-forget)
                if (sessionId) {
                  fetch(`/api/sessions/${sessionId}/transcript`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: entry.id,
                      speaker,
                      rawSpeakerId: chunk.speakerId,
                      recordingSegmentId: segmentIdRef.current,
                      text: chunk.text,
                      startTime: Math.max(0, startTime),
                      endTime: Math.max(0, endTime),
                      confidence:
                        data.channel?.alternatives?.[0]?.confidence || 0,
                    }),
                  })
                    .then((res) => {
                      if (res.ok) {
                        deleteCachedSession(sessionId)
                      }
                    })
                    .catch(console.error)
                }
              }
            } else if (!data.is_final) {
              // Interim: use first word's speaker (best we can do for live preview)
              const speakerId = words[0]?.speaker ?? 0
              const speaker = resolveSpeaker(speakerId)
              const { setInterimText } = useTranscriptStore.getState()
              setInterimText(transcript, speaker)
            }
          }

          if (data.type === "UtteranceEnd") {
            const { clearInterim } = useTranscriptStore.getState()
            clearInterim()
            triggerAnalysis()
          }
        } catch (e) {
          console.error("Failed to parse Deepgram message:", e)
        }
      }

      ws.onerror = (error) => {
        console.error("Deepgram WebSocket error:", error)
        setError("Connection error occurred")
      }

      ws.onclose = () => {
        // Only run final analysis on unexpected disconnects;
        // stopListening() already calls it explicitly
        if (!finalAnalysisCalledRef.current) {
          runFinalAnalysis()
          void finalizeRecordingSegment().then((segment) => {
            if (segment) {
              void uploadRecordingSegment(segment)
            }
          })
          if (workletNodeRef.current) {
            workletNodeRef.current.disconnect()
            workletNodeRef.current = null
          }
          if (audioContextRef.current) {
            void audioContextRef.current.close()
            audioContextRef.current = null
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
          }
        }
        finalAnalysisCalledRef.current = false
        setPaused(false)
        setRecording(false)
      }
    } catch (error) {
      resetSegmentCaptureState()
      const message =
        error instanceof Error ? error.message : "Failed to start recording"
      console.error("Failed to start listening:", error)
      toast.error(message)
      setError(message)
    }
  }, [
    setRecording,
    setDuration,
    setError,
    triggerAnalysis,
    runFinalAnalysis,
    getActiveElapsedSeconds,
    hasChunkKey,
    rememberChunkKey,
    makeChunkFingerprint,
    finalizeRecordingSegment,
    resetSegmentCaptureState,
    startAudioArchiveCapture,
    setPaused,
    uploadRecordingSegment,
  ])

  const stopListening = useCallback(async () => {
    // Mark that we're calling runFinalAnalysis from stopListening
    // so ws.onclose won't call it again
    finalAnalysisCalledRef.current = true

    const segment = await finalizeRecordingSegment()

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    runFinalAnalysis()
    setRecording(false)
    const { clearInterim } = useTranscriptStore.getState()
    clearInterim()
    setPaused(false)

    if (segment) {
      void uploadRecordingSegment(segment)
    }
  }, [finalizeRecordingSegment, runFinalAnalysis, setPaused, setRecording, uploadRecordingSegment])

  const pauseListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false
      })
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause()
      pausedStartedAtRef.current = Date.now()
    }
    setPaused(true)
  }, [setPaused])

  const resumeListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true
      })
    }
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume()
      if (pausedStartedAtRef.current) {
        accumulatedPausedMsRef.current += Date.now() - pausedStartedAtRef.current
      }
      pausedStartedAtRef.current = null
    }
    setPaused(false)
  }, [setPaused])

  return { startListening, stopListening, pauseListening, resumeListening }
}
