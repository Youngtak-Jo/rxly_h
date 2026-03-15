import { describe, expect, it } from "vitest"
import { sortSessionsForList } from "@/lib/session-order"
import type { Session } from "@/types/session"

function buildSession(overrides: Partial<Session>): Session {
  return {
    id: overrides.id ?? "session-id",
    title: overrides.title ?? "General Follow-up",
    patientName: overrides.patientName ?? null,
    mode: overrides.mode ?? "DOCTOR",
    startedAt: overrides.startedAt ?? "2026-03-12T00:00:00.000Z",
    endedAt: overrides.endedAt ?? null,
    createdAt: overrides.createdAt ?? "2026-03-12T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-12T00:00:00.000Z",
  }
}

describe("sortSessionsForList", () => {
  it("keeps example sessions at the bottom even if they are newer", () => {
    const sessions = sortSessionsForList([
      buildSession({
        id: "example-new",
        title: "Example · Chest Pain Evaluation",
        startedAt: "2026-03-12T11:00:00.000Z",
      }),
      buildSession({
        id: "regular-old",
        title: "Hypertension Follow-up",
        startedAt: "2026-03-10T11:00:00.000Z",
      }),
      buildSession({
        id: "regular-new",
        title: "Asthma Review",
        startedAt: "2026-03-12T10:00:00.000Z",
      }),
      buildSession({
        id: "example-old",
        title: "Example · Type 2 Diabetes Management",
        startedAt: "2026-03-09T11:00:00.000Z",
      }),
    ])

    expect(sessions.map((session) => session.id)).toEqual([
      "regular-new",
      "regular-old",
      "example-new",
      "example-old",
    ])
  })
})
