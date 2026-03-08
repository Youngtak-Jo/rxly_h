import type { UiLocale } from "@/i18n/config"
import { createEmptyDocumentContent } from "@/lib/documents/schema"
import type {
  DocumentFieldNode,
  GenericDocumentSection,
  DocumentGroupNode,
  DocumentSchemaNode,
  DocumentTemplateSchema,
} from "@/types/document"

function isKorean(locale: UiLocale) {
  return locale.startsWith("ko")
}

export function humanizeDocumentKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function buildSampleText(
  key: string,
  label: string,
  locale: UiLocale,
  index = 0
) {
  const normalized = `${key} ${label}`.toLowerCase()
  const korean = isKorean(locale)

  if (
    /payer|reviewer|insurer|보험자|심사기관/.test(normalized)
  ) {
    return korean ? "건강보험심사평가원(HIRA)" : "National payer review desk"
  }

  if (
    /claim_type|billing_type|청구 유형|청구유형/.test(normalized)
  ) {
    return korean ? "외래 EDI 청구 사전 검토" : "Outpatient EDI pre-submission review"
  }

  if (
    /review_summary|검토 요약/.test(normalized)
  ) {
    return korean
      ? "두통 외래 진료 청구 건으로, 상병 코드와 수가 코드의 정합성 및 첨부 서류 충족 여부를 검토한 결과입니다."
      : "Outpatient headache visit claim reviewed for code alignment and supporting-document completeness."
  }

  if (
    /edi_notes|edi 작성 메모|submission_note|transmission_note/.test(normalized)
  ) {
    return korean
      ? "주상병 코드와 청구 수가 코드의 연결 근거를 명시하고, 초진 기록 사본을 함께 첨부한 뒤 전송합니다."
      : "Document the rationale for diagnosis-to-billing-code alignment and attach the initial visit note before submission."
  }

  if (
    /final_recommendation|최종 권고/.test(normalized)
  ) {
    return korean
      ? "보완 서류를 추가한 뒤 재심사 요청 없이 제출 가능하며, 동일 패턴 반복 시 코드 선택 기준을 팀 내에서 재정리하는 것을 권고합니다."
      : "Proceed after attaching the missing supporting documents, and standardize code-selection guidance if this pattern recurs."
  }

  if (
    normalized.includes("service_date") ||
    normalized.includes("visit_date") ||
    normalized.includes("date")
  ) {
    return korean ? "2026-03-05" : "2026-03-05"
  }

  if (
    normalized.includes("procedure_code") ||
    normalized.includes("icd") ||
    normalized.includes("edi") ||
    normalized.includes("claim") ||
    normalized.includes("code")
  ) {
    return index === 0 ? "AA123" : "BB456"
  }

  if (normalized.includes("patient_name") || normalized.includes("name")) {
    return korean ? "홍길동" : "Alex Morgan"
  }

  if (normalized.includes("summary")) {
    return korean
      ? "상기도 감염 의심으로 3일 전부터 기침과 인후통이 지속되고 있습니다."
      : "Persistent cough and sore throat for three days, likely viral URI."
  }

  if (normalized.includes("assessment")) {
    return korean
      ? "임상 양상상 바이러스성 상기도 감염 가능성이 높습니다."
      : "Clinical presentation is most consistent with a viral upper respiratory infection."
  }

  if (normalized.includes("plan")) {
    return korean
      ? "대증 치료를 유지하고 악화 시 재내원하도록 안내합니다."
      : "Continue supportive care and return if symptoms worsen."
  }

  if (
    normalized.includes("note") ||
    normalized.includes("memo") ||
    normalized.includes("comment")
  ) {
    return korean
      ? "추가 서류 확인 후 최종 제출 전 재검토 필요."
      : "Review again before final submission after confirming supporting documents."
  }

  if (normalized.includes("status")) {
    return index === 0
      ? korean
        ? "검토 완료"
        : "Reviewed"
      : korean
        ? "보완 필요"
        : "Needs revision"
  }

  if (normalized.includes("reason")) {
    return korean
      ? "증빙 서류와 진료 기록 간 코드 정합성 확인 필요."
      : "Code alignment between supporting documents and visit record should be verified."
  }

  if (normalized.includes("reader") || normalized.includes("audience")) {
    return korean ? "보험 심사 담당자" : "Payer review specialist"
  }

  return korean
    ? `${label || humanizeDocumentKey(key)} 예시 값 ${index + 1}`
    : `${label || humanizeDocumentKey(key)} sample value ${index + 1}`
}

