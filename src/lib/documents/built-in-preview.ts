import {
  BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
  BUILT_IN_RECORD_TEMPLATE_ID,
} from "@/lib/documents/constants"

export interface BuiltInDocumentPreviewAsset {
  key: "record" | "patient-handout"
  locale: string
  summary: string
  previewContent: Record<string, unknown>
}

const BUILT_IN_PREVIEW_ASSETS: Record<
  string,
  BuiltInDocumentPreviewAsset
> = {
  [BUILT_IN_RECORD_TEMPLATE_ID]: {
    key: "record",
    locale: "ko",
    summary:
      "38세 환자가 3일간의 기침, 인후통, 미열로 내원한 뒤 생성된 외래 진료기록 예시입니다.",
    previewContent: {
      patientName: "가상 환자 A",
      chiefComplaint: "3일 전부터 지속된 기침과 인후통",
      hpi: "발열은 최고 37.8도 수준이었고 호흡곤란은 없습니다. 가족 내 유사 증상 접촉력이 있으며 수분 섭취는 유지되고 있습니다.",
      assessment:
        "바이러스성 상기도 감염 가능성이 가장 높으며 현재 중증 세균성 감염을 시사하는 소견은 없습니다.",
      plan: [
        "수분 섭취와 휴식을 유지하도록 안내",
        "아세트아미노펜 등 대증 치료 권고",
        "호흡곤란, 고열 지속, 증상 악화 시 재내원 안내",
      ],
    },
  },
  [BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID]: {
    key: "patient-handout",
    locale: "ko",
    summary:
      "바이러스성 상기도 감염 진단 후 환자에게 제공되는 쉬운 설명과 자가관리 안내문 예시입니다.",
    previewContent: {
      title: "감기(바이러스성 상기도 감염) 안내문",
      overview:
        "현재 증상은 대부분 시간이 지나면서 호전되는 감기 양상과 비슷합니다. 항생제가 꼭 필요한 상황으로 보이지는 않습니다.",
      selfCare: [
        "미지근한 물을 자주 마시기",
        "필요 시 해열진통제 복용",
        "충분한 수면과 휴식 유지",
      ],
      redFlags: [
        "숨이 차거나 가슴 통증이 생길 때",
        "39도 이상 고열이 계속될 때",
        "증상이 1주 이상 심하게 지속될 때",
      ],
      followUp: "보통 수일 내 좋아지지만 악화되면 외래에 다시 방문하세요.",
    },
  },
}

export function getBuiltInDocumentPreviewAsset(
  templateId: string
): BuiltInDocumentPreviewAsset | null {
  return BUILT_IN_PREVIEW_ASSETS[templateId] ?? null
}
