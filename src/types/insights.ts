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

export interface ChecklistOutputItem {
  label: string
  checked: boolean
}

export interface InsightsResponse {
  title?: string
  summary: string
  keyFindings: string[]
  redFlags: string[]
  checklist: ChecklistOutputItem[]
}