function buildSampleList(
  key: string,
  label: string,
  locale: UiLocale
): string[] {
  const normalized = `${key} ${label}`.toLowerCase()
  const korean = isKorean(locale)

  if (
    normalized.includes("requirements") ||
    normalized.includes("required_documents") ||
    normalized.includes("checklist") ||
    normalized.includes("items")
  ) {
    return korean
      ? ["초진 진료기록 사본 첨부", "상병 코드와 수가 코드 정합성 확인", "필요 시 검사 결과지 첨부"]
      : ["Attach the initial visit note", "Verify diagnosis-to-billing-code alignment", "Include supporting test results if needed"]
  }

  return korean
    ? ["예시 항목 1", "예시 항목 2"]
    : ["Sample item 1", "Sample item 2"]
}

function buildSampleValueForNode(
  node: DocumentSchemaNode,
  locale: UiLocale,
  index = 0
): unknown {
  if ("children" in node) {
    if (node.type === "repeatableGroup") {
      return [0, 1].map((itemIndex) =>
        Object.fromEntries(
          node.children.map((child) => [
            child.key,
            buildSampleValueForNode(child, locale, itemIndex),
          ])
        )
      )
    }

    return Object.fromEntries(
      node.children.map((child) => [
        child.key,
        buildSampleValueForNode(child, locale, index),
      ])
    )
  }

  if (node.type === "stringList") {
    return buildSampleList(node.key, node.label, locale)
  }

  return buildSampleText(node.key, node.label, locale, index)
}

export function buildSampleDocumentContent(
  schema: DocumentTemplateSchema,
  locale: UiLocale
): Record<string, unknown> {
  return Object.fromEntries(
    schema.nodes.map((node) => [
      node.key,
      buildSampleValueForNode(node, locale),
    ])
  )
}

function reconcileNodeValue(
  node: DocumentSchemaNode,
  currentValue: unknown,
  locale: UiLocale
): unknown {
  if ("children" in node) {
    if (node.type === "repeatableGroup") {
      const items = Array.isArray(currentValue) ? currentValue : []
      const sourceItems =
        items.length > 0
          ? items
          : (buildSampleValueForNode(node, locale) as Array<Record<string, unknown>>)

      return sourceItems.map((item) => {
        const objectItem =
          item && typeof item === "object" && !Array.isArray(item)
            ? (item as Record<string, unknown>)
            : {}

        return Object.fromEntries(
          node.children.map((child) => [
            child.key,
            reconcileNodeValue(child, objectItem[child.key], locale),
          ])
        )
      })
    }

    const objectValue =
      currentValue && typeof currentValue === "object" && !Array.isArray(currentValue)
        ? (currentValue as Record<string, unknown>)
        : {}

    return Object.fromEntries(
      node.children.map((child) => [
        child.key,
        reconcileNodeValue(child, objectValue[child.key], locale),
      ])
    )
  }

  if (node.type === "stringList") {
    return Array.isArray(currentValue) && currentValue.every((item) => typeof item === "string")
      ? currentValue
      : buildSampleList(node.key, node.label, locale)
  }

  return typeof currentValue === "string"
    ? currentValue
    : buildSampleText(node.key, node.label, locale)
}

export function reconcileSampleDocumentContent(
  schema: DocumentTemplateSchema,
  previousContent: Record<string, unknown> | null,
  locale: UiLocale
): Record<string, unknown> {
  const base = createEmptyDocumentContent(schema)
  const previous = previousContent ?? {}

  return Object.fromEntries(
    schema.nodes.map((node) => [
      node.key,
      reconcileNodeValue(node, previous[node.key] ?? base[node.key], locale),
    ])
  )
}

function isEmptyValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).every(isEmptyValue)
  }
  return value === "" || value == null
}

function inferSchemaNodeFromValue(
  key: string,
  value: unknown
): DocumentSchemaNode {
  const label = humanizeDocumentKey(key)

  if (Array.isArray(value)) {
    const firstNonEmptyItem = value.find((item) => !isEmptyValue(item))
    if (
      firstNonEmptyItem &&
      typeof firstNonEmptyItem === "object" &&
      !Array.isArray(firstNonEmptyItem)
    ) {
      const sampleItem = firstNonEmptyItem as Record<string, unknown>
      return {
        key,
        label,
        helpText: "",
        required: false,
        placeholder: "",
        type: "repeatableGroup",
        children: Object.keys(sampleItem).map((childKey) =>
          inferSchemaNodeFromValue(childKey, sampleItem[childKey])
        ),
      }
    }

    return {
      key,
      label,
      helpText: "",
      required: false,
      placeholder: "",
      type: "stringList",
    }
  }

  if (value && typeof value === "object") {
    const objectValue = value as Record<string, unknown>
    return {
      key,
      label,
      helpText: "",
      required: false,
      placeholder: "",
      type: "group",
      children: Object.keys(objectValue).map((childKey) =>
        inferSchemaNodeFromValue(childKey, objectValue[childKey])
      ),
    }
  }

  return {
    key,
    label,
    helpText: "",
    required: false,
    placeholder: "",
    type: "shortText",
  }
}

function buildFieldSection(
  node: DocumentFieldNode,
  rawValue: unknown
): GenericDocumentSection | null {
  if (node.type === "stringList") {
    if (!Array.isArray(rawValue)) return null
    const items = rawValue.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    if (items.length === 0) return null
    return {
      kind: "field",
      label: node.label || humanizeDocumentKey(node.key),
      value: items,
    }
  }

  if (typeof rawValue !== "string" || rawValue.trim().length === 0) {
    return null
  }

  return {
    kind: "field",
    label: node.label || humanizeDocumentKey(node.key),
    value: rawValue,
  }
}

function buildGroupSection(
  node: DocumentGroupNode,
  rawValue: unknown
): GenericDocumentSection | null {
  if (node.type === "repeatableGroup") {
    if (!Array.isArray(rawValue)) return null

    const items = rawValue
      .map((item) =>
        buildGenericDocumentSections(
          item && typeof item === "object" && !Array.isArray(item)
            ? (item as Record<string, unknown>)
            : {},
          node.children
        )
      )
      .filter((sections) => sections.length > 0)

    if (items.length === 0) return null

    return {
      kind: "repeatableGroup",
      label: node.label || humanizeDocumentKey(node.key),
      itemLabel: node.itemLabel?.trim() || undefined,
      items,
    }
  }

  const objectValue =
    rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)
      ? (rawValue as Record<string, unknown>)
      : {}

  const children = buildGenericDocumentSections(objectValue, node.children)
  if (children.length === 0) return null

  return {
    kind: "group",
    label: node.label || humanizeDocumentKey(node.key),
    children,
  }
}

export function buildGenericDocumentSections(
  content: Record<string, unknown>,
  schemaNodes?: DocumentSchemaNode[]
): GenericDocumentSection[] {
  const sourceNodes =
    schemaNodes ?? Object.keys(content).map((key) => inferSchemaNodeFromValue(key, content[key]))

  return sourceNodes.flatMap((node) => {
    const rawValue = content[node.key]
    if (isEmptyValue(rawValue)) {
      return []
    }

    if ("children" in node) {
      const section = buildGroupSection(node, rawValue)
      return section ? [section] : []
    }

    const section = buildFieldSection(node, rawValue)
    return section ? [section] : []
  })
}
