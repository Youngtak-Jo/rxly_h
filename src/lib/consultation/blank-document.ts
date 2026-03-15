"use client"

import {
  normalizeRichTextDocument,
  type RichTextDocument,
} from "@/lib/documents/rich-text"
import { isSystemBlankDocumentTitle } from "@/lib/documents/blank-document"
import type { SessionDocumentRecord } from "@/types/document"
import { useConsultationDocumentsStore } from "@/stores/consultation-documents-store"
import {
  useActiveConsultationDocumentDraftStore,
  type ActiveConsultationDocumentDraft,
} from "@/stores/active-consultation-document-draft-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"

const inFlightBlankCreations = new Map<string, Promise<SessionDocumentRecord>>()

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string }
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error
    }
  } catch {
    // Ignore malformed error bodies.
  }

  return fallback
}

function nodeHasMeaningfulContent(
  node: RichTextDocument | Record<string, unknown> | null | undefined
): boolean {
  if (!node) return false

  if ("type" in node && node.type === "text") {
    return typeof node.text === "string" && node.text.trim().length > 0
  }

  if ("type" in node && node.type === "image") {
    return (
      !!node.attrs &&
      typeof node.attrs === "object" &&
      typeof (node.attrs as { src?: unknown }).src === "string" &&
      !!(node.attrs as { src: string }).src.trim()
    )
  }

  const content =
    "content" in node && Array.isArray(node.content)
      ? (node.content as Array<RichTextDocument | Record<string, unknown>>)
      : []

  return content.some((child) => nodeHasMeaningfulContent(child))
}

function documentHasMeaningfulContent(
  document: RichTextDocument | Record<string, unknown> | null | undefined
): boolean {
  if (!document || !Array.isArray(document.content)) return false
  return document.content.some((node) =>
    nodeHasMeaningfulContent(node as RichTextDocument | Record<string, unknown>)
  )
}

export function shouldPersistBlankDocumentDraft(args: {
  title?: string | null
  document?: RichTextDocument | Record<string, unknown> | null
}): boolean {
  const normalizedTitle =
    typeof args.title === "string" ? args.title.trim() : ""
  const hasCustomTitle =
    normalizedTitle.length > 0 && !isSystemBlankDocumentTitle(normalizedTitle)

  return hasCustomTitle || documentHasMeaningfulContent(args.document)
}

function shouldSyncBlankDraft(args: {
  currentDocument: SessionDocumentRecord
  currentDraft: ActiveConsultationDocumentDraft | null
}): boolean {
  if (
    shouldPersistBlankDocumentDraft({
      title: args.currentDraft?.draftTitle,
      document: args.currentDraft?.lastRenderableDocument,
    })
  ) {
    return true
  }

  if (
    shouldPersistBlankDocumentDraft({
      title: args.currentDocument.title,
      document: args.currentDraft?.draftDocument,
    })
  ) {
    return true
  }

  if (
    shouldPersistBlankDocumentDraft({
      title: args.currentDocument.title,
      document: args.currentDocument.contentJson,
    })
  ) {
    return true
  }

  return false
}

