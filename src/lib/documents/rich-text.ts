import type { AnyExtension, JSONContent } from "@tiptap/core"
import { generateHTML } from "@tiptap/html"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
} from "@tiptap/extension-table"
import TaskList from "@tiptap/extension-task-list"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import StarterKit from "@tiptap/starter-kit"
import { buildGenericDocumentSections } from "@/lib/documents/preview"
import { RichHeading } from "@/lib/documents/extensions/rich-heading"
import { CalloutNode } from "@/lib/documents/extensions/callout-node"
import { RichTaskItem } from "@/lib/documents/extensions/rich-task-item"
import type {
  DocumentSchemaNode,
  GenericDocumentSection,
} from "@/types/document"
import type { ChecklistItem, DiagnosisItem } from "@/types/insights"
import type { PatientHandoutDocument, PatientHandoutSections } from "@/types/patient-handout"
import type { ConsultationRecord, Vitals } from "@/types/record"

export type RichTextDocument = JSONContent

export interface DocumentHtmlOptions {
  className?: string
}

export interface RecordRichTextLabels {
  vitals: string
  sections: {
    chiefComplaint: string
    hpiText: string
    medications: string
    rosText: string
    pmh: string
    socialHistory: string
    familyHistory: string
    physicalExam: string
    labsStudies: string
    assessment: string
    plan: string
  }
}

export interface PatientHandoutRichTextLabels {
  sections: Record<keyof PatientHandoutSections, string>
}

export interface InsightsRichTextLabels {
  summary: string
  keyFindings: string
  redFlags: string
  checklist: string
  images: string
}

export interface DdxRichTextLabels {
  references: string
  evidence: string
  confidence: string
  icd: string
  referenceCount: string
}

export const RECORD_SECTION_KEYS = [
  "chiefComplaint",
  "hpiText",
  "medications",
  "rosText",
  "pmh",
  "socialHistory",
  "familyHistory",
  "physicalExam",
  "labsStudies",
  "assessment",
  "plan",
] as const

const PATIENT_HANDOUT_SECTION_KEYS = [
  "conditionOverview",
  "signsSymptoms",
  "causesRiskFactors",
  "complications",
  "treatmentOptions",
  "whenToSeekHelp",
  "additionalAdviceFollowUp",
  "disclaimer",
] as const

