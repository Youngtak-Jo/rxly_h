"use client"

import { useEffect, useRef } from "react"
import type { ChecklistItem, DiagnosisCitation } from "@/types/insights"
import type { ConsultationRecord } from "@/types/record"
import type { DiagnosticKeyword, Session, TranscriptEntry } from "@/types/session"
import {
  useConsultationModeStore,
  type AiDoctorMessage,
} from "@/stores/consultation-mode-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useNoteStore, type NoteEntry } from "@/stores/note-store"
import { useRecordStore } from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
import {
  useResearchStore,
  type ResearchMessage,
} from "@/stores/research-store"
import { useSessionStore } from "@/stores/session-store"
import { useTranscriptStore } from "@/stores/transcript-store"

interface SessionInsights {
  summary?: string
  keyFindings?: string[]
  redFlags?: string[]
  diagnosticKeywords?: DiagnosticKeyword[]
  [key: string]: unknown
}

interface SessionDiagnosis {
  id: string
  sessionId: string
  icdCode: string
  icdUri?: string
  diseaseName: string
  confidence: string
  evidence: string
  citations: unknown
  sortOrder: number
}

export interface CoreSessionResponse extends Session {
  insights?: SessionInsights | null
  diagnoses?: SessionDiagnosis[]
  record?: ConsultationRecord | null
  checklistItems?: ChecklistItem[]
}

interface NoteData {
  id: string
  content: string
  imageUrls: string[]
  storagePaths: string[]
  source: string
  createdAt: string
}

interface ResearchMessageData {
  id: string
  role: string
  content: string
  citations: unknown
  createdAt: string
}

export interface FullSessionResponse {
  session: CoreSessionResponse
  transcriptEntries: TranscriptEntry[]
  notes: NoteData[]
  researchMessages: ResearchMessageData[]
}

interface CachedCoreSessionData {
  session: CoreSessionResponse
  timestamp: number
}

interface CachedSessionData extends FullSessionResponse {
  timestamp: number
}

const coreSessionCache = new Map<string, CachedCoreSessionData>()
const sessionCache = new Map<string, CachedSessionData>()

const MAX_CORE_CACHE_SIZE = 20
const CORE_CACHE_TTL_MS = 2 * 60 * 1000
const MAX_FULL_CACHE_SIZE = 5
const FULL_CACHE_TTL_MS = 5 * 60 * 1000

const inFlightCoreRequests = new Map<string, Promise<CoreSessionResponse>>()
const inFlightFullRequests = new Map<
  string,
  { promise: Promise<FullSessionResponse>; controller: AbortController }
>()

let activeHydrationSessionId: string | null = null

function pruneCache<K, V>(cache: Map<K, V>, maxSize: number) {
  if (cache.size < maxSize) return
  const oldestKey = cache.keys().next().value
  if (oldestKey !== undefined) {
    cache.delete(oldestKey)
  }
}

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
}

function normalizeConfidence(
  confidence: string
): "high" | "moderate" | "low" {
  const normalized = confidence.toLowerCase()
  if (
    normalized === "high" ||
    normalized === "moderate" ||
    normalized === "low"
  ) {
    return normalized
  }
  return "moderate"
}

function buildAiDoctorMessages(
  transcriptEntries: TranscriptEntry[]
): AiDoctorMessage[] {
  return transcriptEntries.map((entry) => ({
    id: entry.id,
    role: entry.speaker === "DOCTOR" ? "assistant" : "user",
    content: entry.text,
    createdAt: entry.createdAt,
  }))
}

function mapNotesToStoreEntries(notes: NoteData[]): NoteEntry[] {
  return notes.map((note) => ({
    id: note.id,
    content: note.content,
    imageUrls: note.imageUrls || [],
    storagePaths: note.storagePaths || [],
    source: note.source as "MANUAL" | "STT" | "IMAGE",
    createdAt: note.createdAt,
  }))
}

function mapResearchToStoreEntries(
  researchMessages: ResearchMessageData[]
): ResearchMessage[] {
  return researchMessages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant",
    content: message.content,
    citations:
      (typeof message.citations === "string"
        ? JSON.parse(message.citations)
        : message.citations) || [],
    createdAt: message.createdAt,
  }))
}

