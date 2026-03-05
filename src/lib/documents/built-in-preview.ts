import {
  BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
  BUILT_IN_RECORD_TEMPLATE_ID,
} from "@/lib/documents/constants"
import { normalizeUiLocale, type UiLocale } from "@/i18n/config"

export interface BuiltInRecordPreviewContent {
  [key: string]: unknown
  patientName: string
  chiefComplaint: string
  hpiText: string
  medications: string
  rosText: string
  physicalExam: string
  labsStudies: string
  assessment: string
  plan: string
}

export interface BuiltInPatientHandoutPreviewContent {
  [key: string]: unknown
  language: "ko" | "en"
  conditions: Array<{
    id: string
    icdCode: string
    diseaseName: string
    source: "ddx" | "icd11"
  }>
  entries: Array<{
    conditionId: string
    sections: {
      conditionOverview: string
      signsSymptoms: string
      causesRiskFactors: string
      complications: string
      treatmentOptions: string
      whenToSeekHelp: string
      additionalAdviceFollowUp: string
      disclaimer: string
    }
  }>
}

export interface BuiltInDocumentPreviewAsset {
  key: "record" | "patient-handout"
  locale: UiLocale
  summary: string
  previewContent:
    | BuiltInRecordPreviewContent
    | BuiltInPatientHandoutPreviewContent
}

const BUILT_IN_PREVIEW_ASSETS: Record<
  string,
  Record<UiLocale, BuiltInDocumentPreviewAsset>
