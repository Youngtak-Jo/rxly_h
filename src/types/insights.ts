export interface ChecklistItem {
  id: string
  sessionId: string
  label: string
  isChecked: boolean
  isAutoChecked: boolean
  doctorNote: string | null
  sortOrder: number
  source: "AI" | "MANUAL"
}

export interface Insights {
  id: string
  sessionId: string
  summary: string
  keyFindings: string[]
  redFlags: string[]
  lastProcessedAt: string | null
}

export interface ChecklistUpdate {
  add: { label: string; autoChecked: boolean }[]
  autoCheck: string[]
  remove: string[]
}

export interface InsightsResponse {
  summary: string
  keyFindings: string[]
  redFlags: string[]
  checklistUpdates: ChecklistUpdate
}