function mergeNotesWithLocal(incomingNotes: NoteEntry[]): NoteEntry[] {
  const localNotes = useNoteStore.getState().notes
  if (localNotes.length === 0) {
    return sortByCreatedAt(incomingNotes)
  }

  const localById = new Map(localNotes.map((note) => [note.id, note]))

  const mergedIncoming = incomingNotes.map((incoming) => {
    const local = localById.get(incoming.id)
    if (!local) return incoming
    return {
      ...incoming,
      ...local,
      imageUrls: local.imageUrls.length > 0 ? local.imageUrls : incoming.imageUrls,
      storagePaths:
        local.storagePaths.length > 0 ? local.storagePaths : incoming.storagePaths,
    }
  })

  const incomingIds = new Set(incomingNotes.map((note) => note.id))
  const localOnly = localNotes.filter((note) => !incomingIds.has(note.id))

  return sortByCreatedAt([...mergedIncoming, ...localOnly])
}

function mergeResearchWithLocal(
  incomingMessages: ResearchMessage[]
): ResearchMessage[] {
  const localMessages = useResearchStore.getState().messages
  if (localMessages.length === 0) {
    return sortByCreatedAt(incomingMessages)
  }

  const localById = new Map(localMessages.map((message) => [message.id, message]))

  const mergedIncoming = incomingMessages.map((incoming) => {
    const local = localById.get(incoming.id)
    if (!local) return incoming
    return {
      ...incoming,
      ...local,
      citations: local.citations.length > 0 ? local.citations : incoming.citations,
    }
  })

  const incomingIds = new Set(incomingMessages.map((message) => message.id))
  const localOnly = localMessages.filter((message) => !incomingIds.has(message.id))

  return sortByCreatedAt([...mergedIncoming, ...localOnly])
}

export function getCoreCachedSession(
  sessionId: string
): CoreSessionResponse | null {
  const cached = coreSessionCache.get(sessionId)
  if (!cached) return null

  if (Date.now() - cached.timestamp > CORE_CACHE_TTL_MS) {
    coreSessionCache.delete(sessionId)
    return null
  }

  return cached.session
}

export function setCoreCachedSession(
  sessionId: string,
  session: CoreSessionResponse
) {
  if (!coreSessionCache.has(sessionId)) {
    pruneCache(coreSessionCache, MAX_CORE_CACHE_SIZE)
  }
  coreSessionCache.set(sessionId, { session, timestamp: Date.now() })
}

export function getCachedSession(sessionId: string): FullSessionResponse | null {
  const cached = sessionCache.get(sessionId)
  if (!cached) return null

  if (Date.now() - cached.timestamp > FULL_CACHE_TTL_MS) {
    sessionCache.delete(sessionId)
    return null
  }

  return {
    session: cached.session,
    transcriptEntries: cached.transcriptEntries,
    notes: cached.notes,
    researchMessages: cached.researchMessages,
  }
}

export function setCachedSession(
  sessionId: string,
  data: Omit<CachedSessionData, "timestamp">
) {
  if (!sessionCache.has(sessionId)) {
    pruneCache(sessionCache, MAX_FULL_CACHE_SIZE)
  }
  sessionCache.set(sessionId, { ...data, timestamp: Date.now() })
}

function abortInFlightFullRequest(sessionId: string | null) {
  if (!sessionId) return
  const inFlight = inFlightFullRequests.get(sessionId)
  if (!inFlight) return

  inFlight.controller.abort()
  inFlightFullRequests.delete(sessionId)
}

export function deleteCachedSession(sessionId: string) {
  coreSessionCache.delete(sessionId)
  sessionCache.delete(sessionId)
  abortInFlightFullRequest(sessionId)
}

