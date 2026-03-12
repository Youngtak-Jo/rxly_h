"use client"

import { create } from "zustand"
import type { RichTextDocument } from "@/lib/documents/rich-text"

export interface ActiveConsultationDocumentDraft {
  sessionId: string
  documentId: string
  draftDocument: RichTextDocument
  draftTitle: string
  isStreaming: boolean
  streamRequestId: string | null
  dirty: boolean
  lastPersistedRevision: string | null
  sanitizedHtmlBuffer?: string
  lastRenderableDocument?: RichTextDocument | null
  finalReconcilePending?: boolean
}

type DraftMap = Record<string, ActiveConsultationDocumentDraft>

function buildDraftKey(sessionId: string, documentId: string) {
  return `${sessionId}:${documentId}`
}

function normalizeDraft(
  draft: ActiveConsultationDocumentDraft
): ActiveConsultationDocumentDraft {
  return {
    ...draft,
    sanitizedHtmlBuffer: draft.sanitizedHtmlBuffer ?? "",
    lastRenderableDocument: draft.lastRenderableDocument ?? draft.draftDocument,
    finalReconcilePending: draft.finalReconcilePending ?? false,
  }
}

interface DraftState {
  draftsByKey: DraftMap
  getDraft: (
    sessionId: string | null | undefined,
    documentId: string | null | undefined
  ) => ActiveConsultationDocumentDraft | null
  hydrateDraft: (draft: ActiveConsultationDocumentDraft) => void
  patchDraft: (
    sessionId: string,
    documentId: string,
    patch: Partial<ActiveConsultationDocumentDraft>
  ) => void
  replaceDocumentId: (
    sessionId: string,
    previousDocumentId: string,
    nextDocumentId: string,
    patch?: Partial<ActiveConsultationDocumentDraft>
  ) => void
  startStreaming: (
    sessionId: string,
    documentId: string,
    streamRequestId: string
  ) => void
  clearDocument: (sessionId: string, documentId: string) => void
  clearSession: (sessionId: string) => void
  reset: () => void
}

export const useActiveConsultationDocumentDraftStore = create<DraftState>(
  (set, get) => ({
    draftsByKey: {},

    getDraft: (sessionId, documentId) => {
      if (!sessionId || !documentId) return null
      return get().draftsByKey[buildDraftKey(sessionId, documentId)] ?? null
    },

    hydrateDraft: (draft) =>
      set((state) => ({
        draftsByKey: {
          ...state.draftsByKey,
          [buildDraftKey(draft.sessionId, draft.documentId)]: normalizeDraft(draft),
        },
      })),

    patchDraft: (sessionId, documentId, patch) =>
      set((state) => {
        const key = buildDraftKey(sessionId, documentId)
        const current = state.draftsByKey[key]
        if (!current) {
          return state
        }

        return {
          draftsByKey: {
            ...state.draftsByKey,
            [key]: normalizeDraft({
              ...current,
              ...patch,
              sessionId: current.sessionId,
              documentId: current.documentId,
            }),
          },
        }
      }),

    replaceDocumentId: (sessionId, previousDocumentId, nextDocumentId, patch) =>
      set((state) => {
        const previousKey = buildDraftKey(sessionId, previousDocumentId)
        const current = state.draftsByKey[previousKey]
        if (!current) {
          return state
        }

        const nextKey = buildDraftKey(sessionId, nextDocumentId)
        const nextDraft: ActiveConsultationDocumentDraft = normalizeDraft({
          ...current,
          ...patch,
          sessionId,
          documentId: nextDocumentId,
        })

        const nextDrafts = { ...state.draftsByKey }
        delete nextDrafts[previousKey]
        nextDrafts[nextKey] = nextDraft

        return {
          draftsByKey: nextDrafts,
        }
      }),

    startStreaming: (sessionId, documentId, streamRequestId) =>
      set((state) => {
        const key = buildDraftKey(sessionId, documentId)
        const current = state.draftsByKey[key]
        if (!current) {
          return state
        }

        return {
          draftsByKey: {
            ...state.draftsByKey,
            [key]: {
              ...current,
              isStreaming: true,
              streamRequestId,
              dirty: true,
              sanitizedHtmlBuffer: "",
              lastRenderableDocument: current.draftDocument,
              finalReconcilePending: true,
            },
          },
        }
      }),

    clearDocument: (sessionId, documentId) =>
      set((state) => {
        const key = buildDraftKey(sessionId, documentId)
        if (!(key in state.draftsByKey)) {
          return state
        }

        const next = { ...state.draftsByKey }
        delete next[key]
        return { draftsByKey: next }
      }),

    clearSession: (sessionId) =>
      set((state) => {
        const nextEntries = Object.entries(state.draftsByKey).filter(
          ([, draft]) => draft.sessionId !== sessionId
        )
        if (nextEntries.length === Object.keys(state.draftsByKey).length) {
          return state
        }

        return {
          draftsByKey: Object.fromEntries(nextEntries),
        }
      }),

    reset: () => set({ draftsByKey: {} }),
  })
)
