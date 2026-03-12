import { useDdxStore } from "@/stores/ddx-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useResearchStore, type ResearchMessage } from "@/stores/research-store"
import { useNoteStore } from "@/stores/note-store"
import { useConsultationDocumentsStore } from "@/stores/consultation-documents-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useActiveConsultationDocumentDraftStore } from "@/stores/active-consultation-document-draft-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import { isDocumentTabId } from "@/lib/documents/constants"
import { resolveWorkspaceTabDocumentContext } from "@/lib/consultation/active-document"
import {
  ddxToRichTextDocument,
  genericStructuredContentToRichTextDocument,
  isRichTextDocument,
  normalizeRichTextDocument,
  richTextDocumentToHtml,
  type RichTextDocument,
} from "@/lib/documents/rich-text"
import {
  buildStandaloneExportHtml,
  type ExportDocumentPayload,
} from "@/lib/export-document"
import {
  renderMarkdownBlock,
  renderMarkdownBulletList,
  renderMarkdownInline,
} from "@/lib/export-markdown"
import type { ChecklistItem } from "@/types/insights"

const SYSTEM_TAB_LABELS = {
  insights: "Live Insights",
  ddx: "Differential Diagnosis",
  documents: "Documents",
  research: "Research",
}

const MANUAL_PRINT_BAR_ID = "rxly-export-print-bar"
const MANUAL_PRINT_STYLE_ID = "rxly-export-print-style"
const POPUP_BLOCKED_ERROR_CODE = "popup_blocked"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function slugifyFilenamePart(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/[-\s]+/g, "-")

  return normalized || "document"
}

function formatExportDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
  }).format(date)
}

function formatExportTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
  }).format(date)
}

function deriveWindowTitleFromFilename(filename: string): string {
  return filename.replace(/\.pdf$/i, "").trim() || "document"
}

function wrapExportRoot(contentHtml: string): string {
  return `<div class="rxly-document-root rxly-document-root--export">${contentHtml}</div>`
}

function renderExportSection(title: string, contentHtml: string): string {
  const trimmed = contentHtml.trim()
  if (!trimmed) return ""

  return `<section><h2>${escapeHtml(title)}</h2>${trimmed}</section>`
}

function renderEmptyExportBody(message: string): string {
  return wrapExportRoot(`<p><em>${escapeHtml(message)}</em></p>`)
}

function normalizeInlineListItem(value: string): string {
  return value.trim().replace(/^[-*+]\s+/, "").replace(/^\d+\.\s+/, "")
}

function renderChecklistItems(items: ChecklistItem[]): string {
  if (items.length === 0) return ""

  return `<ul data-type="taskList">${items
    .map((item) => {
      const note = item.doctorNote?.trim() || ""
      const noteHtml = note
        ? `<div>${renderMarkdownBlock(note)}</div>`
        : ""

      return `<li data-type="taskItem">
        <label><input type="checkbox" disabled${item.isChecked ? " checked" : ""} /></label>
        <div>
          <p>${renderMarkdownInline(normalizeInlineListItem(item.label))}</p>
          ${noteHtml}
        </div>
      </li>`
    })
    .join("")}</ul>`
}

function renderImageGallery(images: Array<{ url: string; alt: string }>): string {
  if (images.length === 0) return ""

  return `<div class="rxly-export-images">${images
    .map(
      (image) => `<figure>
        <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt || "Document image")}" />
        ${
          image.alt.trim()
            ? `<figcaption>${escapeHtml(image.alt.trim())}</figcaption>`
            : ""
        }
      </figure>`
    )
    .join("")}</div>`
}

function buildInsightsExportBody(): string {
  const insights = useInsightsStore.getState()
  const uploadedImages = useNoteStore.getState().notes.flatMap((note) =>
    (note.imageUrls || []).map((url) => ({
      url,
      alt: note.content || "Medical image",
    }))
  )

  const sections = [
    renderExportSection("Summary", renderMarkdownBlock(insights.summary)),
    renderExportSection(
      "Key Findings",
      renderMarkdownBulletList(insights.keyFindings.map(normalizeInlineListItem))
    ),
    renderExportSection(
      "Red Flags",
      renderMarkdownBulletList(insights.redFlags.map(normalizeInlineListItem))
    ),
    renderExportSection("Checklist", renderChecklistItems(insights.checklistItems)),
    renderExportSection("Images", renderImageGallery(uploadedImages)),
  ].filter(Boolean)

  return sections.length > 0
    ? wrapExportRoot(sections.join(""))
    : renderEmptyExportBody("No insight data available.")
}

