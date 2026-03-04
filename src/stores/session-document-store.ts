import { create } from "zustand"
import type { SessionDocumentRecord } from "@/types/document"

type SessionDocumentMap = Record<string, Record<string, SessionDocumentRecord>>

interface SessionDocumentState {
  documentsBySessionId: SessionDocumentMap
  hydrateSessionDocuments: (
    sessionId: string,
    documents: SessionDocumentRecord[]
  ) => void
  upsertSessionDocument: (document: SessionDocumentRecord) => void
  getSessionDocument: (
    sessionId: string,
    templateId: string
  ) => SessionDocumentRecord | null
  resetSessionDocuments: (sessionId?: string) => void
  reset: () => void
}

export const useSessionDocumentStore = create<SessionDocumentState>(
  (set, get) => ({
    documentsBySessionId: {},

    hydrateSessionDocuments: (sessionId, documents) =>
      set((state) => ({
        documentsBySessionId: {
          ...state.documentsBySessionId,
          [sessionId]: Object.fromEntries(
            documents.map((document) => [document.templateId, document])
          ),
        },
      })),

    upsertSessionDocument: (document) =>
      set((state) => ({
        documentsBySessionId: {
          ...state.documentsBySessionId,
          [document.sessionId]: {
            ...(state.documentsBySessionId[document.sessionId] ?? {}),
            [document.templateId]: document,
          },
        },
      })),

    getSessionDocument: (sessionId, templateId) =>
      get().documentsBySessionId[sessionId]?.[templateId] ?? null,

    resetSessionDocuments: (sessionId) =>
      set((state) => {
        if (!sessionId) {
          return { documentsBySessionId: {} }
        }

        const next = { ...state.documentsBySessionId }
        delete next[sessionId]
        return { documentsBySessionId: next }
      }),

    reset: () => set({ documentsBySessionId: {} }),
  })
)
