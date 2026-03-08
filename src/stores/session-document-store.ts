import { create } from "zustand"
import type {
  DocumentSchemaNode,
  SessionDocumentRecord,
} from "@/types/document"

type SessionDocumentMap = Record<string, Record<string, SessionDocumentRecord>>
type SessionDocumentSchemaMap = Record<
  string,
  Record<string, DocumentSchemaNode[]>
>

interface SessionDocumentState {
  documentsBySessionId: SessionDocumentMap
  documentSchemasBySessionId: SessionDocumentSchemaMap
  hydrateSessionDocuments: (
    sessionId: string,
    documents: SessionDocumentRecord[]
  ) => void
  upsertSessionDocument: (document: SessionDocumentRecord) => void
  cacheSessionDocumentSchema: (
    sessionId: string,
    templateId: string,
    schemaNodes: DocumentSchemaNode[]
  ) => void
  getSessionDocument: (
    sessionId: string,
    templateId: string
  ) => SessionDocumentRecord | null
  getSessionDocumentSchema: (
    sessionId: string,
    templateId: string
  ) => DocumentSchemaNode[] | null
  resetSessionDocuments: (sessionId?: string) => void
  reset: () => void
}

export const useSessionDocumentStore = create<SessionDocumentState>(
  (set, get) => ({
    documentsBySessionId: {},
    documentSchemasBySessionId: {},

    hydrateSessionDocuments: (sessionId, documents) =>
      set((state) => ({
        documentsBySessionId: {
          ...state.documentsBySessionId,
          [sessionId]: Object.fromEntries(
            documents.map((document) => [document.templateId, document])
          ),
        },
        documentSchemasBySessionId: {
          ...state.documentSchemasBySessionId,
          [sessionId]: state.documentSchemasBySessionId[sessionId] ?? {},
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

    cacheSessionDocumentSchema: (sessionId, templateId, schemaNodes) =>
      set((state) => ({
        documentSchemasBySessionId: {
          ...state.documentSchemasBySessionId,
          [sessionId]: {
            ...(state.documentSchemasBySessionId[sessionId] ?? {}),
            [templateId]: schemaNodes,
          },
        },
      })),

    getSessionDocument: (sessionId, templateId) =>
      get().documentsBySessionId[sessionId]?.[templateId] ?? null,

    getSessionDocumentSchema: (sessionId, templateId) =>
      get().documentSchemasBySessionId[sessionId]?.[templateId] ?? null,

    resetSessionDocuments: (sessionId) =>
      set((state) => {
        if (!sessionId) {
          return { documentsBySessionId: {}, documentSchemasBySessionId: {} }
        }

        const nextDocuments = { ...state.documentsBySessionId }
        const nextSchemas = { ...state.documentSchemasBySessionId }
        delete nextDocuments[sessionId]
        delete nextSchemas[sessionId]
        return {
          documentsBySessionId: nextDocuments,
          documentSchemasBySessionId: nextSchemas,
        }
      }),

    reset: () =>
      set({ documentsBySessionId: {}, documentSchemasBySessionId: {} }),
  })
)
