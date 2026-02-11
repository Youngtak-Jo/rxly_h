export type Speaker = "DOCTOR" | "PATIENT" | "UNKNOWN"

export interface Session {
  id: string
  title: string | null
  patientName: string | null
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