function restoreCoreStores(session: CoreSessionResponse) {
  const transcriptStore = useTranscriptStore.getState()
  const insightsStore = useInsightsStore.getState()
  const ddxStore = useDdxStore.getState()
  const recordStore = useRecordStore.getState()
  const noteStore = useNoteStore.getState()
  const researchStore = useResearchStore.getState()
  const recordingStore = useRecordingStore.getState()
  const consultationModeStore = useConsultationModeStore.getState()

  useConsultationTabStore.getState().clearAllUnseenUpdates()
  consultationModeStore.reset()
  if (session.mode === "AI_DOCTOR") {
    consultationModeStore.setMode("ai-doctor")
  }
  recordingStore.reset()

  useSessionStore.getState().setActiveSession(session)

  transcriptStore.reset()
  noteStore.reset()
  researchStore.reset()

  insightsStore.reset()
  if (session.insights) {
    insightsStore.loadFromDB({
      summary: session.insights.summary || "",
      keyFindings: session.insights.keyFindings || [],
      redFlags: session.insights.redFlags || [],
      checklistItems: session.checklistItems || [],
    })
  }

  ddxStore.reset()
  if (session.diagnoses && session.diagnoses.length > 0) {
    ddxStore.loadFromDB(
      session.diagnoses.map((dx) => ({
        id: dx.id,
        sessionId: dx.sessionId,
        icdCode: dx.icdCode,
        icdUri: dx.icdUri,
        diseaseName: dx.diseaseName,
        confidence: normalizeConfidence(dx.confidence),
        evidence: dx.evidence,
        citations: (dx.citations || []) as DiagnosisCitation[],
        sortOrder: dx.sortOrder,
      }))
    )
  }

  recordStore.reset()
  if (session.record) {
    recordStore.loadFromDB(session.record)
  }
}

function hydrateHeavyStores(fullSession: FullSessionResponse) {
  const { session, transcriptEntries, notes, researchMessages } = fullSession
  const transcriptStore = useTranscriptStore.getState()
  const noteStore = useNoteStore.getState()
  const researchStore = useResearchStore.getState()
  const consultationModeStore = useConsultationModeStore.getState()

  transcriptStore.reset()
  if (transcriptEntries.length > 0) {
    transcriptStore.loadEntries(transcriptEntries)
  }
  if (session.mode === "AI_DOCTOR") {
    transcriptStore.setIdentificationStatus("identified")
  }

  const diagnosticKeywords = session.insights?.diagnosticKeywords
  if (Array.isArray(diagnosticKeywords) && diagnosticKeywords.length > 0) {
    transcriptStore.setDiagnosticKeywords(diagnosticKeywords)
  }

  if (session.mode === "AI_DOCTOR") {
    consultationModeStore.setMode("ai-doctor")
    consultationModeStore.setConsultationStarted(transcriptEntries.length > 0)
    consultationModeStore.setMessages(buildAiDoctorMessages(transcriptEntries))
  } else {
    consultationModeStore.setMessages([])
    consultationModeStore.setConsultationStarted(false)
  }

  const mergedNotes = mergeNotesWithLocal(mapNotesToStoreEntries(notes))
  noteStore.loadNotes(mergedNotes)

  const mergedResearch = mergeResearchWithLocal(
    mapResearchToStoreEntries(researchMessages)
  )
  researchStore.loadFromDB(mergedResearch)
}

async function fetchCoreSessionById(sessionId: string): Promise<CoreSessionResponse> {
  const cached = getCoreCachedSession(sessionId)
  if (cached) return cached

  const inFlight = inFlightCoreRequests.get(sessionId)
  if (inFlight) return inFlight

  const request = (async () => {
    const res = await fetch(`/api/sessions/${sessionId}`)
    if (!res.ok) throw new Error("Failed to load core session")
    const coreSession = (await res.json()) as CoreSessionResponse
    setCoreCachedSession(sessionId, coreSession)
    return coreSession
  })().finally(() => {
    inFlightCoreRequests.delete(sessionId)
  })

  inFlightCoreRequests.set(sessionId, request)
  return request
}

async function fetchFullSessionById(sessionId: string): Promise<FullSessionResponse> {
  const cached = getCachedSession(sessionId)
  if (cached) return cached

  const inFlight = inFlightFullRequests.get(sessionId)
  if (inFlight) return inFlight.promise

  const controller = new AbortController()

  const request = (async () => {
    const res = await fetch(`/api/sessions/${sessionId}/full`, {
      signal: controller.signal,
    })
    if (!res.ok) throw new Error("Failed to load full session")

    const fullSession = (await res.json()) as FullSessionResponse
    setCachedSession(sessionId, fullSession)
    setCoreCachedSession(sessionId, fullSession.session)
    return fullSession
  })().finally(() => {
    const current = inFlightFullRequests.get(sessionId)
    if (current?.promise === request) {
      inFlightFullRequests.delete(sessionId)
    }
  })

  inFlightFullRequests.set(sessionId, { promise: request, controller })
  return request
}

