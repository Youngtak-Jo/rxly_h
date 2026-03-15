import { describe, expect, it } from "vitest"
import { buildDocumentTabId } from "@/lib/documents/constants"
import { getVisibleConsultationInstalledDocuments } from "@/lib/consultation/documents-hub"
import type { InstalledDocumentSummary, WorkspaceTabId } from "@/types/document"

function buildInstalledDocument(
  overrides: Partial<InstalledDocumentSummary> & Pick<InstalledDocumentSummary, "templateId">
): InstalledDocumentSummary {
  return {
    templateId: overrides.templateId,
    slug: overrides.slug ?? overrides.templateId,
    title: overrides.title ?? overrides.templateId,
    description: overrides.description ?? "Description",
    renderer: overrides.renderer ?? "GENERIC_STRUCTURED",
    visibility: overrides.visibility ?? "PUBLIC",
    sourceKind: overrides.sourceKind ?? "USER",
    category: overrides.category ?? "general",
    language: overrides.language ?? "en",
    region: overrides.region ?? "global",
    authorName: overrides.authorName ?? "Author",
    installCount: overrides.installCount ?? 1,
    installedVersionId: overrides.installedVersionId ?? `${overrides.templateId}-v1`,
    installedVersionNumber: overrides.installedVersionNumber ?? 1,
    installedVersionSchemaNodes: overrides.installedVersionSchemaNodes,
    installedVersionGenerationConfig: overrides.installedVersionGenerationConfig,
    latestPublishedVersionId:
      overrides.latestPublishedVersionId ?? `${overrides.templateId}-v1`,
    latestPublishedVersionNumber: overrides.latestPublishedVersionNumber ?? 1,
    hasUpdate: overrides.hasUpdate ?? false,
  }
}

describe("getVisibleConsultationInstalledDocuments", () => {
  it("returns only installed documents that are enabled in tab order", () => {
    const installedDocuments = [
      buildInstalledDocument({ templateId: "record" }),
      buildInstalledDocument({ templateId: "plan" }),
      buildInstalledDocument({ templateId: "discharge" }),
    ]

    const visibleDocuments = getVisibleConsultationInstalledDocuments(
      installedDocuments,
      [
        "insights",
        buildDocumentTabId("record"),
        "documents",
        buildDocumentTabId("discharge"),
      ]
    )

    expect(visibleDocuments.map((document) => document.templateId)).toEqual([
      "record",
      "discharge",
    ])
  })

  it("preserves the workspace tab order for visible documents", () => {
    const installedDocuments = [
      buildInstalledDocument({ templateId: "record" }),
      buildInstalledDocument({ templateId: "plan" }),
      buildInstalledDocument({ templateId: "discharge" }),
    ]

    const tabOrder: WorkspaceTabId[] = [
      "documents",
      buildDocumentTabId("plan"),
      buildDocumentTabId("record"),
      buildDocumentTabId("discharge"),
    ]

    const visibleDocuments = getVisibleConsultationInstalledDocuments(
      installedDocuments,
      tabOrder
    )

    expect(visibleDocuments.map((document) => document.templateId)).toEqual([
      "plan",
      "record",
      "discharge",
    ])
  })

  it("returns an empty list when no installed templates are enabled", () => {
    const installedDocuments = [
      buildInstalledDocument({ templateId: "record" }),
      buildInstalledDocument({ templateId: "plan" }),
    ]

    const visibleDocuments = getVisibleConsultationInstalledDocuments(
      installedDocuments,
      ["insights", "documents", "research"]
    )

    expect(visibleDocuments).toEqual([])
  })
})
