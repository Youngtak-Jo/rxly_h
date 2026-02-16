export type Speaker = "DOCTOR" | "PATIENT" | "UNKNOWN"

export interface DiagnosticKeyword {
  phrase: string
  category: "symptom" | "diagnosis" | "medication" | "finding" | "vital"
}

export type SessionMode = "DOCTOR" | "AI_DOCTOR"

export interface Session {
  id: string
  title: string | null
  patientName: string | null
  mode: SessionMode
  startedAt: string
  endedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TranscriptEntry {
  id: string
  sessionId: string
  speaker: Speaker
  rawSpeakerId?: number
  text: string
  startTime: number
  endTime: number
  confidence: number
  isFinal: boolean
  createdAt: string
}