export const DOCUMENT_HTML_STYLE = `
  .rxly-document-root {
    font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
    color: #1f2937;
    font-size: 15px;
    line-height: 1.75;
    letter-spacing: -0.01em;
  }
  .rxly-document-root h1,
  .rxly-document-root h2,
  .rxly-document-root h3,
  .rxly-document-root h4 {
    font-family: "Geist", "Inter", ui-sans-serif, sans-serif;
    color: #111827;
    letter-spacing: -0.02em;
  }
  .rxly-document-root h1 {
    font-size: 1.8rem;
    line-height: 1.15;
    margin: 0 0 1.5rem;
  }
  .rxly-document-root h2 {
    font-size: 1rem;
    line-height: 1.35;
    margin: 2rem 0 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .rxly-document-root h3 {
    font-size: 1rem;
    line-height: 1.45;
    margin: 1.35rem 0 0.45rem;
  }
  .rxly-document-root p,
  .rxly-document-root ul,
  .rxly-document-root ol,
  .rxly-document-root blockquote,
  .rxly-document-root table,
  .rxly-document-root pre,
  .rxly-document-root hr,
  .rxly-document-root div[data-callout] {
    margin: 0.75rem 0;
  }
  .rxly-document-root ul,
  .rxly-document-root ol {
    padding-left: 1.3rem;
    list-style-position: outside;
  }
  .rxly-document-root ul {
    list-style: disc outside;
  }
  .rxly-document-root ol {
    list-style: decimal outside;
  }
  .rxly-document-root li + li {
    margin-top: 0.35rem;
  }
  .rxly-document-root li::marker {
    color: #374151;
  }
  .rxly-document-root ul[data-type="taskList"] {
    list-style: none;
    padding-left: 0;
  }
  .rxly-document-root :is(ul[data-type="taskList"] > li, li[data-type="taskItem"]) {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
  }
  .rxly-document-root :is(
      ul[data-type="taskList"] > li + li,
      li[data-type="taskItem"] + li[data-type="taskItem"]
    ) {
    margin-top: 0.55rem;
  }
  .rxly-document-root :is(ul[data-type="taskList"] > li, li[data-type="taskItem"]) > label {
    display: flex;
    flex: none;
    align-items: center;
    margin-top: 0.15rem;
  }
  .rxly-document-root :is(ul[data-type="taskList"] > li, li[data-type="taskItem"]) > label input {
    width: 1rem;
    height: 1rem;
  }
  .rxly-document-root :is(ul[data-type="taskList"] > li, li[data-type="taskItem"]) > div {
    min-width: 0;
    flex: 1 1 auto;
  }
  .rxly-document-root :is(ul[data-type="taskList"] > li, li[data-type="taskItem"]) > div > p:first-child {
    display: inline;
    margin: 0;
  }
  .rxly-document-root :is(ul[data-type="taskList"] > li, li[data-type="taskItem"]) > div > p + p {
    display: block;
    margin-top: 0.3rem;
    color: #6b7280;
    font-size: 0.94em;
  }
  .rxly-document-root blockquote {
    border-left: 2px solid #d1d5db;
    padding-left: 1rem;
    color: #4b5563;
  }
  .rxly-document-root table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .rxly-document-root th,
  .rxly-document-root td {
    border: 1px solid #e5e7eb;
    padding: 0.65rem 0.8rem;
    vertical-align: top;
    text-align: left;
  }
  .rxly-document-root th {
    font-family: "Geist", "Inter", ui-sans-serif, sans-serif;
    font-size: 0.76rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #6b7280;
    background: #f8fafc;
  }
  .rxly-document-root hr {
    border: 0;
    border-top: 1px solid #e5e7eb;
  }
  .rxly-document-root a {
    color: #9a3412;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
  .rxly-document-root img {
    display: block;
    width: 100%;
    max-width: 100%;
    height: auto;
    border-radius: 0.9rem;
    border: 1px solid #e5e7eb;
  }
  .rxly-document-root div[data-callout] {
    border-radius: 0.9rem;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    padding: 0.9rem 1rem;
  }
  .rxly-document-root div[data-callout="warning"] {
    border-color: #fdba74;
    background: #fff7ed;
  }
  .rxly-document-root div[data-callout="success"] {
    border-color: #86efac;
    background: #f0fdf4;
  }
`

export function createRichTextExtensions(options?: {
  placeholder?: string
  includePlaceholder?: boolean
  onReadOnlyChecklistToggle?: (itemId: string, checked: boolean) => boolean
}) {
  const extensions: AnyExtension[] = [
    StarterKit.configure({
      heading: false,
      blockquote: {
        HTMLAttributes: { class: "rxly-document-blockquote" },
      },
    }),
    RichHeading.configure({ levels: [1, 2, 3, 4] }),
    Underline,
    Highlight,
    TaskList,
    RichTaskItem.configure({
      nested: true,
      onReadOnlyChecked: options?.onReadOnlyChecklistToggle
        ? (node, checked) => {
            const itemId =
              typeof node.attrs.itemId === "string" ? node.attrs.itemId : ""
            if (!itemId) return false
            return options.onReadOnlyChecklistToggle?.(itemId, checked) ?? false
          }
        : undefined,
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: { class: "rxly-document-table" },
    }),
    TableRow,
    TableHeader,
    TableCell,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      },
    }),
    Image.configure({
      HTMLAttributes: {
        class: "rxly-document-image",
      },
      allowBase64: true,
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    CalloutNode,
  ]

  if (options?.includePlaceholder !== false) {
    extensions.push(
      Placeholder.configure({
        placeholder: options?.placeholder || "",
        emptyNodeClass:
          "before:pointer-events-none before:float-left before:text-muted-foreground/70 before:content-[attr(data-placeholder)]",
      })
    )
  }

  return extensions
}

export function emptyRichTextDocument(): RichTextDocument {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  }
}

export function isRichTextDocument(value: unknown): value is RichTextDocument {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    (value as { type?: unknown }).type === "doc"
  )
}

export function normalizeRichTextDocument(
  value: unknown,
  fallback?: RichTextDocument
): RichTextDocument {
  if (isRichTextDocument(value)) {
    const content = Array.isArray(value.content) ? value.content : [{ type: "paragraph" }]
    return {
      ...value,
      content,
    }
  }

  return fallback ?? emptyRichTextDocument()
}

export function createTextNode(text: string, marks?: JSONContent["marks"]): JSONContent {
  return {
    type: "text",
    text,
    ...(marks ? { marks } : {}),
  }
}

