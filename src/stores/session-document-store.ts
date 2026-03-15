import { create } from "zustand"
import {
  BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID,
  DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY,
} from "@/lib/documents/constants"
import type {
  DocumentSchemaNode,
  SessionDocumentRecord,
} from "@/types/document"

type SessionDocumentListMap = Record<string, SessionDocumentRecord[]>
type SessionDocumentSchemaMap = Record<string, Record<string, DocumentSchemaNode[]>>
type SessionDocumentUiEntryMap = Record<string, SessionDocumentUiState>
type SessionDocumentUiStateMap = Record<string, SessionDocumentUiEntryMap>

export interface SessionDocumentUiState {
  isGenerating: boolean
  isSaving: boolean
  lastGenerationError: string | null
  feedbackForGeneratedAt: string | null
}

export const DEFAULT_SESSION_DOCUMENT_UI_STATE: SessionDocumentUiState = {
  isGenerating: false,
  isSaving: false,
  lastGenerationError: null,
  feedbackForGeneratedAt: null,
}

export const EMPTY_SESSION_DOCUMENTS: ReadonlyArray<SessionDocumentRecord> =
  Object.freeze([])
export const EMPTY_SESSION_DOCUMENT_UI_STATES: Readonly<SessionDocumentUiEntryMap> =
  Object.freeze({})

function sortSessionDocuments(
  documents: SessionDocumentRecord[]
): SessionDocumentRecord[] {
  return [...documents].sort((left, right) => {
    const updatedCompare =
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    if (updatedCompare !== 0) return updatedCompare
    return right.id.localeCompare(left.id)
  })
}

function isUiStateEqual(
  left: SessionDocumentUiState,
  right: SessionDocumentUiState
): boolean {
  return (
    left.isGenerating === right.isGenerating &&
    left.isSaving === right.isSaving &&
    left.lastGenerationError === right.lastGenerationError &&
    left.feedbackForGeneratedAt === right.feedbackForGeneratedAt
  )
}

