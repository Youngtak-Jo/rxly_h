import {
  documentTemplateCreateSchema,
  documentTemplateLanguageSchema,
  documentTemplateRegionSchema,
  normalizeDocumentGenerationConfig,
  normalizeDocumentTemplateSchema,
} from "@/lib/documents/schema"
import type {
  DocumentBuilderDraft,
  DocumentFieldNode,
  DocumentTemplateLanguage,
  DocumentTemplateRegion,
  DocumentSchemaNode,
  DocumentTemplateSchema,
} from "@/types/document"
import {
  DEFAULT_DOCUMENT_REGION,
  inferDocumentRegionFromText,
} from "@/lib/documents/language-region"

function isKorean(text: string) {
  return /[가-힣]/.test(text)
}

function slugifyKey(input: string, fallback: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")

  if (!normalized || !/^[a-z]/.test(normalized)) {
    return fallback
  }

  return normalized.slice(0, 64)
}

function createField(
  key: string,
  label: string,
  type: "shortText" | "longText" | "stringList" = "shortText",
  options?: Partial<DocumentFieldNode>
): DocumentSchemaNode {
  return {
    key,
    label,
    type,
    helpText: "",
    required: false,
    placeholder: "",
    ...options,
  }
}

function createGroup(
  key: string,
  label: string,
  children: DocumentSchemaNode[],
  repeatable = false
): DocumentSchemaNode {
  return {
    key,
    label,
    type: repeatable ? "repeatableGroup" : "group",
    helpText: "",
    required: false,
    placeholder: "",
    children,
  }
}

function buildClaimReviewSchema(korean: boolean): DocumentTemplateSchema {
  return {
    nodes: [
      createGroup(
        "claim_overview",
        korean ? "청구 개요" : "Claim overview",
        [
          createField(
            "payer_name",
            korean ? "보험자 / 심사기관" : "Payer / reviewer"
          ),
          createField(
            "claim_type",
            korean ? "청구 유형" : "Claim type"
          ),
          createField(
            "service_date",
            korean ? "진료일" : "Service date"
          ),
          createField(
            "review_summary",
            korean ? "검토 요약" : "Review summary",
            "longText"
          ),
        ]
      ),
      createGroup(
        "service_lines",
        korean ? "청구 항목" : "Service lines",
        [
          createField(
            "procedure_code",
            korean ? "처치 / 수가 코드" : "Procedure / billing code"
          ),
          createField(
            "diagnosis_code",
            korean ? "상병 코드" : "Diagnosis code"
          ),
          createField(
            "review_status",
            korean ? "검토 상태" : "Review status"
          ),
          createField(
            "adjustment_reason",
            korean ? "삭감 / 보완 사유" : "Adjustment reason",
            "longText"
          ),
          createField(
            "reviewer_note",
            korean ? "검토 메모" : "Reviewer note",
            "longText"
          ),
        ],
        true
      ),
      createGroup(
        "submission_checklist",
        korean ? "제출 체크리스트" : "Submission checklist",
        [
          createField(
            "required_documents",
            korean ? "필수 첨부 문서" : "Required documents",
            "stringList"
          ),
          createField(
            "edi_notes",
            korean ? "EDI 작성 메모" : "EDI notes",
            "longText"
          ),
          createField(
            "final_recommendation",
            korean ? "최종 권고" : "Final recommendation",
            "longText"
          ),
        ]
      ),
    ],
  }
}

function buildGenericSchema(korean: boolean): DocumentTemplateSchema {
  return {
    nodes: [
      createGroup(
        "document_header",
        korean ? "문서 개요" : "Document header",
        [
          createField(
            "document_purpose",
            korean ? "문서 목적" : "Document purpose",
            "longText"
          ),
          createField(
            "target_reader",
            korean ? "대상 사용자" : "Target reader"
          ),
        ]
      ),
      createGroup(
        "core_sections",
        korean ? "핵심 내용" : "Core sections",
        [
          createField(
            "summary",
            korean ? "요약" : "Summary",
            "longText"
          ),
          createField(
            "key_points",
            korean ? "핵심 항목" : "Key points",
            "stringList"
          ),
          createField(
            "notes",
            korean ? "메모" : "Notes",
            "longText"
          ),
        ]
      ),
      createGroup(
        "follow_up_items",
        korean ? "후속 항목" : "Follow-up items",
        [
          createField(
            "required_actions",
            korean ? "필수 조치" : "Required actions",
            "stringList"
          ),
          createField(
            "additional_comments",
            korean ? "추가 코멘트" : "Additional comments",
            "longText"
          ),
        ]
      ),
    ],
  }
}

function detectDraftPreset(prompt: string) {
  const lower = prompt.toLowerCase()
  return {
    korean: isKorean(prompt),
    claimReview:
      /hira|edi|claim|payer|insurance|billing|reimbursement/.test(lower) ||
      /청구|심사|보험|급여|삭감|수가|edi/.test(prompt),
    patientFacing:
      /patient handout|instruction|education|discharge/.test(lower) ||
      /환자 안내|교육|설명|퇴원/.test(prompt),
  }
}

