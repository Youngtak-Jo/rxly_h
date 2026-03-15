import { randomUUID } from "node:crypto"
import { SCENARIOS } from "@/data/scenarios"
import type { MockEntry } from "@/data/scenarios"
import type { Speaker, TranscriptEntry } from "@/types/session"

function resolveScenarioEntrySpeaker(rawSpeakerId: number): Speaker {
  if (rawSpeakerId === 0) return "DOCTOR"
  if (rawSpeakerId === 1) return "PATIENT"
  return "UNKNOWN"
}

function estimateEntryDurationMs(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1800, wordCount * 420)
}

export interface DerivedSampleTranscript {
  entries: TranscriptEntry[]
  totalDurationMs: number
}

export function buildSampleTranscriptEntries(args: {
  scenarioId: string
  sessionId: string
  startedAt: string
}): DerivedSampleTranscript {
  const scenario = SCENARIOS.find((candidate) => candidate.id === args.scenarioId)
  if (!scenario) {
    throw new Error(`Unknown sample scenario: ${args.scenarioId}`)
  }

  return buildSampleTranscriptEntriesFromScenario({
    entries: scenario.entries,
    sessionId: args.sessionId,
    startedAt: args.startedAt,
  })
}

export function buildSampleTranscriptEntriesFromScenario(args: {
  entries: MockEntry[]
  sessionId: string
  startedAt: string
}): DerivedSampleTranscript {
  const startedAtMs = new Date(args.startedAt).getTime()
  let cursorMs = 0

  const entries = args.entries.map((entry) => {
    const startMs = cursorMs
    const durationMs = estimateEntryDurationMs(entry.text)
    const endMs = startMs + durationMs
    cursorMs = endMs + entry.delayMs

    return {
      id: randomUUID(),
      sessionId: args.sessionId,
      speaker: resolveScenarioEntrySpeaker(entry.rawSpeakerId),
      rawSpeakerId: entry.rawSpeakerId,
      text: entry.text,
      startTime: startMs / 1000,
      endTime: endMs / 1000,
      confidence: 0.99,
      isFinal: true,
      createdAt: new Date(startedAtMs + endMs).toISOString(),
    } satisfies TranscriptEntry
  })

  return {
    entries,
    totalDurationMs: cursorMs,
  }
}