function renderResearchMessage(message: ResearchMessage): string {
  const label = message.role === "user" ? "You" : "Rxly Research"
  const roleClass =
    message.role === "user"
      ? "rxly-export-message rxly-export-message--user"
      : "rxly-export-message rxly-export-message--assistant"
  const bodyHtml = message.content.trim()
    ? renderMarkdownBlock(message.content)
    : "<p><em>No content.</em></p>"
  const imagesHtml = renderImageGallery(
    message.imageUrls.map((url, index) => ({
      url,
      alt: `Research attachment ${index + 1}`,
    }))
  )

  return `<section class="${roleClass}">
    <div class="rxly-export-message__label">${escapeHtml(label)}</div>
    <div class="rxly-document-root rxly-document-root--export">${bodyHtml}</div>
    ${imagesHtml}
  </section>`
}

function buildResearchExportBody(messages: ResearchMessage[]): string {
  if (messages.length === 0) {
    return renderEmptyExportBody("No research messages available.")
  }

  return messages.map((message) => renderResearchMessage(message)).join("")
}

function resolveCustomDocument(sessionId: string, documentId: string): RichTextDocument | null {
  const activeDraft = useActiveConsultationDocumentDraftStore
    .getState()
    .getDraft(sessionId, documentId)
  if (activeDraft?.draftDocument) {
    return normalizeRichTextDocument(activeDraft.draftDocument)
  }

  const sessionDocumentStore = useSessionDocumentStore.getState()
  const workspaceStore = useDocumentWorkspaceStore.getState()
  const sessionDocument = sessionDocumentStore.getSessionDocumentById(
    sessionId,
    documentId
  )
  const installedDocument =
    workspaceStore.installedDocuments.find(
      (document) => document.templateId === sessionDocument?.templateId
    ) ?? null

  if (!sessionDocument?.contentJson) return null

  if (isRichTextDocument(sessionDocument.contentJson)) {
    return normalizeRichTextDocument(sessionDocument.contentJson)
  }

  return genericStructuredContentToRichTextDocument({
    contentJson: sessionDocument.contentJson,
    schemaNodes:
      sessionDocument.templateSchemaNodes ??
      installedDocument?.installedVersionSchemaNodes,
  })
}

function resolveSelectedDocumentContext() {
  const session = useSessionStore.getState().activeSession
  const installedDocuments = useDocumentWorkspaceStore.getState().installedDocuments
  const sessionDocuments = useSessionDocumentStore
    .getState()
    .getSessionDocuments(session?.id)
  const documentsStore = useConsultationDocumentsStore.getState()
  const uiState = documentsStore.getSessionUiState(session?.id)
  const context = resolveWorkspaceTabDocumentContext({
    activeTab: useConsultationTabStore.getState().activeTab,
    uiState,
    installedDocuments,
    sessionDocuments,
  })

  return {
    session,
    documentId: context.targetDocumentId,
    installedDocument: context.installedDocument,
    sessionDocument: context.sessionDocument,
    draft:
      session?.id && context.targetDocumentId
        ? useActiveConsultationDocumentDraftStore
            .getState()
            .getDraft(session.id, context.targetDocumentId)
        : null,
  }
}

function resolveRichTextExportBody(document: RichTextDocument | null): string {
  if (!document) {
    return renderEmptyExportBody("No document data available.")
  }

  return richTextDocumentToHtml(document, {
    className: "rxly-document-root rxly-document-root--export",
    includeStyles: false,
    variant: "export",
  })
}

