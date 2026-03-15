import { getTemplateIdFromTabId } from "@/lib/documents/constants"
import type { InstalledDocumentSummary, WorkspaceTabId } from "@/types/document"

export function getVisibleConsultationInstalledDocuments(
  installedDocuments: InstalledDocumentSummary[],
  tabOrder: WorkspaceTabId[]
): InstalledDocumentSummary[] {
  const installedByTemplateId = new Map(
    installedDocuments.map((document) => [document.templateId, document])
  )
  const orderedVisibleTemplateIds = [...new Set(
    tabOrder
      .map((tabId) => getTemplateIdFromTabId(tabId))
      .filter((templateId): templateId is string => !!templateId)
  )]

  return orderedVisibleTemplateIds
    .map((templateId) => installedByTemplateId.get(templateId))
    .filter((document): document is InstalledDocumentSummary => !!document)
}