interface SessionDocumentState {
  documentsBySessionId: SessionDocumentListMap
  documentSchemasBySessionId: SessionDocumentSchemaMap
  uiStateBySessionId: SessionDocumentUiStateMap
  hydrateSessionDocuments: (
    sessionId: string,
    documents: SessionDocumentRecord[]
  ) => void
  upsertSessionDocument: (document: SessionDocumentRecord) => void
  patchSessionDocument: (
    sessionId: string,
    documentId: string,
    patch: Partial<SessionDocumentRecord>
  ) => void
  replaceSessionDocument: (
    previousDocumentId: string,
    nextDocument: SessionDocumentRecord
  ) => void
  removeSessionDocument: (sessionId: string, documentId: string) => void
  createOptimisticBlankDocument: (
    sessionId: string,
    title?: string | null
  ) => SessionDocumentRecord
  cacheSessionDocumentSchema: (
    sessionId: string,
    documentId: string,
    schemaNodes: DocumentSchemaNode[]
  ) => void
  getSessionDocuments: (
    sessionId: string | null | undefined
  ) => ReadonlyArray<SessionDocumentRecord>
  getSessionDocumentById: (
    sessionId: string | null | undefined,
    documentId: string | null | undefined
  ) => SessionDocumentRecord | null
  getDefaultSessionDocument: (
    sessionId: string | null | undefined,
    templateId: string
  ) => SessionDocumentRecord | null
  getBlankSessionDocuments: (
    sessionId: string | null | undefined
  ) => ReadonlyArray<SessionDocumentRecord>
  getSessionDocumentSchema: (
    sessionId: string | null | undefined,
    documentId: string | null | undefined
  ) => DocumentSchemaNode[] | null
  getSessionDocumentUiStates: (
    sessionId: string | null | undefined
  ) => Readonly<SessionDocumentUiEntryMap>
  getSessionDocumentUiState: (
    sessionId: string | null | undefined,
    documentId: string | null | undefined
  ) => SessionDocumentUiState
  setSessionDocumentUiState: (
    sessionId: string,
    documentId: string,
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
      set((state) => {
        const currentDocuments = state.documentsBySessionId[sessionId] ?? []
        const incomingIds = new Set(documents.map((document) => document.id))
        const localOnlyDocuments = currentDocuments.filter(
          (document) => document.localOnly && !incomingIds.has(document.id)
        )
        const sortedDocuments = sortSessionDocuments([
          ...documents,
          ...localOnlyDocuments,
        ])
        const currentUiState = state.uiStateBySessionId[sessionId] ?? {}
        const nextUiState: SessionDocumentUiEntryMap = {}

        for (const document of sortedDocuments) {
          const existing = currentUiState[document.id]
          nextUiState[document.id] = {
            ...DEFAULT_SESSION_DOCUMENT_UI_STATE,
            ...(existing ?? {}),
            feedbackForGeneratedAt:
              existing?.feedbackForGeneratedAt === document.generatedAt
                ? existing.feedbackForGeneratedAt
                : null,
          }
        }

        return {
          documentsBySessionId: {
            ...state.documentsBySessionId,
            [sessionId]: sortedDocuments,
          },
          documentSchemasBySessionId: {
            ...state.documentSchemasBySessionId,
            [sessionId]: {
              ...(state.documentSchemasBySessionId[sessionId] ?? {}),
              ...Object.fromEntries(
                sortedDocuments
                  .filter(
                    (document) =>
                      Array.isArray(document.templateSchemaNodes) &&
                      document.templateSchemaNodes.length > 0
                  )
                  .map((document) => [document.id, document.templateSchemaNodes!])
              ),
              ...Object.fromEntries(
                localOnlyDocuments
                  .filter(
                    (document) =>
                      Array.isArray(document.templateSchemaNodes) &&
                      document.templateSchemaNodes.length > 0
                  )
                  .map((document) => [document.id, document.templateSchemaNodes!])
              ),
            },
          },
          uiStateBySessionId: {
            ...state.uiStateBySessionId,
            [sessionId]: nextUiState,
          },
        }
      }),

    upsertSessionDocument: (document) =>
      set((state) => {
        const currentDocuments = state.documentsBySessionId[document.sessionId] ?? []
        const nextDocuments = sortSessionDocuments([
          document,
          ...currentDocuments.filter((candidate) => candidate.id !== document.id),
        ])

        return {
          documentsBySessionId: {
            ...state.documentsBySessionId,
            [document.sessionId]: nextDocuments,
          },
          documentSchemasBySessionId: Array.isArray(document.templateSchemaNodes)
            ? {
                ...state.documentSchemasBySessionId,
                [document.sessionId]: {
                  ...(state.documentSchemasBySessionId[document.sessionId] ?? {}),
                  [document.id]: document.templateSchemaNodes,
                },
              }
            : state.documentSchemasBySessionId,
        }
      }),

    patchSessionDocument: (sessionId, documentId, patch) =>
      set((state) => {
        const currentDocuments = state.documentsBySessionId[sessionId] ?? []
        const currentDocument = currentDocuments.find(
          (document) => document.id === documentId
        )
        if (!currentDocument) {
          return state
        }

        const nextDocument = {
          ...currentDocument,
          ...patch,
          id: currentDocument.id,
          sessionId: currentDocument.sessionId,
        }

        return {
          documentsBySessionId: {
            ...state.documentsBySessionId,
            [sessionId]: sortSessionDocuments([
              nextDocument,
              ...currentDocuments.filter((candidate) => candidate.id !== documentId),
            ]),
          },
        }
      }),

    replaceSessionDocument: (previousDocumentId, nextDocument) =>
      set((state) => {
        const currentDocuments =
          state.documentsBySessionId[nextDocument.sessionId] ?? []
        const previousDocument = currentDocuments.find(
          (document) => document.id === previousDocumentId
        )
        const mergedNextDocument = previousDocument
          ? {
              ...nextDocument,
              title: nextDocument.title ?? previousDocument.title ?? null,
              generationInputs:
                nextDocument.generationInputs ?? previousDocument.generationInputs,
              templateSchemaNodes:
                nextDocument.templateSchemaNodes ??
                previousDocument.templateSchemaNodes,
            }
          : nextDocument
        const nextDocuments = sortSessionDocuments([
          mergedNextDocument,
          ...currentDocuments.filter(
            (candidate) =>
              candidate.id !== previousDocumentId &&
              candidate.id !== nextDocument.id
          ),
        ])

        const nextSchemas = {
          ...(state.documentSchemasBySessionId[nextDocument.sessionId] ?? {}),
        }
        if (
          previousDocumentId in nextSchemas &&
          !(nextDocument.id in nextSchemas)
        ) {
          nextSchemas[nextDocument.id] = nextSchemas[previousDocumentId]
        }
        delete nextSchemas[previousDocumentId]

        const previousUiState =
          state.uiStateBySessionId[nextDocument.sessionId]?.[previousDocumentId]
        const nextUiState = {
          ...(state.uiStateBySessionId[nextDocument.sessionId] ?? {}),
        }
        if (previousUiState) {
          nextUiState[nextDocument.id] = previousUiState
          delete nextUiState[previousDocumentId]
        }

        return {
          documentsBySessionId: {
            ...state.documentsBySessionId,
            [nextDocument.sessionId]: nextDocuments,
          },
          documentSchemasBySessionId: {
            ...state.documentSchemasBySessionId,
            [nextDocument.sessionId]: nextSchemas,
          },
          uiStateBySessionId: {
            ...state.uiStateBySessionId,
            [nextDocument.sessionId]: nextUiState,
          },
        }
      }),

    removeSessionDocument: (sessionId, documentId) =>
      set((state) => {
        const currentDocuments = state.documentsBySessionId[sessionId] ?? []
        if (!currentDocuments.some((document) => document.id === documentId)) {
          return state
        }

        const nextDocuments = currentDocuments.filter(
          (document) => document.id !== documentId
        )
        const nextSchemas = {
          ...(state.documentSchemasBySessionId[sessionId] ?? {}),
        }
        delete nextSchemas[documentId]

        const nextUiState = {
          ...(state.uiStateBySessionId[sessionId] ?? {}),
        }
        delete nextUiState[documentId]

        return {
          documentsBySessionId: {
            ...state.documentsBySessionId,
            [sessionId]: nextDocuments,
          },
          documentSchemasBySessionId: {
            ...state.documentSchemasBySessionId,
            [sessionId]: nextSchemas,
          },
          uiStateBySessionId: {
            ...state.uiStateBySessionId,
            [sessionId]: nextUiState,
          },
        }
      }),

    createOptimisticBlankDocument: (sessionId, title) => {
      const id = `local:blank:${crypto.randomUUID()}`
      const now = new Date().toISOString()
      const document: SessionDocumentRecord = {
        id,
        sessionId,
        templateId: BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID,
        instanceKey: id,
        templateVersionId: BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID,
        title: title ?? null,
        contentJson: { type: "doc", content: [] },
        generationInputs: null,
        generatedAt: null,
        updatedAt: now,
        localOnly: true,
        pendingCreate: false,
        createError: null,
      }

      get().upsertSessionDocument(document)
      return document
    },

    cacheSessionDocumentSchema: (sessionId, documentId, schemaNodes) =>
      set((state) => ({
        documentSchemasBySessionId: {
          ...state.documentSchemasBySessionId,
          [sessionId]: {
            ...(state.documentSchemasBySessionId[sessionId] ?? {}),
            [documentId]: schemaNodes,
          },
        },
      })),

    getSessionDocuments: (sessionId) =>
      sessionId
        ? (get().documentsBySessionId[sessionId] ?? EMPTY_SESSION_DOCUMENTS)
        : EMPTY_SESSION_DOCUMENTS,

    getSessionDocumentById: (sessionId, documentId) => {
      if (!sessionId || !documentId) return null
      return (
        get()
          .getSessionDocuments(sessionId)
          .find((document) => document.id === documentId) ?? null
      )
    },

    getDefaultSessionDocument: (sessionId, templateId) => {
      if (!sessionId) return null
      return (
        get()
          .getSessionDocuments(sessionId)
          .find(
            (document) =>
              document.templateId === templateId &&
              document.instanceKey === DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY
          ) ?? null
      )
    },

    getBlankSessionDocuments: (sessionId) => {
      if (!sessionId) return EMPTY_SESSION_DOCUMENTS
      return get()
        .getSessionDocuments(sessionId)
        .filter(
          (document) =>
            document.templateId === BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID
        )
    },

    getSessionDocumentSchema: (sessionId, documentId) =>
      sessionId && documentId
        ? (get().documentSchemasBySessionId[sessionId]?.[documentId] ?? null)
        : null,

    getSessionDocumentUiStates: (sessionId) =>
      sessionId
        ? (get().uiStateBySessionId[sessionId] ??
          EMPTY_SESSION_DOCUMENT_UI_STATES)
        : EMPTY_SESSION_DOCUMENT_UI_STATES,

    getSessionDocumentUiState: (sessionId, documentId) =>
      documentId
        ? get().getSessionDocumentUiStates(sessionId)[documentId] ??
          DEFAULT_SESSION_DOCUMENT_UI_STATE
        : DEFAULT_SESSION_DOCUMENT_UI_STATE,

    setSessionDocumentUiState: (sessionId, documentId, patch) =>
      set((state) => {
        const current = get().getSessionDocumentUiState(sessionId, documentId)
        const next = {
          ...DEFAULT_SESSION_DOCUMENT_UI_STATE,
          ...current,
          ...patch,
        }

        if (isUiStateEqual(current, next)) {
          return state
        }

        return {
          uiStateBySessionId: {
            ...state.uiStateBySessionId,
            [sessionId]: {
              ...get().getSessionDocumentUiStates(sessionId),
              [documentId]: next,
            },
          },
        }
      }),

    resetSessionDocuments: (sessionId) =>
      set((state) => {
        if (!sessionId) {
          if (
            Object.keys(state.documentsBySessionId).length === 0 &&
            Object.keys(state.documentSchemasBySessionId).length === 0 &&
            Object.keys(state.uiStateBySessionId).length === 0
          ) {
            return state
          }

          return {
            documentsBySessionId: {},
            documentSchemasBySessionId: {},
            uiStateBySessionId: {},
          }
        }

        if (
          !(sessionId in state.documentsBySessionId) &&
          !(sessionId in state.documentSchemasBySessionId) &&
          !(sessionId in state.uiStateBySessionId)
        ) {
          return state
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
      set((state) => {
        if (
          Object.keys(state.documentsBySessionId).length === 0 &&
          Object.keys(state.documentSchemasBySessionId).length === 0 &&
          Object.keys(state.uiStateBySessionId).length === 0
        ) {
          return state
        }

        return {
          documentsBySessionId: {},
          documentSchemasBySessionId: {},
          uiStateBySessionId: {},
        }
      }),
  })
)