export async function prefetchCoreSessionById(
  sessionId: string,
  signal?: AbortSignal
): Promise<void> {
  if (getCoreCachedSession(sessionId)) return

  if (!signal) {
    try {
      await fetchCoreSessionById(sessionId)
    } catch {
      // Best-effort prefetch only.
    }
    return
  }

  try {
    const res = await fetch(`/api/sessions/${sessionId}`, { signal })
    if (!res.ok) return
    const coreSession = (await res.json()) as CoreSessionResponse
    setCoreCachedSession(sessionId, coreSession)
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") return
  }
}

export async function loadSessionById(sessionId: string): Promise<boolean> {
  const store = useSessionStore.getState()
  const activeSession = store.activeSession
  if (activeSession?.id === sessionId) return true

  const recordingState = useRecordingStore.getState()
  if (recordingState.isSimulating && recordingState.simulationControls) {
    recordingState.simulationControls.stop({ skipFinalAnalysis: true })
  }

  if (activeSession) {
    store.setSwitching(true)
  } else {
    store.setLoading(true)
  }
  store.setHydratingSessionId(null)

  const requestStart = performance.now()

  try {
    const cachedFullSession = getCachedSession(sessionId)
    if (cachedFullSession) {
      restoreCoreStores(cachedFullSession.session)
      hydrateHeavyStores(cachedFullSession)

      if (process.env.NODE_ENV !== "production") {
        const fullHydratedMs = performance.now() - requestStart
        console.debug(
          `[session-loader] fullHydratedMs=${fullHydratedMs.toFixed(1)} (cache hit)`,
          { sessionId }
        )
      }

      return true
    }

    const coreSession = await fetchCoreSessionById(sessionId)
    restoreCoreStores(coreSession)

    const coreLoadedMs = performance.now() - requestStart
    const currentStore = useSessionStore.getState()
    currentStore.setLoading(false)
    currentStore.setSwitching(false)
    currentStore.setHydratingSessionId(sessionId)

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[session-loader] coreLoadedMs=${coreLoadedMs.toFixed(1)}`, {
        sessionId,
      })
    }

    if (activeHydrationSessionId && activeHydrationSessionId !== sessionId) {
      abortInFlightFullRequest(activeHydrationSessionId)
    }
    activeHydrationSessionId = sessionId
    const hydrateStart = performance.now()

    void fetchFullSessionById(sessionId)
      .then((fullSession) => {
        if (useSessionStore.getState().activeSession?.id !== sessionId) return

        hydrateHeavyStores(fullSession)

        if (process.env.NODE_ENV !== "production") {
          const fullHydratedMs = performance.now() - hydrateStart
          console.debug(
            `[session-loader] fullHydratedMs=${fullHydratedMs.toFixed(1)}`,
            { sessionId }
          )
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        console.error("Failed to hydrate full session:", error)
      })
      .finally(() => {
        if (activeHydrationSessionId === sessionId) {
          activeHydrationSessionId = null
          useSessionStore.getState().setHydratingSessionId(null)
        }
      })

    return true
  } catch (error) {
    console.error("Failed to load session:", error)
    const { toast } = await import("sonner")
    toast.error("Failed to load session")
    useSessionStore.getState().setHydratingSessionId(null)
    return false
  } finally {
    const latestStore = useSessionStore.getState()
    latestStore.setLoading(false)
    latestStore.setSwitching(false)
  }
}

export function useSessionLoader(sessionId: string | null) {
  const activeSessionId = useSessionStore((s) => s.activeSession?.id)
  const loadedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    if (activeSessionId === sessionId) {
      loadedRef.current = sessionId
      return
    }

    if (loadedRef.current === sessionId) return
    loadedRef.current = sessionId

    void loadSessionById(sessionId)
  }, [sessionId, activeSessionId])
}
