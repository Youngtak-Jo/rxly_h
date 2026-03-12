import {
  getTemplateIdFromTabId,
  isSystemWorkspaceTabId,
} from "@/lib/documents/constants"
import type {
  DocumentTemplateRenderer,
  InstalledDocumentSummary,
  WorkspaceTabId,
} from "@/types/document"

export interface WorkspaceTabDefinition {
  id: WorkspaceTabId
  kind: "system" | "document"
  title: string
  renderer: "SYSTEM" | DocumentTemplateRenderer
  templateId: string | null
  closable: boolean
  document: InstalledDocumentSummary | null
}

export function resolveWorkspaceTabDefinition(
  tabId: WorkspaceTabId,
  installedDocuments: InstalledDocumentSummary[],
  systemLabels: Record<"insights" | "ddx" | "documents" | "research", string>
): WorkspaceTabDefinition | null {
  if (isSystemWorkspaceTabId(tabId)) {
    return {
      id: tabId,
      kind: "system",
      title: systemLabels[tabId],
      renderer: "SYSTEM",
      templateId: null,
      closable: false,
      document: null,
    }
  }

  const templateId = getTemplateIdFromTabId(tabId)
  if (!templateId) return null

  const document =
    installedDocuments.find((installed) => installed.templateId === templateId) ??
    null
  if (!document) return null

  return {
    id: tabId,
    kind: "document",
    title: document.title,
    renderer: document.renderer,
    templateId,
    closable: true,
    document,
  }
}
