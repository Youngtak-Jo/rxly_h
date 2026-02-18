export type HeroDemoSpeaker = "DOCTOR" | "PATIENT"

export interface HeroDemoTranscriptEntry {
  id: string
  speaker: HeroDemoSpeaker
  text: string
}

export interface HeroDemoChecklistItem {
  id: string
  label: string
  done: boolean
}

export interface HeroDemoInsightState {
  summary: string
  keyFindings: string[]
  redFlags: string[]
  checklist: HeroDemoChecklistItem[]
}

export interface HeroDemoStep {
  id: string
  transcript: HeroDemoTranscriptEntry
  insights: HeroDemoInsightState
}

export const HERO_DEMO_STEP_INTERVAL_MS = 1900

export const HERO_DEMO_STEPS: HeroDemoStep[] = [
  {
    id: "step-1",
    transcript: {
      id: "tx-1",
      speaker: "DOCTOR",
      text: "I can see you are uncomfortable. Tell me what started the pain.",
    },
    insights: {
      summary:
        "Acute abdominal pain consultation started. Initial history is being collected.",
      keyFindings: ["Pain started overnight and worsened in the morning"],
      redFlags: [],
      checklist: [
        { id: "ck-1", label: "Clarify pain onset and migration", done: true },
        { id: "ck-2", label: "Screen for GI and urinary symptoms", done: false },
        { id: "ck-3", label: "Assess vitals and abdominal tenderness", done: false },
      ],
    },
  },
  {
    id: "step-2",
    transcript: {
      id: "tx-2",
      speaker: "PATIENT",
      text: "It began around my belly button, but now it is sharp in the right lower side.",
    },
    insights: {
      summary:
        "Pain migrated from periumbilical region to right lower quadrant, raising concern for appendicitis.",
      keyFindings: [
        "Migrating abdominal pain pattern",
        "Current maximal pain in right lower quadrant",
      ],
      redFlags: ["Classic migration pattern for acute appendicitis"],
      checklist: [
        { id: "ck-1", label: "Clarify pain onset and migration", done: true },
        { id: "ck-2", label: "Screen for GI and urinary symptoms", done: true },
        { id: "ck-3", label: "Assess vitals and abdominal tenderness", done: false },
      ],
    },
  },
  {
    id: "step-3",
    transcript: {
      id: "tx-3",
      speaker: "PATIENT",
      text: "I vomited once and I have no appetite at all.",
    },
    insights: {
      summary:
        "Progressive right lower quadrant pain with nausea and anorexia supports a surgical abdomen.",
      keyFindings: [
        "Nausea with one episode of vomiting",
        "Marked anorexia",
        "Pain worsens with movement",
      ],
      redFlags: ["Escalating abdominal pain with systemic symptoms"],
      checklist: [
        { id: "ck-1", label: "Clarify pain onset and migration", done: true },
        { id: "ck-2", label: "Screen for GI and urinary symptoms", done: true },
        { id: "ck-3", label: "Assess vitals and abdominal tenderness", done: true },
        { id: "ck-4", label: "Order CBC and urinalysis", done: false },
      ],
    },
  },
  {
    id: "step-4",
    transcript: {
      id: "tx-4",
      speaker: "DOCTOR",
      text: "Your temperature is 38.3 C with heart rate 102. You are very tender at McBurney's point.",
    },
    insights: {
      summary:
        "Fever, tachycardia, and focal right lower quadrant tenderness indicate high probability appendicitis.",
      keyFindings: [
        "Temperature 38.3 C",
        "Heart rate 102 bpm",
        "McBurney point tenderness with guarding",
      ],
      redFlags: [
        "Localized peritoneal irritation in right lower quadrant",
        "Systemic inflammatory response (fever and tachycardia)",
      ],
      checklist: [
        { id: "ck-1", label: "Clarify pain onset and migration", done: true },
        { id: "ck-2", label: "Screen for GI and urinary symptoms", done: true },
        { id: "ck-3", label: "Assess vitals and abdominal tenderness", done: true },
        { id: "ck-4", label: "Order CBC and urinalysis", done: true },
        { id: "ck-5", label: "Order CT abdomen/pelvis with contrast", done: false },
      ],
    },
  },
  {
    id: "step-5",
    transcript: {
      id: "tx-5",
      speaker: "DOCTOR",
      text: "Rebound tenderness and Rovsing sign are positive, which strongly supports appendicitis.",
    },
    insights: {
      summary:
        "Exam shows rebound tenderness and positive Rovsing sign, strengthening diagnosis of acute appendicitis.",
      keyFindings: [
        "Rebound tenderness present",
        "Positive Rovsing sign",
        "Guarding in right lower quadrant",
      ],
      redFlags: [
        "Peritoneal signs suggest active appendiceal inflammation",
      ],
      checklist: [
        { id: "ck-1", label: "Clarify pain onset and migration", done: true },
        { id: "ck-2", label: "Screen for GI and urinary symptoms", done: true },
        { id: "ck-3", label: "Assess vitals and abdominal tenderness", done: true },
        { id: "ck-4", label: "Order CBC and urinalysis", done: true },
        { id: "ck-5", label: "Order CT abdomen/pelvis with contrast", done: true },
        { id: "ck-6", label: "Notify surgery for early review", done: false },
      ],
    },
  },
  {
    id: "step-6",
    transcript: {
      id: "tx-6",
      speaker: "DOCTOR",
      text: "CT shows an inflamed 11 mm appendix with appendicolith, and WBC is 15,000 with left shift.",
    },
    insights: {
      summary:
        "Imaging and labs confirm acute appendicitis with appendicolith and leukocytosis.",
      keyFindings: [
        "CT: dilated inflamed appendix (11 mm)",
        "Appendicolith with periappendiceal inflammatory change",
        "WBC 15,000 with left shift",
      ],
      redFlags: ["Confirmed appendicitis with risk of rapid progression"],
      checklist: [
        { id: "ck-1", label: "Clarify pain onset and migration", done: true },
        { id: "ck-2", label: "Screen for GI and urinary symptoms", done: true },
        { id: "ck-3", label: "Assess vitals and abdominal tenderness", done: true },
        { id: "ck-4", label: "Order CBC and urinalysis", done: true },
        { id: "ck-5", label: "Order CT abdomen/pelvis with contrast", done: true },
        { id: "ck-6", label: "Notify surgery for early review", done: true },
      ],
    },
  },
  {
    id: "step-7",
    transcript: {
      id: "tx-7",
      speaker: "DOCTOR",
      text: "We are preparing surgery today and starting IV ceftriaxone plus metronidazole now.",
    },
    insights: {
      summary:
        "Acute appendicitis confirmed. Patient triaged for same-day appendectomy with immediate IV antibiotics and NPO orders.",
      keyFindings: [
        "Surgical referral activated for urgent appendectomy",
        "Empiric IV ceftriaxone and metronidazole initiated",
        "NPO and IV fluid protocol started",
      ],
      redFlags: ["Risk of perforation if operative care is delayed"],
      checklist: [
        { id: "ck-1", label: "Clarify pain onset and migration", done: true },
        { id: "ck-2", label: "Screen for GI and urinary symptoms", done: true },
        { id: "ck-3", label: "Assess vitals and abdominal tenderness", done: true },
        { id: "ck-4", label: "Order CBC and urinalysis", done: true },
        { id: "ck-5", label: "Order CT abdomen/pelvis with contrast", done: true },
        { id: "ck-6", label: "Notify surgery for early review", done: true },
        { id: "ck-7", label: "Start IV antibiotics, fluids, and NPO", done: true },
      ],
    },
  },
]