function summarizePrompt(prompt: string, maxLength = 80) {
  const compact = prompt.replace(/\s+/g, " ").trim()
  return compact.length > maxLength
    ? `${compact.slice(0, maxLength - 1)}…`
    : compact
}

function buildFallbackPurposeDescription(args: {
  korean: boolean
  claimReview: boolean
  patientFacing: boolean
}) {
  if (args.claimReview) {
    return args.korean
      ? "건강보험 청구 제출 전 상병/수가 코드 정합성과 삭감 리스크를 점검하기 위한 심사 검토 문서입니다."
      : "Purpose-built review template for validating claim-code alignment and denial risk before insurance submission."
  }

  if (args.patientFacing) {
    return args.korean
      ? "환자에게 진단, 자가관리, 추적 관찰 계획을 이해하기 쉽게 안내하기 위한 문서입니다."
      : "Purpose-built patient document for explaining diagnosis, self-care guidance, and follow-up plans."
  }

  return args.korean
    ? "진료 이후 핵심 정보를 구조화해 팀 공유와 후속 조치를 일관되게 수행하기 위한 문서입니다."
    : "Purpose-built clinical template to structure post-consultation information for team handoff and follow-up actions."
}

export function buildFallbackDocumentDraft(
  prompt: string,
  options?: {
    defaultLanguage?: DocumentTemplateLanguage
    defaultRegion?: DocumentTemplateRegion
  }
): DocumentBuilderDraft {
  const preset = detectDraftPreset(prompt)
  const language = documentTemplateLanguageSchema.parse(
    preset.korean ? "ko" : "en"
  )
  const korean = language === "ko"
  const region = documentTemplateRegionSchema.parse(
    inferDocumentRegionFromText(prompt) ??
      options?.defaultRegion ??
      DEFAULT_DOCUMENT_REGION
  )
  const schema = preset.claimReview
    ? buildClaimReviewSchema(korean)
    : buildGenericSchema(korean)

  const title = preset.claimReview
    ? korean
      ? "건강보험 청구 검토 문서"
      : "Insurance Claim Review Document"
    : preset.patientFacing
      ? korean
        ? "환자 안내 문서"
        : "Patient Guidance Document"
      : korean
        ? "맞춤 의료 문서"
        : "Custom Clinical Document"

  const description = buildFallbackPurposeDescription({
    korean,
    claimReview: preset.claimReview,
    patientFacing: preset.patientFacing,
  })

  return documentTemplateCreateSchema.parse({
    title,
    description,
    category: preset.claimReview
      ? "claims-review"
      : preset.patientFacing
        ? "patient-education"
        : "clinical-documentation",
    language,
    region,
    renderer: "GENERIC_STRUCTURED",
    schema: normalizeDocumentTemplateSchema(schema),
    generationConfig: normalizeDocumentGenerationConfig({
      contextSources: ["insights", "doctorNotes"],
      systemInstructions: korean
        ? `원본 프롬프트를 반영해 수동으로 다듬어 주세요: ${summarizePrompt(prompt, 200)}`
        : `Refine this fallback draft manually to match the original request: ${summarizePrompt(prompt, 200)}`,
      emptyValuePolicy: "BLANK",
    }),
  })
}

export function buildFallbackRevisedDocumentDraft(
  prompt: string,
  draft: DocumentBuilderDraft
): DocumentBuilderDraft {
  const korean = isKorean(prompt) || isKorean(draft.title) || isKorean(draft.description)
  const nextDraft: DocumentBuilderDraft = {
    ...draft,
    description:
      draft.description.trim() ||
      (korean
        ? "AI 수정 실패 시 사용할 수 있는 로컬 보정 초안입니다."
        : "Fallback revision draft used when AI revise is unavailable."),
    generationConfig: {
      ...draft.generationConfig,
      systemInstructions: [
        draft.generationConfig.systemInstructions?.trim() || "",
        korean
          ? `수정 요청 참고: ${summarizePrompt(prompt, 200)}`
          : `Revision request reference: ${summarizePrompt(prompt, 200)}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  }

  const lower = prompt.toLowerCase()
  if (/\b(?:english|영어)\b/i.test(prompt)) {
    nextDraft.language = "en"
  }
  if (/\b(?:korean|한국어|한글)\b/i.test(prompt)) {
    nextDraft.language = "ko"
  }

  const inferredRegion = inferDocumentRegionFromText(prompt)
  if (inferredRegion) {
    nextDraft.region = inferredRegion
  }

  if (/add field|new field|필드 추가/.test(lower + " " + prompt)) {
    const fallbackKey = slugifyKey(prompt.split(/\s+/).slice(0, 4).join("_"), "new_field")
    nextDraft.schema = normalizeDocumentTemplateSchema({
      nodes: [
        ...nextDraft.schema.nodes,
        createField(
          fallbackKey,
          korean ? "추가 필드" : "Additional field",
          "shortText"
        ),
      ],
    })
  }

  return documentTemplateCreateSchema.parse({
    ...nextDraft,
    renderer: "GENERIC_STRUCTURED",
  })
}
