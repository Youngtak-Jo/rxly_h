"use client"

import { useCallback, useRef } from "react"
import { useRecordingStore } from "@/stores/recording-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useLiveInsights } from "@/hooks/use-live-insights"
import { v4 as uuid } from "uuid"
import type { Speaker } from "@/types/session"

const SAMPLE_RATE = 16000

export function useDeepgram() {
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionStartTimeRef = useRef<number>(0)
  const speakerMapRef = useRef<Map<number, Speaker>>(new Map())

  const { setRecording, setPaused, setError, setDuration } = useRecordingStore()
  const { addFinalEntry, setInterimText, clearInterim } = useTranscriptStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const { triggerAnalysis } = useLiveInsights()

  const mapSpeaker = useCallback((speakerId: number): Speaker => {
    if (!speakerMapRef.current.has(speakerId)) {
      if (speakerMapRef.current.size === 0)
        speakerMapRef.current.set(speakerId, "DOCTOR")
      else if (speakerMapRef.current.size === 1)
        speakerMapRef.current.set(speakerId, "PATIENT")
      else speakerMapRef.current.set(speakerId, "UNKNOWN")
    }
    return speakerMapRef.current.get(speakerId) || "UNKNOWN"
  }, [])

  const startListening = useCallback(async () => {
    try {
      // Get temporary token
      const tokenRes = await fetch("/api/deepgram/token", { method: "POST" })
      if (!tokenRes.ok) throw new Error("Failed to get Deepgram token")
      const { token } = await tokenRes.json()

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
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

      // Open WebSocket to Deepgram
      const params = new URLSearchParams({
        model: "nova-3",
        encoding: "linear16",
        sample_rate: String(SAMPLE_RATE),
        channels: "1",
        diarize: "true",
        smart_format: "true",
        language: "en",
        interim_results: "true",
        utterance_end_ms: "1000",
        vad_events: "true",
      })

      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?${params}`,
        ["token", token]
      )
      wsRef.current = ws

      sessionStartTimeRef.current = Date.now()
      speakerMapRef.current.clear()

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

            const words = data.channel?.alternatives?.[0]?.words || []
            const speakerId = words[0]?.speaker ?? 0
            const speaker = mapSpeaker(speakerId)
            const startTime =
              (Date.now() - sessionStartTimeRef.current) / 1000 -
              (data.duration || 0)
            const endTime =
              (Date.now() - sessionStartTimeRef.current) / 1000

            if (data.is_final) {
              addFinalEntry({
                id: uuid(),
                sessionId: activeSession?.id || "",
                speaker,
                text: transcript,
                startTime: Math.max(0, startTime),
                endTime,
                confidence:
                  data.channel?.alternatives?.[0]?.confidence || 0,
                isFinal: true,
                createdAt: new Date().toISOString(),
              })

              // Persist to DB (fire-and-forget)
              if (activeSession?.id) {
                fetch(`/api/sessions/${activeSession.id}/transcript`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    speaker,
                    text: transcript,
                    startTime: Math.max(0, startTime),
                    endTime,
                    confidence:
                      data.channel?.alternatives?.[0]?.confidence || 0,
                  }),
                }).catch(console.error)
              }
            } else {
              setInterimText(transcript, speaker)
            }
          }

          if (data.type === "UtteranceEnd") {
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
        setRecording(false)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start recording"
      console.error("Failed to start listening:", error)
      setError(message)
    }
  }, [
    setRecording,
    setDuration,
    setPaused,
    setError,
    addFinalEntry,
    setInterimText,
    clearInterim,
    activeSession,
    mapSpeaker,
    triggerAnalysis,
  ])

  const stopListening = useCallback(() => {
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
    setRecording(false)
    clearInterim()
  }, [setRecording, clearInterim])

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
