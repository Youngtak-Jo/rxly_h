import {
  DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY,
  getTemplateIdFromTabId,
  isDocumentTabId,
} from "@/lib/documents/constants"
import { useActiveConsultationDocumentDraftStore } from "@/stores/active-consultation-document-draft-store"
import type { ConsultationDocumentsSessionUiState } from "@/stores/consultation-documents-store"
import type {
  InstalledDocumentSummary,
  SessionDocumentRecord,
  WorkspaceTabId,
} from "@/types/document"

type SessionDocumentCollection = ReadonlyArray<SessionDocumentRecord>

function resolveSessionDocumentById(
  sessionDocuments: SessionDocumentCollection | undefined,
  documentId: string | null
): SessionDocumentRecord | null {
  if (!sessionDocuments || !documentId) return null
  return sessionDocuments.find((document) => document.id === documentId) ?? null
}

function resolveDefaultTemplateSessionDocument(
  sessionDocuments: SessionDocumentCollection | undefined,
  templateId: string | null
): SessionDocumentRecord | null {
  if (!sessionDocuments || !templateId) return null
  return (
    sessionDocuments.find(
      (document) =>
        document.templateId === templateId &&
        document.instanceKey === DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY
    ) ?? null
  )
}

export function getConsultationEditorDocumentId(
  uiState: ConsultationDocumentsSessionUiState
): string | null {
  return uiState.panelMode === "editor" ? uiState.activeDocumentId : null
}

export function getConsultationTargetDocumentId(
  uiState: ConsultationDocumentsSessionUiState
): string | null {
  return getConsultationEditorDocumentId(uiState) ?? uiState.lastOpenedDocumentId
}

export function resolveInstalledConsultationDocument(
  installedDocuments: InstalledDocumentSummary[],
  templateId: string | null
): InstalledDocumentSummary | null {
  if (!templateId) return null

  return (
    installedDocuments.find((document) => document.templateId === templateId) ?? null
  )
}

export function resolveConsultationDocumentContext(args: {
  uiState: ConsultationDocumentsSessionUiState
  installedDocuments: InstalledDocumentSummary[]
  sessionDocuments?: SessionDocumentCollection
}) {
  const targetDocumentId = getConsultationTargetDocumentId(args.uiState)
  const editorDocumentId = getConsultationEditorDocumentId(args.uiState)
  const sessionDocument = resolveSessionDocumentById(
    args.sessionDocuments,
    targetDocumentId
  )
  const targetTemplateId = sessionDocument?.templateId ?? null

  return {
    targetDocumentId,
    editorDocumentId,
    targetTemplateId,
    installedDocument: resolveInstalledConsultationDocument(
      args.installedDocuments,
      targetTemplateId
    ),
    sessionDocument,
  }
}

export function resolveWorkspaceTabDocumentContext(args: {
  activeTab: WorkspaceTabId
  uiState: ConsultationDocumentsSessionUiState
  installedDocuments: InstalledDocumentSummary[]
  sessionDocuments?: SessionDocumentCollection
}) {
  if (args.activeTab === "documents") {
    return resolveConsultationDocumentContext(args)
  }

  const templateId = isDocumentTabId(args.activeTab)
    ? getTemplateIdFromTabId(args.activeTab)
    : null
  const sessionDocument = resolveDefaultTemplateSessionDocument(
    args.sessionDocuments,
    templateId
  )

  return {
    targetDocumentId: sessionDocument?.id ?? null,
    editorDocumentId: null,
    targetTemplateId: templateId,
    installedDocument: resolveInstalledConsultationDocument(
      args.installedDocuments,
      templateId
    ),
    sessionDocument,
  }
}

export function resolveConsultationActiveDocumentTitle(args: {
  sessionId?: string | null
  activeTab: WorkspaceTabId
  uiState: ConsultationDocumentsSessionUiState
  installedDocuments: InstalledDocumentSummary[]
  sessionDocuments?: SessionDocumentCollection
  fallbackTitle: string
}) {
  const context = resolveWorkspaceTabDocumentContext(args)
  const draftTitle =
    args.sessionId && context.targetDocumentId
      ? useActiveConsultationDocumentDraftStore
          .getState()
          .getDraft(args.sessionId, context.targetDocumentId)
          ?.draftTitle
          ?.trim() || null
      : null

  return (
    draftTitle ??
    context.sessionDocument?.title ??
    context.installedDocument?.title ??
    args.fallbackTitle
  )
}
