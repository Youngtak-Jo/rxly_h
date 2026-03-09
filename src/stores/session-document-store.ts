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
type SessionDocumentUiStateMap = Record<
  string,
  Record<string, SessionDocumentUiState>
>

export interface SessionDocumentUiState {
  isGenerating: boolean
  isSaving: boolean
  lastGenerationError: string | null
  feedbackForGeneratedAt: string | null
}

const DEFAULT_UI_STATE: SessionDocumentUiState = {
  isGenerating: false,
  isSaving: false,
  lastGenerationError: null,
  feedbackForGeneratedAt: null,
}

interface SessionDocumentState {
  documentsBySessionId: SessionDocumentMap
  documentSchemasBySessionId: SessionDocumentSchemaMap
  uiStateBySessionId: SessionDocumentUiStateMap
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
  getSessionDocumentUiState: (
    sessionId: string,
    templateId: string
  ) => SessionDocumentUiState
  setSessionDocumentUiState: (
    sessionId: string,
    templateId: string,
    patch: Partial<SessionDocumentUiState>
  ) => void
  resetSessionDocuments: (sessionId?: string) => void
  reset: () => void
}

export const useSessionDocumentStore = create<SessionDocumentState>(
  (set, get) => ({
    documentsBySessionId: {},
    documentSchemasBySessionId: {},
    uiStateBySessionId: {},

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
          [sessionId]: {
            ...(state.documentSchemasBySessionId[sessionId] ?? {}),
            ...Object.fromEntries(
              documents
                .filter(
                  (document) =>
                    Array.isArray(document.templateSchemaNodes) &&
                    document.templateSchemaNodes.length > 0
                )
                .map((document) => [
                  document.templateId,
                  document.templateSchemaNodes!,
                ])
            ),
          },
        },
        uiStateBySessionId: {
          ...state.uiStateBySessionId,
          [sessionId]: {
            ...(state.uiStateBySessionId[sessionId] ?? {}),
            ...Object.fromEntries(
              documents.map((document) => {
                const existing =
                  state.uiStateBySessionId[sessionId]?.[document.templateId]
                return [
                  document.templateId,
                  {
                    ...DEFAULT_UI_STATE,
                    ...(existing ?? {}),
                    feedbackForGeneratedAt:
                      existing?.feedbackForGeneratedAt &&
                      existing.feedbackForGeneratedAt === document.generatedAt
                        ? existing.feedbackForGeneratedAt
                        : null,
                  } satisfies SessionDocumentUiState,
                ]
              })
            ),
          },
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

    getSessionDocumentUiState: (sessionId, templateId) =>
      get().uiStateBySessionId[sessionId]?.[templateId] ?? DEFAULT_UI_STATE,

    setSessionDocumentUiState: (sessionId, templateId, patch) =>
      set((state) => ({
        uiStateBySessionId: {
          ...state.uiStateBySessionId,
          [sessionId]: {
            ...(state.uiStateBySessionId[sessionId] ?? {}),
            [templateId]: {
              ...DEFAULT_UI_STATE,
              ...(state.uiStateBySessionId[sessionId]?.[templateId] ?? {}),
              ...patch,
            },
          },
        },
      })),

    resetSessionDocuments: (sessionId) =>
      set((state) => {
        if (!sessionId) {
          return {
            documentsBySessionId: {},
            documentSchemasBySessionId: {},
            uiStateBySessionId: {},
          }
        }

        const nextDocuments = { ...state.documentsBySessionId }
        const nextSchemas = { ...state.documentSchemasBySessionId }
        const nextUiState = { ...state.uiStateBySessionId }
        delete nextDocuments[sessionId]
        delete nextSchemas[sessionId]
        delete nextUiState[sessionId]
        return {
          documentsBySessionId: nextDocuments,
          documentSchemasBySessionId: nextSchemas,
          uiStateBySessionId: nextUiState,
        }
      }),

    reset: () =>
      set({
        documentsBySessionId: {},
        documentSchemasBySessionId: {},
        uiStateBySessionId: {},
      }),
  })
)
