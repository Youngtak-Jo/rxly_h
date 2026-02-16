"use client"

import { useEffect, useRef } from "react"
import { useSessionStore } from "@/stores/session-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useRecordStore } from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useNoteStore } from "@/stores/note-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useResearchStore } from "@/stores/research-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import type { TranscriptEntry, DiagnosticKeyword } from "@/types/session"
import type { Session } from "@/types/session"
import type { ChecklistItem, DiagnosisCitation } from "@/types/insights"
import type { ConsultationRecord } from "@/types/record"

// ── Types for full session API response ──────────────────────────

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

interface FullSessionResponse extends Session {
    insights?: SessionInsights | null
    diagnoses?: SessionDiagnosis[]
    record?: ConsultationRecord | null
    checklistItems?: ChecklistItem[]
}

interface NoteData {
    id: string
    content: string
    imageUrls: string[]
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

// ── In-memory cache ──────────────────────────────────────────────

interface CachedSessionData {
    session: FullSessionResponse
    transcriptEntries: TranscriptEntry[]
    notes: NoteData[]
    researchMessages: ResearchMessageData[]
    timestamp: number
}

const sessionCache = new Map<string, CachedSessionData>()
const MAX_CACHE_SIZE = 5
const CACHE_TTL_MS = 5 * 60 * 1000

export function getCachedSession(sessionId: string): CachedSessionData | null {
    const cached = sessionCache.get(sessionId)
    if (!cached) return null
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        sessionCache.delete(sessionId)
        return null
    }
    return cached
}

export function setCachedSession(sessionId: string, data: Omit<CachedSessionData, "timestamp">) {
    if (sessionCache.size >= MAX_CACHE_SIZE && !sessionCache.has(sessionId)) {
        const oldestKey = sessionCache.keys().next().value
        if (oldestKey) sessionCache.delete(oldestKey)
    }
    sessionCache.set(sessionId, { ...data, timestamp: Date.now() })
}

export function deleteCachedSession(sessionId: string) {
    sessionCache.delete(sessionId)
}

// ── Restore all stores from session data ─────────────────────────

function restoreStores(
    session: FullSessionResponse,
    transcriptEntries: TranscriptEntry[],
    notes: NoteData[],
    researchMessages: ResearchMessageData[],
) {
    const transcriptStore = useTranscriptStore.getState()
    const insightsStore = useInsightsStore.getState()
    const ddxStore = useDdxStore.getState()
    const recordStore = useRecordStore.getState()
    const noteStore = useNoteStore.getState()
    const researchStore = useResearchStore.getState()
    const recordingStore = useRecordingStore.getState()

    useConsultationTabStore.getState().clearAllUnseenUpdates()
    useConsultationModeStore.getState().reset()
    recordingStore.reset()

    // Restore AI doctor mode from DB
    if (session.mode === "AI_DOCTOR") {
        const modeStore = useConsultationModeStore.getState()
        modeStore.setMode("ai-doctor")

        if (transcriptEntries?.length > 0) {
            modeStore.setConsultationStarted(true)
            for (const entry of transcriptEntries) {
                modeStore.addMessage(
                    entry.speaker === "DOCTOR" ? "assistant" : "user",
                    entry.text
                )
            }
        }
    }

    useSessionStore.getState().setActiveSession(session)

    // Transcript
    transcriptStore.reset()
    if (transcriptEntries?.length > 0) {
        transcriptStore.loadEntries(transcriptEntries)
    }
    if (session.mode === "AI_DOCTOR") {
        transcriptStore.setIdentificationStatus("identified")
    }
    const savedKeywords = session.insights?.diagnosticKeywords
    if (Array.isArray(savedKeywords) && savedKeywords.length > 0) {
        transcriptStore.setDiagnosticKeywords(savedKeywords)
    }

    // Insights
    insightsStore.reset()
    if (session.insights) {
        insightsStore.loadFromDB({
            summary: session.insights.summary || "",
            keyFindings: session.insights.keyFindings || [],
            redFlags: session.insights.redFlags || [],
            checklistItems: session.checklistItems || [],
        })
    }

    // DDx
    ddxStore.reset()
    if (session.diagnoses && session.diagnoses.length > 0) {
        ddxStore.loadFromDB(
            session.diagnoses.map((dx) => ({
                id: dx.id,
                sessionId: dx.sessionId,
                icdCode: dx.icdCode,
                icdUri: dx.icdUri,
                diseaseName: dx.diseaseName,
                confidence: dx.confidence.toLowerCase() as "high" | "moderate" | "low",
                evidence: dx.evidence,
                citations: (dx.citations || []) as DiagnosisCitation[],
                sortOrder: dx.sortOrder,
            }))
        )
    }

    // Record
    recordStore.reset()
    if (session.record) {
        recordStore.loadFromDB(session.record)
    }

    // Notes
    noteStore.reset()
    if (notes?.length > 0) {
        noteStore.loadNotes(
            notes.map((n) => ({
                id: n.id,
                content: n.content,
                imageUrls: n.imageUrls || [],
                storagePaths: [],
                source: n.source as "MANUAL" | "STT" | "IMAGE",
                createdAt: n.createdAt,
            }))
        )
    }

    // Research
    researchStore.reset()
    if (researchMessages?.length > 0) {
        researchStore.loadFromDB(
            researchMessages.map((m) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                citations:
                    (typeof m.citations === "string"
                        ? JSON.parse(m.citations)
                        : m.citations) || [],
                createdAt: m.createdAt,
            }))
        )
    }
}

// ── loadSession (imperative, for nav-sessions click) ─────────────

export async function loadSessionById(sessionId: string): Promise<boolean> {
    const store = useSessionStore.getState()
    const activeSession = store.activeSession
    if (activeSession?.id === sessionId) return true

    // Stop any running simulation
    const recState = useRecordingStore.getState()
    if (recState.isSimulating && recState.simulationControls) {
        recState.simulationControls.stop({ skipFinalAnalysis: true })
    }

    if (activeSession) {
        store.setSwitching(true)
    } else {
        store.setLoading(true)
    }

    try {
        const cached = getCachedSession(sessionId)
        let session: FullSessionResponse
        let transcriptEntries: TranscriptEntry[]
        let notes: NoteData[]
        let researchMessages: ResearchMessageData[]

        if (cached) {
            ; ({ session, transcriptEntries, notes, researchMessages } = cached)
        } else {
            const res = await fetch(`/api/sessions/${sessionId}/full`)
            if (!res.ok) throw new Error("Failed to load session")
                ; ({ session, transcriptEntries, notes, researchMessages } = await res.json())
            setCachedSession(sessionId, { session, transcriptEntries, notes, researchMessages })
        }

        restoreStores(session, transcriptEntries, notes, researchMessages)
        return true
    } catch (error) {
        console.error("Failed to load session:", error)
        const { toast } = await import("sonner")
        toast.error("Failed to load session")
        return false
    } finally {
        const s = useSessionStore.getState()
        s.setLoading(false)
        s.setSwitching(false)
    }
}

// ── useSessionLoader hook (for [id] route auto-load on mount) ────

export function useSessionLoader(sessionId: string | null) {
    const activeSessionId = useSessionStore((s) => s.activeSession?.id)
    const loadedRef = useRef<string | null>(null)

    useEffect(() => {
        if (!sessionId) return
        // Already loaded this session
        if (activeSessionId === sessionId) {
            loadedRef.current = sessionId
            return
        }
        // Prevent duplicate loads
        if (loadedRef.current === sessionId) return
        loadedRef.current = sessionId

        loadSessionById(sessionId)
    }, [sessionId, activeSessionId])
}
