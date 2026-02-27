export type ClientEventType =
  | "tab_switched"
  | "recording_started"
  | "recording_stopped"
  | "note_submitted"
  | "image_uploaded"
  | "export_clicked"
  | "analysis_triggered"
  | "analysis_completed"
  | "analysis_failed"

interface TrackClientEventInput {
  eventType: ClientEventType
  feature: string
  sessionId?: string | null
  metadata?: Record<string, unknown>
}

const DEDUPE_WINDOW_MS = 2_000
const recentEvents = new Map<string, number>()

function shouldSkip(key: string): boolean {
  const now = Date.now()
  const previous = recentEvents.get(key)
  if (previous && now - previous < DEDUPE_WINDOW_MS) {
    return true
  }

  recentEvents.set(key, now)
  for (const [k, ts] of recentEvents.entries()) {
    if (now - ts > DEDUPE_WINDOW_MS * 2) {
      recentEvents.delete(k)
    }
  }

  return false
}

export function trackClientEvent(input: TrackClientEventInput): void {
  if (typeof window === "undefined") return

  const payload = {
    eventType: input.eventType,
    feature: input.feature,
    sessionId: input.sessionId ?? null,
    metadata: input.metadata ?? {},
  }

  const dedupeKey = `${payload.eventType}:${payload.feature}:${payload.sessionId ?? "none"}`
  if (shouldSkip(dedupeKey)) return

  const body = JSON.stringify(payload)
  if (body.length > 8_000) return

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" })
      if (navigator.sendBeacon("/api/events/client", blob)) return
    }
  } catch {
    // fall through to fetch
  }

  void fetch("/api/events/client", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // noop
  })
}
