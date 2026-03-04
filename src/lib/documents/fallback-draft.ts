import {
  documentTemplateCreateSchema,
  normalizeDocumentGenerationConfig,
  normalizeDocumentTemplateSchema,
} from "@/lib/documents/schema"
import type {
  DocumentBuilderDraft,
  DocumentFieldNode,
  DocumentSchemaNode,
  DocumentTemplateSchema,
} from "@/types/document"

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

export function buildFallbackDocumentDraft(prompt: string): DocumentBuilderDraft {
  const preset = detectDraftPreset(prompt)
  const korean = preset.korean
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

  const description = preset.claimReview
    ? korean
      ? `프롬프트를 바탕으로 생성한 건강보험 청구 및 심사 검토용 문서 초안입니다. ${summarizePrompt(prompt)}`
      : `Fallback draft for insurance claim and review workflows based on the prompt. ${summarizePrompt(prompt)}`
    : korean
      ? `프롬프트를 바탕으로 생성한 문서 초안입니다. ${summarizePrompt(prompt)}`
      : `Fallback draft generated from the prompt. ${summarizePrompt(prompt)}`

  return documentTemplateCreateSchema.parse({
    title,
    description,
    iconKey: preset.claimReview ? "receipt" : "file-text",
    category: preset.claimReview
      ? korean
        ? "청구"
        : "claims"
      : preset.patientFacing
        ? korean
          ? "환자 안내"
          : "patient"
        : korean
          ? "문서"
          : "documentation",
    visibility: "PRIVATE",
    renderer: "GENERIC_STRUCTURED",
    schema: normalizeDocumentTemplateSchema(schema),
    generationConfig: normalizeDocumentGenerationConfig({
      audience: korean ? "의료진" : "clinician",
      outputTone: korean ? "임상적" : "clinical",
      contextSources: ["transcript", "doctorNotes", "insights"],
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
  if (/public|publish|share/.test(lower) || /공개|공유/.test(prompt)) {
    nextDraft.visibility = "PUBLIC"
  }
  if (/private|draft only/.test(lower) || /비공개|초안/.test(prompt)) {
    nextDraft.visibility = "PRIVATE"
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
