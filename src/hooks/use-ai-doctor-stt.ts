"use client"

import { useEffect, useRef } from "react"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useAiDoctor } from "@/hooks/use-ai-doctor"
import { toast } from "sonner"

const SAMPLE_RATE = 16000

const MEDICAL_MODEL_LANGUAGES = [
  "en", "en-US", "en-AU", "en-CA", "en-GB", "en-IE", "en-IN", "en-NZ",
]

/**
 * Hook that manages Deepgram STT for AI doctor mode voice input.
 * Separate from the main useDeepgram hook since it has simpler requirements
 * (no diarization, auto-sends on utterance end).
 */
export function useAiDoctorStt() {
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const accumulatedTextRef = useRef("")
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { sendMessage } = useAiDoctor()
  // Store sendMessage in a ref so the effect doesn't depend on it
  const sendMessageRef = useRef(sendMessage)
  useEffect(() => {
    sendMessageRef.current = sendMessage
  }, [sendMessage])

  const cleanupResources = () => {
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current)
      sendTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    // Send any accumulated text before cleanup
    const accumulated = accumulatedTextRef.current.trim()
    if (accumulated) {
      sendMessageRef.current(accumulated)
      accumulatedTextRef.current = ""
    }
  }

  // React to isMicActive changes
  const isMicActive = useConsultationModeStore((s) => s.isMicActive)
  const consultationStarted = useConsultationModeStore(
    (s) => s.consultationStarted
  )

  useEffect(() => {
    if (!isMicActive || !consultationStarted) {
      cleanupResources()
      return
    }

    let cancelled = false

    const startListening = async () => {
      // Get temporary token
      const tokenRes = await fetch("/api/deepgram/token", { method: "POST" })
      if (!tokenRes.ok) {
        const errData = await tokenRes.json().catch(() => ({}))
        console.error("Deepgram token error:", tokenRes.status, errData)
        toast.error("Failed to start voice input. Please try again.")
        useConsultationModeStore.getState().setMicActive(false)
        return
      }
      const { token } = await tokenRes.json()

      if (cancelled) return

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

      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      streamRef.current = stream

      // Create AudioContext and worklet
      const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE })
      audioContextRef.current = audioContext

      await audioContext.audioWorklet.addModule("/audio-worklet-processor.js")

      if (cancelled) {
        audioContext.close().catch(() => {})
        stream.getTracks().forEach((t) => t.stop())
        return
      }

      const source = audioContext.createMediaStreamSource(stream)
      const workletNode = new AudioWorkletNode(
        audioContext,
        "linear-pcm-processor"
      )
      workletNodeRef.current = workletNode
      source.connect(workletNode)
      workletNode.connect(audioContext.destination)

      // Build WebSocket params (no diarization for single speaker)
      const model = MEDICAL_MODEL_LANGUAGES.includes(settings.stt.language)
        ? "nova-3-medical"
        : "nova-3"

      const params = new URLSearchParams({
        model,
        encoding: "linear16",
        sample_rate: String(SAMPLE_RATE),
        channels: "1",
        diarize: "false",
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

      accumulatedTextRef.current = ""

      ws.onopen = () => {
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

            const isFinal = data.is_final

            if (isFinal) {
              accumulatedTextRef.current +=
                (accumulatedTextRef.current ? " " : "") + transcript.trim()
            }
          }

          if (data.type === "UtteranceEnd") {
            const text = accumulatedTextRef.current.trim()
            if (text) {
              accumulatedTextRef.current = ""
              if (sendTimeoutRef.current) {
                clearTimeout(sendTimeoutRef.current)
              }
              sendTimeoutRef.current = setTimeout(() => {
                const { isAiResponding } =
                  useConsultationModeStore.getState()
                if (!isAiResponding) {
                  sendMessageRef.current(text)
                }
                sendTimeoutRef.current = null
              }, 500)
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      ws.onerror = () => {
        toast.error("Voice input connection error")
        useConsultationModeStore.getState().setMicActive(false)
      }

      ws.onclose = () => {
        // Cleanup handled by the effect
      }
    }

    startListening().catch((error) => {
      console.error("AI Doctor STT error:", error)
      toast.error("Failed to start voice input. Check microphone permissions.")
      useConsultationModeStore.getState().setMicActive(false)
    })

    return () => {
      cancelled = true
      cleanupResources()
    }
  }, [isMicActive, consultationStarted])
}
