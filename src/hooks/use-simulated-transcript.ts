"use client"

import { useCallback, useRef } from "react"
import { useRecordingStore } from "@/stores/recording-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useLiveInsights } from "@/hooks/use-live-insights"
import { SCENARIOS, type MockEntry } from "@/data/scenarios"
import { v4 as uuid } from "uuid"
import type { Speaker } from "@/types/session"

const INTERIM_WORD_STEP_MS = 80

export interface SimulationOptions {
  speedFactor: number
  skipInterim: boolean
  scenario: MockEntry[]
}

const DEFAULT_OPTIONS: SimulationOptions = {
  speedFactor: 0.5,
  skipInterim: false,
  scenario: SCENARIOS[0].entries,
}

function resolveSpeaker(rawSpeakerId: number): Speaker {
  const { speakerRoleMap } = useTranscriptStore.getState()
  return speakerRoleMap[rawSpeakerId] || "UNKNOWN"
}

export function useSimulatedTranscript() {
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const isRunningRef = useRef(false)
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )

  const { setRecording, setDuration } = useRecordingStore()
  const { triggerAnalysis } = useLiveInsights()

  const startSimulation = useCallback(
    (options: Partial<SimulationOptions> = {}) => {
      if (isRunningRef.current) return
      isRunningRef.current = true

      const opts = { ...DEFAULT_OPTIONS, ...options }
      const entries = opts.scenario

      const sessionId = useSessionStore.getState().activeSession?.id || ""
      if (!sessionId) {
        console.error("No active session for simulation")
        isRunningRef.current = false
        return
      }

      useTranscriptStore.getState().reset()
      setRecording(true)
      setDuration(0)

      durationIntervalRef.current = setInterval(() => {
        const store = useRecordingStore.getState()
        if (!store.isRecording) {
          if (durationIntervalRef.current)
            clearInterval(durationIntervalRef.current)
          return
        }
        store.setDuration(store.duration + 1)
      }, 1000)

      let cumulativeDelay = 0
      let runningTime = 0

      for (let i = 0; i < entries.length; i++) {
        const mockEntry = entries[i]
        const entryDelay = mockEntry.delayMs * opts.speedFactor

        cumulativeDelay += entryDelay

        const words = mockEntry.text.split(" ")
        const interimStartDelay = cumulativeDelay
        const capturedRawSpeakerId = mockEntry.rawSpeakerId
        const capturedText = mockEntry.text

        // Phase 1: Interim text build-up
        if (!opts.skipInterim) {
          for (let w = 1; w <= words.length; w++) {
            const chunk = words.slice(0, w).join(" ")
            const interimDelay =
              interimStartDelay +
              w * INTERIM_WORD_STEP_MS * opts.speedFactor
            const t = setTimeout(() => {
              const speaker = resolveSpeaker(capturedRawSpeakerId)
              useTranscriptStore.getState().setInterimText(chunk, speaker)
            }, interimDelay)
            timeoutsRef.current.push(t)
          }
        }

        // Phase 2: Finalize entry
        const finalizeDelay = opts.skipInterim
          ? interimStartDelay + 100
          : interimStartDelay +
            words.length * INTERIM_WORD_STEP_MS * opts.speedFactor +
            100
        const entryStartTime = runningTime
        runningTime += words.length * 0.3
        const entryEndTime = runningTime

        const capturedStartTime = entryStartTime
        const capturedEndTime = entryEndTime

        const t2 = setTimeout(() => {
          const { addFinalEntry, clearInterim } =
            useTranscriptStore.getState()
          const speaker = resolveSpeaker(capturedRawSpeakerId)

          const entryId = uuid()
          addFinalEntry({
            id: entryId,
            sessionId,
            speaker,
            rawSpeakerId: capturedRawSpeakerId,
            text: capturedText,
            startTime: capturedStartTime,
            endTime: capturedEndTime,
            confidence: 0.95 + Math.random() * 0.05,
            isFinal: true,
            createdAt: new Date().toISOString(),
          })

          clearInterim()

          fetch(`/api/sessions/${sessionId}/transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: entryId,
              speaker,
              text: capturedText,
              startTime: capturedStartTime,
              endTime: capturedEndTime,
              confidence: 0.97,
              rawSpeakerId: capturedRawSpeakerId,
            }),
          }).catch(console.error)
        }, finalizeDelay)
        timeoutsRef.current.push(t2)

        // Phase 3: Trigger analysis at speaker changes or every 4 entries
        const isLastEntry = i === entries.length - 1
        const nextEntry = entries[i + 1]
        const isSpeakerChange =
          nextEntry && nextEntry.rawSpeakerId !== mockEntry.rawSpeakerId
        const isNaturalPause = (i + 1) % 4 === 0

        if (isLastEntry || isSpeakerChange || isNaturalPause) {
          const t3 = setTimeout(() => {
            triggerAnalysis()
          }, finalizeDelay + 200)
          timeoutsRef.current.push(t3)
        }

        cumulativeDelay = finalizeDelay + 300
      }

      // End simulation
      const t4 = setTimeout(() => {
        setRecording(false)
        isRunningRef.current = false
        if (durationIntervalRef.current)
          clearInterval(durationIntervalRef.current)
        triggerAnalysis()
      }, cumulativeDelay + 1000)
      timeoutsRef.current.push(t4)
    },
    [setRecording, setDuration, triggerAnalysis]
  )

  const stopSimulation = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    isRunningRef.current = false
    if (durationIntervalRef.current)
      clearInterval(durationIntervalRef.current)
    setRecording(false)
    useTranscriptStore.getState().clearInterim()
  }, [setRecording])

  return { startSimulation, stopSimulation, isRunning: isRunningRef }
}