export function createParagraphNode(text?: string | null): JSONContent {
  const trimmed = text?.trim() ?? ""
  return {
    type: "paragraph",
    content: trimmed ? [createTextNode(trimmed)] : undefined,
  }
}

export function createHeadingNode(
  text: string,
  level: 1 | 2 | 3 | 4 = 2,
  attrs?: Record<string, string | number | null>
): JSONContent {
  return {
    type: "heading",
    attrs: {
      level,
      ...(attrs ?? {}),
    },
    content: text.trim() ? [createTextNode(text.trim())] : undefined,
  }
}

export function createHorizontalRuleNode(): JSONContent {
  return { type: "horizontalRule" }
}

export function createImageNode(src: string, alt?: string | null): JSONContent {
  return {
    type: "image",
    attrs: {
      src,
      alt: alt || "",
    },
  }
}

export function createBulletListNode(items: string[]): JSONContent | null {
  const normalized = items.map((item) => item.trim()).filter(Boolean)
  if (normalized.length === 0) return null

  return {
    type: "bulletList",
    content: normalized.map((item) => ({
      type: "listItem",
      content: [createParagraphNode(item)],
    })),
  }
}

export function createOrderedListNode(items: string[]): JSONContent | null {
  const normalized = items.map((item) => item.trim()).filter(Boolean)
  if (normalized.length === 0) return null

  return {
    type: "orderedList",
    attrs: { start: 1 },
    content: normalized.map((item) => ({
      type: "listItem",
      content: [createParagraphNode(item)],
    })),
  }
}

export function createTaskListNode(
  items: Array<{
    itemId?: string | null
    label: string
    checked?: boolean
    note?: string | null
  }>
): JSONContent | null {
  const normalized = items.filter((item) => item.label.trim())
  if (normalized.length === 0) return null

  return {
    type: "taskList",
    content: normalized.map((item) => ({
      type: "taskItem",
      attrs: {
        checked: !!item.checked,
        itemId: item.itemId ?? null,
      },
      content: [
        createParagraphNode(item.label),
        ...(item.note?.trim()
          ? [
              {
                type: "paragraph",
                content: [createTextNode(item.note.trim())],
              },
            ]
          : []),
      ],
    })),
  }
}

export function createCalloutNode(
  text: string,
  variant: "note" | "warning" | "success" = "note"
): JSONContent {
  return {
    type: "callout",
    attrs: { variant },
    content: [createParagraphNode(text)],
  }
}

export function createTableNode(
  headers: string[],
  rows: string[][]
): JSONContent | null {
  const normalizedRows = rows.filter((row) => row.some((cell) => cell.trim()))
  if (headers.length === 0 || normalizedRows.length === 0) {
    return null
  }

  return {
    type: "table",
    content: [
      {
        type: "tableRow",
        content: headers.map((header) => ({
          type: "tableHeader",
          content: [createParagraphNode(header)],
        })),
      },
      ...normalizedRows.map((row) => ({
        type: "tableRow",
        content: headers.map((_, index) => ({
          type: "tableCell",
          content: [createParagraphNode(row[index] || "")],
        })),
      })),
    ],
  }
}

