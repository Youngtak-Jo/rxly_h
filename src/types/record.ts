export interface Vitals {
  bp: string
  hr: string
  temp: string
  rr: string
  spo2: string
}

export interface ConsultationRecord {
  id: string
  sessionId: string
  date: string
  patientName: string | null
  chiefComplaint: string | null
  hpiText: string | null
  medications: string | null
  rosText: string | null
  pmh: string | null
  socialHistory: string | null
  familyHistory: string | null
  vitals: Vitals | null
  physicalExam: string | null
  labsStudies: string | null
  assessment: string | null
  plan: string | null
}

export interface ConsultationRecordUpdate {
  chiefComplaint?: string
  hpiText?: string
  medications?: string
  rosText?: string
  pmh?: string
  socialHistory?: string
  familyHistory?: string
  vitals?: Vitals
  physicalExam?: string
  labsStudies?: string
  assessment?: string
  plan?: string
}