function resolveActiveExportContent(): { bodyHtml: string; title: string } {
  const activeTab = useConsultationTabStore.getState().activeTab
  const { session, documentId, installedDocument, sessionDocument, draft } =
    resolveSelectedDocumentContext()
  const title =
    draft?.draftTitle.trim() ||
    sessionDocument?.title ||
    installedDocument?.title ||
    (activeTab in SYSTEM_TAB_LABELS
      ? SYSTEM_TAB_LABELS[activeTab as keyof typeof SYSTEM_TAB_LABELS]
      : "Document")

  if (activeTab === "research") {
    return {
      bodyHtml: buildResearchExportBody(useResearchStore.getState().messages),
      title,
    }
  }

  if (activeTab === "insights") {
    return {
      bodyHtml: buildInsightsExportBody(),
      title,
    }
  }

  if (activeTab === "ddx") {
    return {
      bodyHtml: resolveRichTextExportBody(
        ddxToRichTextDocument(useDdxStore.getState().diagnoses, {
          references: "References",
          evidence: "Evidence",
          confidence: "Confidence",
          icd: "ICD-11",
          referenceCount: "References",
        })
      ),
      title,
    }
  }

  if (session && documentId && (activeTab === "documents" || isDocumentTabId(activeTab))) {
    return {
      bodyHtml: resolveRichTextExportBody(resolveCustomDocument(session.id, documentId)),
      title,
    }
  }

  return {
    bodyHtml: renderEmptyExportBody("No document data available."),
    title,
  }
}

export function buildActiveExportDocument(): ExportDocumentPayload {
  const session = useSessionStore.getState().activeSession
  const sessionTitle = session?.title?.trim() || "Consultation"
  const patientName = session?.patientName?.trim() || null
  const now = new Date()
  const { bodyHtml, title } = resolveActiveExportContent()
  const metaLine = [sessionTitle, patientName, formatExportDate(now)]
    .filter(Boolean)
    .join(" · ")
  const footerLabel = `Generated by Rxly on ${formatExportDate(now)} at ${formatExportTime(now)}`
  const dateStamp = now.toISOString().slice(0, 10)

  return {
    title,
    filename: `${slugifyFilenamePart(title)}-${slugifyFilenamePart(sessionTitle)}-${dateStamp}.pdf`,
    standaloneHtml: buildStandaloneExportHtml({
      bodyHtml,
      footerLabel,
      lang:
        typeof document !== "undefined"
          ? document.documentElement.lang || navigator.language || "en"
          : "en",
      metaLine,
      title,
    }),
  }
}

function buildManualPrintBar(printWindow: Window): HTMLDivElement {
  const bar = printWindow.document.createElement("div")
  const lang = printWindow.document.documentElement.lang || "en"
  const buttonLabel =
    lang.startsWith("ko") ? "인쇄 / PDF로 저장" : "Print / Save as PDF"

  bar.id = MANUAL_PRINT_BAR_ID
  bar.setAttribute(
    "style",
    [
      "position: sticky",
      "top: 0",
      "z-index: 999",
      "display: flex",
      "justify-content: center",
      "padding: 16px 20px 0",
      "background: transparent",
    ].join("; ")
  )

  const button = printWindow.document.createElement("button")
  button.type = "button"
  button.textContent = buttonLabel
  button.setAttribute(
    "style",
    [
      "border: 1px solid rgba(148, 163, 184, 0.28)",
      "background: #ffffff",
      "color: #111827",
      "border-radius: 999px",
      "padding: 10px 16px",
      "font: 600 14px/1.2 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      "box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12)",
      "cursor: pointer",
    ].join("; ")
  )
  button.addEventListener("click", () => {
    printWindow.focus()
    printWindow.print()
  })

  bar.appendChild(button)
  return bar
}

function ensureManualPrintUi(printWindow: Window) {
  if (printWindow.document.getElementById(MANUAL_PRINT_BAR_ID)) {
    return
  }

  const style = printWindow.document.createElement("style")
  style.id = MANUAL_PRINT_STYLE_ID
  style.textContent = `@media print { #${MANUAL_PRINT_BAR_ID} { display: none !important; } }`
  printWindow.document.head.appendChild(style)
  printWindow.document.body.prepend(buildManualPrintBar(printWindow))
}

export function isPopupBlockedError(error: unknown): boolean {
  return error instanceof Error && error.message === POPUP_BLOCKED_ERROR_CODE
}

export function openPrintExport(payload: ExportDocumentPayload): void {
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    throw new Error(POPUP_BLOCKED_ERROR_CODE)
  }

  let initialized = false
  const initializePrint = () => {
    if (initialized) return
    initialized = true
    ensureManualPrintUi(printWindow)

    try {
      printWindow.focus()
      printWindow.print()
    } catch (error) {
      console.error("Print export error:", error)
    }
  }

  printWindow.addEventListener("load", initializePrint, { once: true })
  printWindow.document.open()
  printWindow.document.write(payload.standaloneHtml)
  printWindow.document.close()
  printWindow.document.title = deriveWindowTitleFromFilename(payload.filename)
  window.setTimeout(initializePrint, 400)
}