> = {
  [BUILT_IN_RECORD_TEMPLATE_ID]: {
    en: {
      key: "record",
      locale: "en",
      summary:
        "Consultation Record sample reflecting the actual generated schema for acute right-lower-quadrant abdominal pain.",
      previewContent: {
        patientName: "Demo Patient A",
        chiefComplaint:
          "Worsening right lower quadrant abdominal pain with fever for 12 hours",
        hpiText:
          "Pain started near the umbilicus and migrated to the right lower quadrant. It worsens with coughing and walking, with associated nausea and reduced appetite. The patient denies gross hematuria and diarrhea.",
        medications:
          "Acetaminophen 500 mg PO as needed\nAmlodipine 5 mg PO once daily",
        rosText:
          "Positive: fever, nausea, focal RLQ abdominal pain\nNegative: chest pain, dyspnea, gross hematuria, diarrhea",
        physicalExam:
          "Focal RLQ tenderness with rebound and mild guarding. No right CVA tenderness.",
        labsStudies:
          "CBC shows leukocytosis with elevated CRP. CT abdomen/pelvis demonstrates an inflamed appendix with periappendiceal fat stranding.",
        assessment:
          "Acute appendicitis is most likely; progressive intra-abdominal inflammation cannot be excluded.",
        plan:
          "1. Maintain NPO and start IV fluids\n2. Start empiric ceftriaxone plus metronidazole\n3. Request urgent general surgery consult and operative readiness\n4. Reassess pain and vital signs every 30-60 minutes",
      },
    },
    ko: {
      key: "record",
      locale: "ko",
      summary:
        "우하복부 통증과 발열로 내원한 환자의 실제 진료기록 구조를 반영한 Consultation Record 예시입니다.",
      previewContent: {
        patientName: "가상 환자 A",
        chiefComplaint: "12시간 전부터 악화되는 우하복부 통증과 발열",
        hpiText:
          "통증은 배꼽 주변에서 시작해 우하복부로 이동했고, 기침과 보행 시 악화됩니다. 오심과 식욕저하가 동반되며 혈뇨·설사는 부인합니다.",
        medications:
          "아세트아미노펜 500mg PO 필요 시 복용\n암로디핀 5mg PO 하루 1회",
        rosText:
          "양성: 발열, 오심, 우하복부 통증\n음성: 흉통, 호흡곤란, 혈뇨, 설사",
        physicalExam:
          "우하복부 압통과 반발통, 경미한 복부 경직이 관찰됩니다. 우측 CVA 압통은 없습니다.",
        labsStudies:
          "CBC에서 백혈구 상승, CRP 상승. 복부 CT에서 염증성 충수와 주변 지방 침윤 소견이 확인되었습니다.",
        assessment:
          "급성 충수염 가능성이 높으며 임상 경과상 진행성 복강 내 염증을 배제할 수 없습니다.",
        plan:
          "1. 금식 유지 및 정주 수액 시작\n2. 세프트리악손+메트로니다졸 경험적 투여\n3. 외과 긴급 협진 및 수술 준비\n4. 통증·활력징후 30-60분 간격 재평가",
      },
    },
  },
  [BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID]: {
    en: {
      key: "patient-handout",
      locale: "en",
      summary:
        "Patient Handout sample reflecting the actual generated output structure (conditions plus 8 required sections).",
      previewContent: {
        language: "en",
        conditions: [
          {
            id: "builtin-condition-appendicitis",
            icdCode: "DB30.4",
            diseaseName: "Acute appendicitis",
            source: "ddx",
          },
        ],
        entries: [
          {
            conditionId: "builtin-condition-appendicitis",
            sections: {
              conditionOverview:
                "Acute appendicitis is inflammation of the appendix and can worsen quickly, so timely evaluation and treatment are important.",
              signsSymptoms:
                "Common symptoms include pain moving from around the belly button to the right lower abdomen, fever, nausea/vomiting, and reduced appetite.",
              causesRiskFactors:
                "The appendix can become blocked (for example by hardened stool), leading to inflammation and progressive symptoms.",
              complications:
                "Delayed treatment can increase the risk of perforation, peritonitis, abscess, and sepsis.",
              treatmentOptions:
                "Treatment may include IV fluids, pain control, antibiotics, and surgical evaluation for appendectomy.",
              whenToSeekHelp:
                "Seek urgent care right away if pain rapidly worsens or if high fever, persistent vomiting, fainting, or breathing difficulty develops.",
              additionalAdviceFollowUp:
                "Remain NPO as instructed, follow imaging/surgery scheduling guidance, and follow discharge instructions for wound care and warning signs.",
              disclaimer:
                "This handout is for education only and does not replace personalized diagnosis or emergency judgment. Contact a medical professional immediately if symptoms worsen.",
            },
          },
        ],
      },
    },
    ko: {
      key: "patient-handout",
      locale: "ko",
      summary:
        "동일 케이스에서 생성되는 Patient Handout의 실제 출력 구조(질환/섹션 8개)를 반영한 예시입니다.",
      previewContent: {
        language: "ko",
        conditions: [
          {
            id: "builtin-condition-appendicitis",
            icdCode: "DB30.4",
            diseaseName: "급성 충수염",
            source: "ddx",
          },
        ],
        entries: [
          {
            conditionId: "builtin-condition-appendicitis",
            sections: {
              conditionOverview:
                "급성 충수염은 충수에 염증이 생기는 질환으로, 빠르게 악화할 수 있어 조기 평가와 치료가 중요합니다.",
              signsSymptoms:
                "배꼽 주변에서 시작해 우하복부로 이동하는 통증, 발열, 오심/구토, 식욕저하가 흔합니다.",
              causesRiskFactors:
                "충수 내 막힘(대변돌 등)으로 염증이 발생할 수 있으며, 증상 경과가 빠르게 진행될 수 있습니다.",
              complications:
                "치료가 지연되면 천공, 복막염, 농양, 패혈증 같은 합병증 위험이 증가합니다.",
              treatmentOptions:
                "수액·진통·항생제 치료와 함께 외과적 평가 후 충수절제술이 필요할 수 있습니다.",
              whenToSeekHelp:
                "복통이 급격히 심해지거나 고열, 지속 구토, 어지럼/실신, 호흡곤란이 있으면 즉시 응급실로 가세요.",
              additionalAdviceFollowUp:
                "금식을 유지하고 의료진 안내에 따라 검사/수술 일정을 진행하세요. 퇴원 후에는 상처 관리와 경고 증상 교육을 따르세요.",
              disclaimer:
                "이 안내문은 교육 목적이며 개인별 확정 진단이나 응급상황 판단을 대체하지 않습니다. 증상이 악화되면 즉시 의료기관에 연락하세요.",
            },
          },
        ],
      },
    },
  },
}

function resolveBuiltInLocale(locale: string | null | undefined): UiLocale {
  return normalizeUiLocale(locale) ?? "en"
}

function getBuiltInAssetByLocale(
  templateId: string,
  locale: string | null | undefined
): BuiltInDocumentPreviewAsset | null {
  const byLocale = BUILT_IN_PREVIEW_ASSETS[templateId]
  if (!byLocale) return null

  const preferred = byLocale[resolveBuiltInLocale(locale)]
  return preferred ?? byLocale.en ?? byLocale.ko ?? null
}

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, " ").trim()
}

