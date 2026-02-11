import { migraineScenario } from "./migraine"
import { diabetesScenario } from "./diabetes"
import { chestPainScenario } from "./chest-pain"
import { pediatricFeverScenario } from "./pediatric-fever"
import { anxietyScenario } from "./anxiety"

export interface MockEntry {
  rawSpeakerId: number
  text: string
  delayMs: number
}

export interface Scenario {
  id: string
  name: string
  nameKo: string
  description: string
  tags: string[]
  entries: MockEntry[]
}

export const SCENARIOS: Scenario[] = [
  migraineScenario,
  diabetesScenario,
  chestPainScenario,
  pediatricFeverScenario,
  anxietyScenario,
]
