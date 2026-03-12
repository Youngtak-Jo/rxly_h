import { create } from "zustand"

export type ConsultationDocumentsPanelMode = "picker" | "editor"

export interface ConsultationDocumentsSessionUiState {
  activeDocumentId: string | null
  panelMode: ConsultationDocumentsPanelMode
  lastOpenedDocumentId: string | null
}

export const DEFAULT_CONSULTATION_DOCUMENTS_SESSION_UI_STATE: ConsultationDocumentsSessionUiState =
  {
    activeDocumentId: null,
    panelMode: "picker",
    lastOpenedDocumentId: null,
  }

type SessionUiStateMap = Record<string, ConsultationDocumentsSessionUiState>

function getSanitizedSessionUiState(
  current: ConsultationDocumentsSessionUiState | undefined,
  documentIds: string[]
): ConsultationDocumentsSessionUiState {
  const availableDocumentIds = new Set(documentIds)
  const next = current ?? DEFAULT_CONSULTATION_DOCUMENTS_SESSION_UI_STATE

  const activeDocumentId =
    next.activeDocumentId && availableDocumentIds.has(next.activeDocumentId)
      ? next.activeDocumentId
      : null
  const lastOpenedDocumentId =
    next.lastOpenedDocumentId &&
    availableDocumentIds.has(next.lastOpenedDocumentId)
      ? next.lastOpenedDocumentId
      : null

  return {
    activeDocumentId,
    lastOpenedDocumentId,
    panelMode:
      next.panelMode === "editor" && activeDocumentId ? "editor" : "picker",
  }
}

function areSessionUiStatesEqual(
  left: ConsultationDocumentsSessionUiState,
  right: ConsultationDocumentsSessionUiState
): boolean {
  return (
    left.activeDocumentId === right.activeDocumentId &&
    left.panelMode === right.panelMode &&
    left.lastOpenedDocumentId === right.lastOpenedDocumentId
  )
}

interface ConsultationDocumentsState {
  uiStateBySessionId: SessionUiStateMap
  getSessionUiState: (
    sessionId: string | null | undefined
  ) => ConsultationDocumentsSessionUiState
  syncSessionDocuments: (sessionId: string, documentIds: string[]) => void
  openPicker: (sessionId: string) => void
  openDocument: (sessionId: string, documentId: string) => void
  replaceDocumentId: (
    sessionId: string,
    previousDocumentId: string,
    nextDocumentId: string
  ) => void
  resetSessionUi: (sessionId?: string) => void
  reset: () => void
}

export const useConsultationDocumentsStore =
  create<ConsultationDocumentsState>((set, get) => ({
    uiStateBySessionId: {},

    getSessionUiState: (sessionId) =>
      (sessionId && get().uiStateBySessionId[sessionId]) ||
      DEFAULT_CONSULTATION_DOCUMENTS_SESSION_UI_STATE,

    syncSessionDocuments: (sessionId, documentIds) =>
      set((state) => {
        const current =
          state.uiStateBySessionId[sessionId] ??
          DEFAULT_CONSULTATION_DOCUMENTS_SESSION_UI_STATE
        const next = getSanitizedSessionUiState(
          state.uiStateBySessionId[sessionId],
          documentIds
        )

        if (areSessionUiStatesEqual(current, next)) {
          return state
        }

        return {
          uiStateBySessionId: {
            ...state.uiStateBySessionId,
            [sessionId]: next,
          },
        }
      }),

    openPicker: (sessionId) =>
      set((state) => {
        const next = {
          ...get().getSessionUiState(sessionId),
          activeDocumentId: null,
          panelMode: "picker",
        } satisfies ConsultationDocumentsSessionUiState
        const current = get().getSessionUiState(sessionId)

        if (areSessionUiStatesEqual(current, next)) {
          return state
        }

        return {
          uiStateBySessionId: {
            ...state.uiStateBySessionId,
            [sessionId]: next,
          },
        }
      }),

    openDocument: (sessionId, documentId) =>
      set((state) => {
        const next = {
          activeDocumentId: documentId,
          panelMode: "editor",
          lastOpenedDocumentId: documentId,
        } satisfies ConsultationDocumentsSessionUiState
        const current = get().getSessionUiState(sessionId)

        if (areSessionUiStatesEqual(current, next)) {
          return state
        }

        return {
          uiStateBySessionId: {
            ...state.uiStateBySessionId,
            [sessionId]: next,
          },
        }
      }),

    replaceDocumentId: (sessionId, previousDocumentId, nextDocumentId) =>
      set((state) => {
        const current = get().getSessionUiState(sessionId)
        const next = {
          activeDocumentId:
            current.activeDocumentId === previousDocumentId
              ? nextDocumentId
              : current.activeDocumentId,
          panelMode:
            current.panelMode === "editor"
              ? "editor"
              : current.panelMode,
          lastOpenedDocumentId:
            current.lastOpenedDocumentId === previousDocumentId
              ? nextDocumentId
              : current.lastOpenedDocumentId,
        } satisfies ConsultationDocumentsSessionUiState

        if (areSessionUiStatesEqual(current, next)) {
          return state
        }

        return {
          uiStateBySessionId: {
            ...state.uiStateBySessionId,
            [sessionId]: next,
          },
        }
      }),

    resetSessionUi: (sessionId) =>
      set((state) => {
        if (!sessionId) {
          if (Object.keys(state.uiStateBySessionId).length === 0) {
            return state
          }

          return {
            uiStateBySessionId: {},
          }
        }

        if (!(sessionId in state.uiStateBySessionId)) {
          return state
        }

        const next = { ...state.uiStateBySessionId }
        delete next[sessionId]
        return {
          uiStateBySessionId: next,
        }
      }),

    reset: () =>
      set((state) => {
        if (Object.keys(state.uiStateBySessionId).length === 0) {
          return state
        }

        return {
          uiStateBySessionId: {},
        }
      }),
  }))
