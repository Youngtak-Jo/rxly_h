import type { Scenario } from "@/data/scenarios"

export const SAMPLE_PUBLIC_TEMPLATE_IDS = [
  "after-visit-summary",
  "referral-request-letter",
  "longitudinal-care-plan",
] as const

export type SamplePublicTemplateId = (typeof SAMPLE_PUBLIC_TEMPLATE_IDS)[number]

export interface SampleConsultationSourceConfig {
  key: string
  scenarioId: Scenario["id"]
  sessionTitle: string
  patientName: string
  startedAt: string
  researchQuestions: [string, string, string]
}

export const SAMPLE_CONSULTATION_SOURCE_CONFIG: SampleConsultationSourceConfig[] =
  [
    {
      key: "chest-pain",
      scenarioId: "chest-pain",
      sessionTitle: "Example · Chest Pain Evaluation",
      patientName: "Michael Turner",
      startedAt: "2026-03-05T09:00:00.000Z",
      researchQuestions: [
        "What are the outpatient best practices for risk stratifying stable exertional chest pain that is concerning for angina?",
        "What safety-net instructions and nitroglycerin counseling should be emphasized while waiting for stress testing in suspected stable angina?",
        "When should exertional chest pain patients be escalated urgently instead of managed as expedited outpatient follow-up?",
      ],
    },
    {
      key: "diabetes",
      scenarioId: "diabetes",
      sessionTitle: "Example · Type 2 Diabetes Management",
      patientName: "Angela Brooks",
      startedAt: "2026-03-04T13:30:00.000Z",
      researchQuestions: [
        "What are current best practices for intensifying therapy in poorly controlled type 2 diabetes in primary care?",
        "What evaluation is recommended for diabetic peripheral neuropathy symptoms in an outpatient visit?",
        "What screenings and follow-up priorities should be documented when type 2 diabetes control is worsening?",
      ],
    },
    {
      key: "low-back-pain",
      scenarioId: "low-back-pain",
      sessionTitle: "Example · Acute Low Back Pain",
      patientName: "Jason Miller",
      startedAt: "2026-03-03T08:15:00.000Z",
      researchQuestions: [
        "What red flags require urgent escalation when evaluating acute low back pain in clinic?",
        "What conservative treatment and activity guidance are best practice for uncomplicated acute mechanical low back pain?",
        "What should be included in return-to-work or modified-duty planning for acute low back pain?",
      ],
    },
  ]