function truncateSingleLine(value: string, maxLength = 110): string {
  const normalized = normalizeLine(value)
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1)}…`
}

function buildRecordCardPreviewLines(
  content: BuiltInRecordPreviewContent,
  locale: UiLocale
): string[] {
  const labels =
    locale === "ko"
      ? {
          chiefComplaint: "주호소",
          hpi: "현병력",
          assessment: "평가",
          plan: "계획",
        }
      : {
          chiefComplaint: "Chief Complaint",
          hpi: "HPI",
          assessment: "Assessment",
          plan: "Plan",
        }

  const rows: Array<[string, string]> = [
    [labels.chiefComplaint, content.chiefComplaint],
    [labels.hpi, content.hpiText],
    [labels.assessment, content.assessment],
    [labels.plan, content.plan.split("\n")[0] ?? content.plan],
  ]

  return rows
    .map(([label, value]) => [label, truncateSingleLine(value)] as const)
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `${label}: ${value}`)
}

function buildPatientHandoutCardPreviewLines(
  content: BuiltInPatientHandoutPreviewContent,
  locale: UiLocale
): string[] {
  const labels =
    locale === "ko"
      ? {
          condition: "질환",
          conditionOverview: "질환 개요",
          signsSymptoms: "징후 / 증상",
          treatmentOptions: "치료 옵션",
          whenToSeekHelp: "진료가 필요한 시점",
        }
      : {
          condition: "Condition",
          conditionOverview: "Condition Overview",
          signsSymptoms: "Signs / Symptoms",
          treatmentOptions: "Treatment Options",
          whenToSeekHelp: "When to Seek Help",
        }

  const condition = content.conditions[0]
  if (!condition) return []

  const matchingEntry =
    content.entries.find((entry) => entry.conditionId === condition.id) ??
    content.entries[0]

  const sections = matchingEntry?.sections
  if (!sections) {
    return [`${labels.condition}: ${condition.diseaseName} (${condition.icdCode})`]
  }

  const rows: Array<[string, string]> = [
    [labels.condition, `${condition.diseaseName} (${condition.icdCode})`],
    [labels.conditionOverview, sections.conditionOverview],
    [labels.signsSymptoms, sections.signsSymptoms],
    [labels.treatmentOptions, sections.treatmentOptions],
    [labels.whenToSeekHelp, sections.whenToSeekHelp],
  ]

  return rows
    .map(([label, value]) => [label, truncateSingleLine(value)] as const)
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `${label}: ${value}`)
}

function isRecordPreviewContent(
  content:
    | BuiltInRecordPreviewContent
    | BuiltInPatientHandoutPreviewContent
): content is BuiltInRecordPreviewContent {
  return "hpiText" in content && typeof content.hpiText === "string"
}

function isPatientHandoutPreviewContent(
  content:
    | BuiltInRecordPreviewContent
    | BuiltInPatientHandoutPreviewContent
): content is BuiltInPatientHandoutPreviewContent {
  return "conditions" in content && Array.isArray(content.conditions)
}

export function getBuiltInDocumentPreviewAsset(
  templateId: string,
  locale: string | null | undefined
): BuiltInDocumentPreviewAsset | null {
  return getBuiltInAssetByLocale(templateId, locale)
}

export function getBuiltInDocumentCardPreviewLines(
  templateId: string,
  locale: string | null | undefined
): string[] {
  const asset = getBuiltInDocumentPreviewAsset(templateId, locale)
  if (!asset) return []

  if (isRecordPreviewContent(asset.previewContent)) {
    return buildRecordCardPreviewLines(asset.previewContent, asset.locale)
  }

  if (isPatientHandoutPreviewContent(asset.previewContent)) {
    return buildPatientHandoutCardPreviewLines(asset.previewContent, asset.locale)
  }

  return []
}

export function asBuiltInRecordPreviewContent(
  content: Record<string, unknown> | null | undefined
): BuiltInRecordPreviewContent | null {
  if (!content) return null
  if (typeof content.hpiText !== "string") return null
  if (typeof content.chiefComplaint !== "string") return null
  if (typeof content.assessment !== "string") return null
  if (typeof content.plan !== "string") return null

  return content as unknown as BuiltInRecordPreviewContent
}

export function asBuiltInPatientHandoutPreviewContent(
  content: Record<string, unknown> | null | undefined
): BuiltInPatientHandoutPreviewContent | null {
  if (!content) return null
  if (!Array.isArray(content.conditions)) return null
  if (!Array.isArray(content.entries)) return null
  if (content.language !== "ko" && content.language !== "en") return null

  return content as unknown as BuiltInPatientHandoutPreviewContent
}
