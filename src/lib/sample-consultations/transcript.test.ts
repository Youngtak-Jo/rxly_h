import { describe, expect, it } from "vitest"
import { buildSampleTranscriptEntriesFromScenario } from "@/lib/sample-consultations/transcript"

describe("sample consultation transcript derivation", () => {
  it("maps scenario entries to identified speakers with monotonic timing", () => {
    const { entries, totalDurationMs } = buildSampleTranscriptEntriesFromScenario({
      sessionId: "session-1",
      startedAt: "2026-03-12T00:00:00.000Z",
      entries: [
        {
          rawSpeakerId: 0,
          text: "Tell me more about the chest pain.",
          delayMs: 900,
        },
        {
          rawSpeakerId: 1,
          text: "It gets worse when I climb stairs.",
          delayMs: 1200,
        },
        {
          rawSpeakerId: 7,
          text: "ambient noise",
          delayMs: 500,
        },
      ],
    })

    expect(entries).toHaveLength(3)
    expect(totalDurationMs).toBeGreaterThan(0)
    expect(entries[0]?.speaker).toBe("DOCTOR")
    expect(entries[1]?.speaker).toBe("PATIENT")
    expect(entries[2]?.speaker).toBe("UNKNOWN")
    expect(entries.every((entry) => entry.isFinal)).toBe(true)

    for (let index = 1; index < entries.length; index += 1) {
      expect(entries[index]!.startTime).toBeGreaterThan(entries[index - 1]!.startTime)
      expect(entries[index]!.endTime).toBeGreaterThan(entries[index]!.startTime)
      expect(
        new Date(entries[index]!.createdAt).getTime()
      ).toBeGreaterThanOrEqual(new Date(entries[index - 1]!.createdAt).getTime())
    }
  })
})