function splitParagraphs(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function paragraphsToNodes(value: string | null | undefined): JSONContent[] {
  const parts = splitParagraphs(value)
  if (parts.length === 0) return [createParagraphNode("")]
  return parts.map((part) => createParagraphNode(part))
}

function listFromMultiline(value: string | null | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((item) => item.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
}

export function recordToRichTextDocument(
  record: ConsultationRecord,
  labels: RecordRichTextLabels
): RichTextDocument {
  const content: JSONContent[] = []
  const vitalsEntries = record.vitals
    ? (Object.entries(record.vitals).filter(([, value]) => (value || "").trim()) as Array<
        [keyof Vitals, string]
      >)
    : []

  if (vitalsEntries.length > 0) {
    content.push(
      createHeadingNode(labels.vitals, 2, {
        sectionKey: "vitals",
        sectionKind: "record",
      })
    )
    content.push(
      createTableNode(
        vitalsEntries.map(([key]) => key.toUpperCase()),
        [vitalsEntries.map(([, value]) => value)]
      ) ?? createParagraphNode("")
    )
  }

  for (const key of RECORD_SECTION_KEYS) {
    content.push(
      createHeadingNode(labels.sections[key], 2, {
        sectionKey: key,
        sectionKind: "record",
      })
    )

    const value = record[key]
    if (key === "assessment") {
      content.push(
        createOrderedListNode(listFromMultiline(value)) ?? createParagraphNode("")
      )
      continue
    }

    if (key === "medications" || key === "labsStudies") {
      content.push(
        createBulletListNode(listFromMultiline(value)) ?? createParagraphNode("")
      )
      continue
    }

    content.push(...paragraphsToNodes(typeof value === "string" ? value : ""))
  }

  return {
    type: "doc",
    content,
  }
}

function nodeText(node: JSONContent | null | undefined): string {
  if (!node) return ""
  if (node.type === "text") {
    return node.text ?? ""
  }
  return (node.content ?? []).map((child) => nodeText(child)).join("")
}

function plainTextForNode(node: JSONContent | null | undefined): string {
  if (!node) return ""

  if (node.type === "paragraph" || node.type === "heading") {
    return nodeText(node).trim()
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    return (node.content ?? [])
      .map((item, index) => {
        const text = (item.content ?? [])
          .map((child) => plainTextForNode(child))
          .filter(Boolean)
          .join("\n")
        return node.type === "orderedList"
          ? `${index + 1}. ${text}`.trim()
          : text
      })
      .filter(Boolean)
      .join("\n")
  }

  if (node.type === "taskList") {
    return (node.content ?? [])
      .map((item) => {
        const checked = item.attrs?.checked ? "[x]" : "[ ]"
        const text = (item.content ?? [])
          .map((child) => plainTextForNode(child))
          .filter(Boolean)
          .join("\n")
        return `${checked} ${text}`.trim()
      })
      .filter(Boolean)
      .join("\n")
  }

  if (node.type === "blockquote" || node.type === "callout") {
    return (node.content ?? []).map((child) => plainTextForNode(child)).join("\n\n")
  }

  if (node.type === "table") {
    return (node.content ?? [])
      .slice(1)
      .map((row) =>
        (row.content ?? [])
          .map((cell) =>
            (cell.content ?? []).map((child) => plainTextForNode(child)).join(" ")
          )
          .join(" | ")
      )
      .join("\n")
  }

  return (node.content ?? []).map((child) => plainTextForNode(child)).join("\n")
}

function parseVitalsFromTable(tableNode: JSONContent | undefined): Vitals | null {
  if (!tableNode || tableNode.type !== "table") return null

  const rows = tableNode.content ?? []
  const headerRow = rows[0]
  const valueRow = rows[1]
  if (!headerRow || !valueRow) return null

  const headers = (headerRow.content ?? []).map((cell) =>
    ((cell.content ?? []).map((child) => plainTextForNode(child)).join(" ") || "")
      .trim()
      .toLowerCase()
  )
  const values = (valueRow.content ?? []).map((cell) =>
    ((cell.content ?? []).map((child) => plainTextForNode(child)).join(" ") || "").trim()
  )

  const map: Partial<Vitals> = {}
  headers.forEach((header, index) => {
    const value = values[index] || ""
    if (header === "bp") map.bp = value
    if (header === "hr") map.hr = value
    if (header === "temp") map.temp = value
    if (header === "rr") map.rr = value
    if (header === "spo2") map.spo2 = value
  })

  if (!map.bp && !map.hr && !map.temp && !map.rr && !map.spo2) {
    return null
  }

  return {
    bp: map.bp || "",
    hr: map.hr || "",
    temp: map.temp || "",
    rr: map.rr || "",
    spo2: map.spo2 || "",
  }
}

export function deriveRecordFromRichTextDocument(
  document: RichTextDocument,
  baseRecord: ConsultationRecord
): ConsultationRecord {
  const nextRecord: ConsultationRecord = {
    ...baseRecord,
    documentJson: document,
  }
  const sectionBuffers = new Map<string, JSONContent[]>()
  let activeSection: string | null = null

  for (const node of document.content ?? []) {
    if (node.type === "heading" && typeof node.attrs?.sectionKey === "string") {
      activeSection = node.attrs.sectionKey
      sectionBuffers.set(activeSection, [])
      continue
    }

    if (activeSection) {
      sectionBuffers.get(activeSection)?.push(node)
    }
  }

  const vitals = parseVitalsFromTable(sectionBuffers.get("vitals")?.[0])
  nextRecord.vitals = vitals

  for (const key of RECORD_SECTION_KEYS) {
    const nodes = sectionBuffers.get(key) ?? []
    const text = nodes.map((node) => plainTextForNode(node)).filter(Boolean).join("\n\n").trim()
    nextRecord[key] = text || null
  }

  return nextRecord
}

export function patientHandoutToRichTextDocument(
  document: PatientHandoutDocument,
  labels: PatientHandoutRichTextLabels
): RichTextDocument {
  const content: JSONContent[] = []

  for (const condition of document.conditions) {
    content.push(
      createHeadingNode(condition.diseaseName, 2, {
        conditionId: condition.id,
        sectionKind: "patient-handout-condition",
      })
    )
    content.push(createParagraphNode(condition.icdCode))

    const entry =
      document.entries.find((item) => item.conditionId === condition.id) ?? null

    for (const sectionKey of PATIENT_HANDOUT_SECTION_KEYS) {
      content.push(
        createHeadingNode(labels.sections[sectionKey], 3, {
          conditionId: condition.id,
          sectionKey,
          sectionKind: "patient-handout-section",
        })
      )
      content.push(
        ...paragraphsToNodes(entry?.sections[sectionKey] || "")
      )
    }
  }

  return {
    type: "doc",
    content,
  }
}

export function derivePatientHandoutFromRichTextDocument(
  documentJson: RichTextDocument,
  baseDocument: PatientHandoutDocument
): PatientHandoutDocument {
  const entriesByConditionId = new Map(
    baseDocument.entries.map((entry) => [
      entry.conditionId,
      { ...entry.sections },
    ])
  )
  let currentConditionId: string | null = null
  let currentSectionKey: keyof PatientHandoutSections | null = null
  const currentBuffers = new Map<string, JSONContent[]>()

  for (const node of documentJson.content ?? []) {
    if (node.type === "heading" && typeof node.attrs?.conditionId === "string") {
      currentConditionId = node.attrs.conditionId
      if (typeof node.attrs?.sectionKey === "string") {
        currentSectionKey = node.attrs.sectionKey as keyof PatientHandoutSections
        currentBuffers.set(
          `${currentConditionId}:${currentSectionKey}`,
          []
        )
      } else {
        currentSectionKey = null
      }
      continue
    }

    if (currentConditionId && currentSectionKey) {
      currentBuffers
        .get(`${currentConditionId}:${currentSectionKey}`)
        ?.push(node)
    }
  }

  const entries = baseDocument.conditions.map((condition) => {
    const baseSections =
      entriesByConditionId.get(condition.id) ?? {
        conditionOverview: "",
        signsSymptoms: "",
        causesRiskFactors: "",
        complications: "",
        treatmentOptions: "",
        whenToSeekHelp: "",
        additionalAdviceFollowUp: "",
        disclaimer: "",
      }

    const sections = { ...baseSections }
    for (const sectionKey of PATIENT_HANDOUT_SECTION_KEYS) {
      const nodes = currentBuffers.get(`${condition.id}:${sectionKey}`) ?? []
      const text = nodes.map((node) => plainTextForNode(node)).filter(Boolean).join("\n\n").trim()
      sections[sectionKey] = text
    }

    return {
      conditionId: condition.id,
      sections,
    }
  })

  return {
    ...baseDocument,
    documentJson,
    entries,
  }
}

export function insightsToRichTextDocument(input: {
  summary: string
  keyFindings: string[]
  redFlags: string[]
  checklistItems: ChecklistItem[]
  images: Array<{ url: string; alt: string }>
  labels: InsightsRichTextLabels
}): RichTextDocument {
  const content: JSONContent[] = []

  if (input.summary.trim()) {
    content.push(createHeadingNode(input.labels.summary, 2))
    content.push(...paragraphsToNodes(input.summary))
  }

  if (input.keyFindings.length > 0) {
    content.push(createHeadingNode(input.labels.keyFindings, 2))
    content.push(createBulletListNode(input.keyFindings) ?? createParagraphNode(""))
  }

  if (input.redFlags.length > 0) {
    content.push(createHeadingNode(input.labels.redFlags, 2))
    content.push(createBulletListNode(input.redFlags) ?? createParagraphNode(""))
  }

  if (input.checklistItems.length > 0) {
    content.push(createHeadingNode(input.labels.checklist, 2))
    content.push(
      createTaskListNode(
        input.checklistItems.map((item) => ({
          itemId: item.id,
          label: item.label,
          checked: item.isChecked,
          note: item.doctorNote || "",
        }))
      ) ?? createParagraphNode("")
    )
  }

  if (input.images.length > 0) {
    content.push(createHeadingNode(input.labels.images, 2))
    input.images.forEach((image) => {
      content.push(createImageNode(image.url, image.alt))
    })
  }

  if (content.length === 0) {
    content.push(createParagraphNode(""))
  }

  return {
    type: "doc",
    content,
  }
}

export function ddxToRichTextDocument(
  diagnoses: DiagnosisItem[],
  labels: DdxRichTextLabels
): RichTextDocument {
  const content: JSONContent[] = []

  diagnoses.forEach((diagnosis, index) => {
    content.push(createHeadingNode(`${index + 1}. ${diagnosis.diseaseName}`, 2))
    content.push(
      createParagraphNode(
        `${labels.icd}: ${diagnosis.icdCode} · ${labels.confidence}: ${diagnosis.confidence} · ${labels.referenceCount}: ${diagnosis.citations.length}`
      )
    )
    content.push(createHeadingNode(labels.evidence, 3))
    content.push(...paragraphsToNodes(diagnosis.evidence))

    if (diagnosis.citations.length > 0) {
      content.push(createHeadingNode(labels.references, 3))
      content.push(
        createOrderedListNode(
          diagnosis.citations.map(
            (citation) => `${citation.source.toUpperCase()}: ${citation.title} (${citation.url})`
          )
        ) ?? createParagraphNode("")
      )
    }
  })

  if (content.length === 0) {
    content.push(createParagraphNode(""))
  }

  return {
    type: "doc",
    content,
  }
}

function genericSectionToNodes(
  section: GenericDocumentSection,
  level = 2
): JSONContent[] {
  if (section.kind === "field") {
    const heading = createHeadingNode(section.label, Math.min(level, 4) as 2 | 3 | 4)
    if (Array.isArray(section.value)) {
      return [heading, createBulletListNode(section.value) ?? createParagraphNode("")]
    }
    return [heading, ...paragraphsToNodes(section.value)]
  }

  if (section.kind === "group") {
    return [
      createHeadingNode(section.label, Math.min(level, 4) as 2 | 3 | 4),
      ...section.children.flatMap((child) => genericSectionToNodes(child, level + 1)),
    ]
  }

  const nodes: JSONContent[] = [
    createHeadingNode(section.label, Math.min(level, 4) as 2 | 3 | 4),
  ]
  section.items.forEach((item, index) => {
    nodes.push(
      createHeadingNode(
        `${section.itemLabel || "Item"} ${index + 1}`,
        Math.min(level + 1, 4) as 2 | 3 | 4
      )
    )
    nodes.push(...item.flatMap((child) => genericSectionToNodes(child, level + 2)))
  })
  return nodes
}

export function genericStructuredContentToRichTextDocument(args: {
  contentJson: Record<string, unknown>
  schemaNodes?: DocumentSchemaNode[]
}): RichTextDocument {
  const sections = buildGenericDocumentSections(args.contentJson, args.schemaNodes)
  const content = sections.flatMap((section) => genericSectionToNodes(section))
  return {
    type: "doc",
    content: content.length > 0 ? content : [createParagraphNode("")],
  }
}

function starterNodesFromSchema(nodes: DocumentSchemaNode[], level = 2): JSONContent[] {
  return nodes.flatMap((node) => {
    if (node.type === "group" || node.type === "repeatableGroup") {
      return [
        createHeadingNode(node.label, Math.min(level, 4) as 2 | 3 | 4),
        ...(node.helpText ? [createParagraphNode(node.helpText)] : []),
        ...starterNodesFromSchema(node.children, level + 1),
      ]
    }

    return [
      createHeadingNode(node.label, Math.min(level, 4) as 2 | 3 | 4),
      ...(node.helpText ? [createParagraphNode(node.helpText)] : []),
      createParagraphNode(""),
    ]
  })
}

export function buildStarterRichTextDocument(
  schemaNodes: DocumentSchemaNode[]
): RichTextDocument {
  const content = starterNodesFromSchema(schemaNodes)
  return {
    type: "doc",
    content: content.length > 0 ? content : [createParagraphNode("")],
  }
}

export function richTextDocumentToHtml(
  document: RichTextDocument,
  options?: DocumentHtmlOptions
): string {
  const extensions = createRichTextExtensions({ includePlaceholder: false })
  const body = generateHTML(normalizeRichTextDocument(document), extensions)
  const className = options?.className || "rxly-document-root"
  return `<style>${DOCUMENT_HTML_STYLE}</style><div class="${className}">${body}</div>`
}
