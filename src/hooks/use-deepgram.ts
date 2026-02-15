"use client"

import { useCallback, useRef } from "react"
import { useRecordingStore } from "@/stores/recording-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useLiveInsights } from "@/hooks/use-live-insights"
import { v4 as uuid } from "uuid"
import type { Speaker } from "@/types/session"

const SAMPLE_RATE = 16000

/** Languages supported by Deepgram Nova-3 Medical (English only) */
const MEDICAL_MODEL_LANGUAGES = [
  "en", "en-US", "en-AU", "en-CA", "en-GB", "en-IE", "en-IN", "en-NZ",
]

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
  const sessionStartTimeRef = useRef<number>(0)
  const finalAnalysisCalledRef = useRef(false)

  const { setRecording, setPaused, setError, setDuration } = useRecordingStore()
  const { triggerAnalysis, runFinalAnalysis } = useLiveInsights()

  const startListening = useCallback(async () => {
    try {
      // Reset speaker identification state so detection re-triggers for the new recording segment
      useTranscriptStore.getState().resetSpeakerIdentification()

      // Get temporary token
      const tokenRes = await fetch("/api/deepgram/token", { method: "POST" })
      if (!tokenRes.ok) throw new Error("Failed to get Deepgram token")
      const { token } = await tokenRes.json()

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
        ["token", token]
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

            const baseTime =
              (Date.now() - sessionStartTimeRef.current) / 1000

            if (data.is_final && words.length > 0) {
              // Split segment at speaker boundaries
              const chunks = splitBySpeaker(words)
              const { addFinalEntry } = useTranscriptStore.getState()

              for (const chunk of chunks) {
                const speaker = resolveSpeaker(chunk.speakerId)
                const startTime = baseTime - (data.duration || 0) + chunk.start
                const endTime = baseTime - (data.duration || 0) + chunk.end

                const entry = {
                  id: uuid(),
                  sessionId,
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

                addFinalEntry(entry)

                // Persist to DB (fire-and-forget)
                if (sessionId) {
                  fetch(`/api/sessions/${sessionId}/transcript`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: entry.id,
                      speaker,
                      text: chunk.text,
                      startTime: Math.max(0, startTime),
                      endTime: Math.max(0, endTime),
                      confidence:
                        data.channel?.alternatives?.[0]?.confidence || 0,
                    }),
                  }).catch(console.error)
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
        }
        finalAnalysisCalledRef.current = false
        setRecording(false)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start recording"
      console.error("Failed to start listening:", error)
      setError(message)
    }
  }, [setRecording, setDuration, setError, triggerAnalysis, runFinalAnalysis])

  const stopListening = useCallback(() => {
    // Mark that we're calling runFinalAnalysis from stopListening
    // so ws.onclose won't call it again
    finalAnalysisCalledRef.current = true
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
  }, [setRecording, runFinalAnalysis])

  const pauseListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = false
      })
    }
    setPaused(true)
  }, [setPaused])

  const resumeListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = true
      })
    }
    setPaused(false)
  }, [setPaused])

  return { startListening, stopListening, pauseListening, resumeListening }
}