async function persistBlankDocumentDraft(args: {
  sessionId: string
  documentId: string
  fallbackTitle?: string | null
  errorMessage?: string
  serverDocument: SessionDocumentRecord
}): Promise<SessionDocumentRecord> {
  const latestDocument = useSessionDocumentStore
    .getState()
    .getSessionDocumentById(args.sessionId, args.documentId)
  const activeDraft = useActiveConsultationDocumentDraftStore
    .getState()
    .getDraft(args.sessionId, args.documentId)
  const title =
    activeDraft?.draftTitle.trim() ||
    latestDocument?.title ||
    args.fallbackTitle ||
    args.serverDocument.title ||
    null
  const contentJson =
    activeDraft?.draftDocument ??
    latestDocument?.contentJson ??
    args.serverDocument.contentJson

  const response = await fetch(
    `/api/sessions/${args.sessionId}/documents/by-id/${args.serverDocument.id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateVersionId: args.serverDocument.templateVersionId,
        title,
        contentJson,
        generationInputs:
          latestDocument?.generationInputs ?? args.serverDocument.generationInputs,
        ...(latestDocument?.generatedAt || args.serverDocument.generatedAt
          ? {
              generatedAt:
                latestDocument?.generatedAt ?? args.serverDocument.generatedAt,
            }
          : {}),
      }),
    }
  )

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        args.errorMessage ?? "Failed to save blank document"
      )
    )
  }

  const payload = (await response.json()) as {
    sessionDocument: SessionDocumentRecord
  }

  return payload.sessionDocument
}

export async function ensureBlankDocumentPersisted(args: {
  sessionId: string
  documentId: string
  fallbackTitle?: string | null
  errorMessage?: string
}): Promise<SessionDocumentRecord> {
  const existingRequest = inFlightBlankCreations.get(args.documentId)
  if (existingRequest) {
    return existingRequest
  }

  const currentDocument = useSessionDocumentStore
    .getState()
    .getSessionDocumentById(args.sessionId, args.documentId)
  const currentDraft = useActiveConsultationDocumentDraftStore
    .getState()
    .getDraft(args.sessionId, args.documentId)

  if (!currentDocument) {
    throw new Error("Blank document not found")
  }

  if (!currentDocument.localOnly) {
    return currentDocument
  }

  useSessionDocumentStore.getState().patchSessionDocument(args.sessionId, args.documentId, {
    pendingCreate: true,
    createError: null,
  })

  const request = (async () => {
    const response = await fetch(`/api/sessions/${args.sessionId}/documents/blank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:
          currentDraft?.draftTitle.trim() ||
          currentDocument.title ||
          args.fallbackTitle ||
          null,
      }),
    })

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          args.errorMessage ?? "Failed to create blank document"
        )
      )
    }

    const payload = (await response.json()) as {
      sessionDocument: SessionDocumentRecord
    }

    let nextDocument = payload.sessionDocument
    try {
      if (
        shouldSyncBlankDraft({
          currentDocument,
          currentDraft,
        })
      ) {
        nextDocument = await persistBlankDocumentDraft({
          sessionId: args.sessionId,
          documentId: args.documentId,
          fallbackTitle: args.fallbackTitle,
          errorMessage: args.errorMessage,
          serverDocument: payload.sessionDocument,
        })
      }
    } catch (error) {
      const latestDocument = useSessionDocumentStore
        .getState()
        .getSessionDocumentById(args.sessionId, args.documentId)
      const activeDraft = useActiveConsultationDocumentDraftStore
        .getState()
        .getDraft(args.sessionId, args.documentId)
      nextDocument = {
        ...payload.sessionDocument,
        title:
          activeDraft?.draftTitle.trim() ||
          latestDocument?.title ||
          args.fallbackTitle ||
          payload.sessionDocument.title,
        contentJson:
          activeDraft?.draftDocument ??
          latestDocument?.contentJson ??
          payload.sessionDocument.contentJson,
        generationInputs:
          latestDocument?.generationInputs ??
          payload.sessionDocument.generationInputs,
        generatedAt:
          latestDocument?.generatedAt ?? payload.sessionDocument.generatedAt,
        createError:
          error instanceof Error && error.message.trim()
            ? error.message
            : args.errorMessage ?? "Failed to save blank document",
        needsSync: true,
      }
    }

    useSessionDocumentStore
      .getState()
      .replaceSessionDocument(args.documentId, nextDocument)
    const draftStore = useActiveConsultationDocumentDraftStore.getState()
    const latestDraft = draftStore.getDraft(args.sessionId, args.documentId)
    const nextRevision = `${nextDocument.updatedAt}:${nextDocument.generatedAt ?? ""}`
    draftStore.replaceDocumentId(args.sessionId, args.documentId, nextDocument.id, {
      draftDocument:
        latestDraft?.draftDocument ??
        normalizeRichTextDocument(nextDocument.contentJson),
      draftTitle:
        latestDraft?.draftTitle ??
        nextDocument.title ??
        args.fallbackTitle ??
        "",
      isStreaming: latestDraft?.isStreaming ?? false,
      streamRequestId: latestDraft?.streamRequestId ?? null,
      dirty: !!nextDocument.needsSync,
      lastPersistedRevision: nextDocument.needsSync ? null : nextRevision,
      sanitizedHtmlBuffer: latestDraft?.sanitizedHtmlBuffer ?? "",
      lastRenderableDocument:
        latestDraft?.lastRenderableDocument ?? latestDraft?.draftDocument ?? null,
      finalReconcilePending: latestDraft?.finalReconcilePending ?? false,
    })
    useConsultationDocumentsStore
      .getState()
      .replaceDocumentId(args.sessionId, args.documentId, nextDocument.id)

    return nextDocument
  })()
    .catch((error) => {
      useSessionDocumentStore
        .getState()
        .patchSessionDocument(args.sessionId, args.documentId, {
          pendingCreate: false,
          createError:
            error instanceof Error && error.message.trim()
              ? error.message
              : args.errorMessage ?? "Failed to create blank document",
        })
      throw error
    })
    .finally(() => {
      inFlightBlankCreations.delete(args.documentId)
    })

  inFlightBlankCreations.set(args.documentId, request)
  return request
}
