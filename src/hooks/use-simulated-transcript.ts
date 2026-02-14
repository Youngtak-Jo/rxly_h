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
  instantInsert?: boolean
}

const DEFAULT_OPTIONS: SimulationOptions = {
  speedFactor: 0.5,
  skipInterim: true,
  scenario: SCENARIOS[0].entries,
  instantInsert: false,
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
  const isPausedRef = useRef(false)
  const currentIndexRef = useRef(0)
  const optionsRef = useRef<SimulationOptions>(DEFAULT_OPTIONS)
  const sessionIdRef = useRef("")
  const runningTimeRef = useRef(0)

  const { setRecording, setDuration } = useRecordingStore()
  const { triggerAnalysis, runFinalAnalysis } = useLiveInsights()

  // Stable refs for controls to avoid circular dependency
  const pauseRef = useRef<() => void>(() => {})
  const resumeRef = useRef<() => void>(() => {})
  const stopRef = useRef<(options?: { skipFinalAnalysis?: boolean }) => void>(() => {})

  const processEntry = useCallback(
    (index: number) => {
      const opts = optionsRef.current
      const entries = opts.scenario
      const sessionId = sessionIdRef.current

      // All entries processed — end simulation
      if (index >= entries.length) {
        const t = setTimeout(() => {
          // Safety net: abort if session has changed since this timeout was scheduled
          const currentSession = useSessionStore.getState().activeSession
          if (!currentSession || currentSession.id !== sessionId) return

          // Run forced final analysis FIRST (sets isProcessing gate synchronously)
          // so waitForInsightsToComplete() in useLiveRecord will block until done
          runFinalAnalysis()

          const store = useRecordingStore.getState()
          store.setRecording(false)
          store.setSimulating(false)
          store.setSimulationControls(null)
          isRunningRef.current = false
          if (durationIntervalRef.current)
            clearInterval(durationIntervalRef.current)
        }, 1000)
        timeoutsRef.current.push(t)
        return
      }

      const mockEntry = entries[index]
      const entryDelay = mockEntry.delayMs * opts.speedFactor
      const words = mockEntry.text.split(" ")
      const capturedRawSpeakerId = mockEntry.rawSpeakerId
      const capturedText = mockEntry.text

      // Phase 1: Interim text build-up
      if (!opts.skipInterim) {
        for (let w = 1; w <= words.length; w++) {
          const chunk = words.slice(0, w).join(" ")
          const interimDelay =
            entryDelay + w * INTERIM_WORD_STEP_MS * opts.speedFactor
          const t = setTimeout(() => {
            const speaker = resolveSpeaker(capturedRawSpeakerId)
            useTranscriptStore.getState().setInterimText(chunk, speaker)
          }, interimDelay)
          timeoutsRef.current.push(t)
        }
      }

      // Phase 2: Finalize entry
      const finalizeDelay = opts.skipInterim
        ? entryDelay + 100
        : entryDelay +
          words.length * INTERIM_WORD_STEP_MS * opts.speedFactor +
          100

      const entryStartTime = runningTimeRef.current
      runningTimeRef.current += words.length * 0.3
      const entryEndTime = runningTimeRef.current

      const capturedStartTime = entryStartTime
      const capturedEndTime = entryEndTime

      const t2 = setTimeout(() => {
        // Safety net: abort if session has changed since this timeout was scheduled
        const currentSession = useSessionStore.getState().activeSession
        if (!currentSession || currentSession.id !== sessionId) return

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

        // Phase 3: Trigger analysis at speaker changes or every 4 entries
        const isLastEntry = index === entries.length - 1
        const nextEntry = entries[index + 1]
        const isSpeakerChange =
          nextEntry && nextEntry.rawSpeakerId !== mockEntry.rawSpeakerId
        const isNaturalPause = (index + 1) % 4 === 0

        if (isLastEntry || isSpeakerChange || isNaturalPause) {
          triggerAnalysis()
        }

        // Save progress and schedule next entry (only if not paused)
        currentIndexRef.current = index + 1

        if (!isPausedRef.current) {
          const t3 = setTimeout(() => {
            processEntry(index + 1)
          }, 300)
          timeoutsRef.current.push(t3)
        }
      }, finalizeDelay)
      timeoutsRef.current.push(t2)
    },
    [triggerAnalysis, runFinalAnalysis]
  )

  const pauseSimulation = useCallback(() => {
    isPausedRef.current = true

    // Clear all pending timeouts for the current entry's phases
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []

    // Clear interim text (partial word display)
    useTranscriptStore.getState().clearInterim()

    // Update store
    useRecordingStore.getState().setPaused(true)
  }, [])

  const resumeSimulation = useCallback(() => {
    isPausedRef.current = false

    // Update store
    useRecordingStore.getState().setPaused(false)

    // Resume from the saved index
    processEntry(currentIndexRef.current)
  }, [processEntry])

  const stopSimulation = useCallback(
    (options?: { skipFinalAnalysis?: boolean }) => {
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
      isRunningRef.current = false
      isPausedRef.current = false
      currentIndexRef.current = 0
      runningTimeRef.current = 0

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }

      // Run forced final analysis BEFORE stopping recording
      // Skip when stopping due to session switch to avoid race conditions
      if (!options?.skipFinalAnalysis) {
        runFinalAnalysis()
      }

      const store = useRecordingStore.getState()
      store.setRecording(false)
      store.setSimulating(false)
      store.setSimulationControls(null)
      useTranscriptStore.getState().clearInterim()
    },
    [runFinalAnalysis]
  )

  // Keep stable refs up to date
  pauseRef.current = pauseSimulation
  resumeRef.current = resumeSimulation
  stopRef.current = stopSimulation

  const instantInsertAll = useCallback(
    async (entries: MockEntry[], sessionId: string) => {
      const { addFinalEntry, clearInterim } = useTranscriptStore.getState()
      let runningTime = 0

      const transcriptEntries = entries.map((mockEntry) => {
        const speaker = resolveSpeaker(mockEntry.rawSpeakerId)
        const wordCount = mockEntry.text.split(" ").length
        const startTime = runningTime
        runningTime += wordCount * 0.3
        const endTime = runningTime

        const entryId = uuid()
        const entry = {
          id: entryId,
          sessionId,
          speaker,
          rawSpeakerId: mockEntry.rawSpeakerId,
          text: mockEntry.text,
          startTime,
          endTime,
          confidence: 0.95 + Math.random() * 0.05,
          isFinal: true as const,
          createdAt: new Date().toISOString(),
        }

        addFinalEntry(entry)
        return entry
      })

      clearInterim()

      // POST all entries to the API in parallel
      await Promise.allSettled(
        transcriptEntries.map((entry) =>
          fetch(`/api/sessions/${sessionId}/transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: entry.id,
              speaker: entry.speaker,
              text: entry.text,
              startTime: entry.startTime,
              endTime: entry.endTime,
              confidence: entry.confidence,
              rawSpeakerId: entry.rawSpeakerId,
            }),
          })
        )
      )

      // Run forced final analysis BEFORE stopping recording
      runFinalAnalysis()

      // End simulation
      const store = useRecordingStore.getState()
      store.setRecording(false)
      store.setSimulating(false)
      store.setSimulationControls(null)
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current)
      isRunningRef.current = false
    },
    [runFinalAnalysis]
  )

  const startSimulation = useCallback(
    (options: Partial<SimulationOptions> = {}) => {
      if (isRunningRef.current) return
      isRunningRef.current = true
      isPausedRef.current = false

      const opts = { ...DEFAULT_OPTIONS, ...options }
      optionsRef.current = opts

      const sessionId = useSessionStore.getState().activeSession?.id || ""
      if (!sessionId) {
        console.error("No active session for simulation")
        isRunningRef.current = false
        return
      }
      sessionIdRef.current = sessionId
      currentIndexRef.current = 0
      runningTimeRef.current = 0

      useTranscriptStore.getState().reset()
      setRecording(true)
      setDuration(0)

      // Register simulation mode and controls in store
      const store = useRecordingStore.getState()
      store.setSimulating(true)
      store.setSimulationControls({
        pause: () => pauseRef.current(),
        resume: () => resumeRef.current(),
        stop: (options) => stopRef.current(options),
      })

      // Instant insert: dump all entries at once
      if (opts.instantInsert) {
        instantInsertAll(opts.scenario, sessionId)
        return
      }

      // Duration timer (skips incrementing when paused)
      durationIntervalRef.current = setInterval(() => {
        const s = useRecordingStore.getState()
        if (!s.isRecording || s.isPaused) return
        s.setDuration(s.duration + 1)
      }, 1000)

      // Start processing from entry 0
      processEntry(0)
    },
    [setRecording, setDuration, processEntry, instantInsertAll]
  )

  return {
    startSimulation,
    stopSimulation,
    pauseSimulation,
    resumeSimulation,
    isRunning: isRunningRef,
  }
}
