import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useRecordStore } from "@/stores/record-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useSessionStore } from "@/stores/session-store"
import { useNoteStore } from "@/stores/note-store"
import { useResearchStore } from "@/stores/research-store"
import type { ChecklistItem, DiagnosisItem } from "@/types/insights"
import type { TranscriptEntry } from "@/types/session"
import type { ConsultationRecord } from "@/types/record"
import type { NoteEntry } from "@/stores/note-store"
import type { ResearchMessage } from "@/stores/research-store"

// ---------------------------------------------------------------------------
// Snapshot types
// ---------------------------------------------------------------------------
export interface TourSnapshot {
  activeTab: "insights" | "ddx" | "record" | "research"
  activeSession: ReturnType<typeof useSessionStore.getState>["activeSession"]
  hadSession: boolean
  insights: {
    summary: string
    keyFindings: string[]
    redFlags: string[]
    checklistItems: ChecklistItem[]
  }
  ddx: { diagnoses: DiagnosisItem[] }
  transcript: {
    entries: TranscriptEntry[]
    identificationStatus: ReturnType<typeof useTranscriptStore.getState>["identificationStatus"]
    diagnosticKeywords: ReturnType<typeof useTranscriptStore.getState>["diagnosticKeywords"]
    highlightStatus: ReturnType<typeof useTranscriptStore.getState>["highlightStatus"]
  }
  record: { record: ConsultationRecord | null }
  research: { messages: ResearchMessage[] }
  notes: NoteEntry[]
}

// ---------------------------------------------------------------------------
// Snapshot / Restore
// ---------------------------------------------------------------------------
export function captureSnapshot(): TourSnapshot {
  const ins = useInsightsStore.getState()
  const ddx = useDdxStore.getState()
  const tx = useTranscriptStore.getState()
  const rec = useRecordStore.getState()
  const res = useResearchStore.getState()
  const tab = useConsultationTabStore.getState()
  const ses = useSessionStore.getState()
  const notes = useNoteStore.getState()

  return {
    activeTab: tab.activeTab,
    activeSession: ses.activeSession,
    hadSession: !!ses.activeSession,
    insights: {
      summary: ins.summary,
      keyFindings: [...ins.keyFindings],
      redFlags: [...ins.redFlags],
      checklistItems: ins.checklistItems.map((c) => ({ ...c })),
    },
    ddx: { diagnoses: ddx.diagnoses.map((d) => ({ ...d, citations: [...d.citations] })) },
    transcript: {
      entries: tx.entries.map((e) => ({ ...e })),
      identificationStatus: tx.identificationStatus,
      diagnosticKeywords: [...tx.diagnosticKeywords],
      highlightStatus: tx.highlightStatus,
    },
    record: { record: rec.record ? { ...rec.record } : null },
    research: { messages: res.messages.map((m) => ({ ...m, citations: [...m.citations] })) },
    notes: notes.notes.map((n) => ({ ...n, imageUrls: [...n.imageUrls], storagePaths: [...n.storagePaths] })),
  }
}

export function restoreSnapshot(snap: TourSnapshot) {
  // Restore insights
  useInsightsStore.getState().reset()
  if (snap.insights.summary || snap.insights.keyFindings.length > 0) {
    useInsightsStore.getState().loadFromDB(snap.insights)
  }

  // Restore DDx
  useDdxStore.getState().reset()
  if (snap.ddx.diagnoses.length > 0) {
    useDdxStore.getState().loadFromDB(snap.ddx.diagnoses)
  }

  // Restore transcript
  useTranscriptStore.getState().reset()
  if (snap.transcript.entries.length > 0) {
    useTranscriptStore.getState().loadEntries(snap.transcript.entries)
    if (snap.transcript.diagnosticKeywords.length > 0) {
      useTranscriptStore.getState().setDiagnosticKeywords(snap.transcript.diagnosticKeywords)
    }
    useTranscriptStore.getState().setHighlightStatus(snap.transcript.highlightStatus)
    useTranscriptStore.getState().setIdentificationStatus(snap.transcript.identificationStatus)
  }

  // Restore record
  useRecordStore.getState().reset()
  if (snap.record.record) {
    useRecordStore.getState().loadFromDB(snap.record.record)
  }

  // Restore research
  useResearchStore.getState().reset()
  if (snap.research.messages.length > 0) {
    useResearchStore.getState().loadFromDB(snap.research.messages)
  }

  // Restore notes
  useNoteStore.getState().reset()
  if (snap.notes.length > 0) {
    useNoteStore.getState().loadNotes(snap.notes)
  }

  // Restore tab
  useConsultationTabStore.getState().setActiveTab(snap.activeTab)

  // Restore session
  if (!snap.hadSession) {
    useSessionStore.getState().setActiveSession(null)
  } else {
    useSessionStore.getState().setActiveSession(snap.activeSession)
  }
}

// ---------------------------------------------------------------------------
// Ensure a session exists for the tour
// ---------------------------------------------------------------------------
const TOUR_SESSION_ID = "__tour_demo__"

export function ensureTourSession() {
  const ses = useSessionStore.getState()
  if (ses.activeSession) return // session already exists

  const now = new Date().toISOString()
  ses.setActiveSession({
    id: TOUR_SESSION_ID,
    title: "Guided Tour",
    patientName: null,
    startedAt: now,
    endedAt: null,
    createdAt: now,
    updatedAt: now,
  })
}

// ---------------------------------------------------------------------------
// Data injection helpers
// ---------------------------------------------------------------------------

export function injectInsightsData() {
  useInsightsStore.getState().loadFromDB({
    summary:
      "55-year-old female presenting with a 2-week history of right-sided headache. History of hypertension. Reports pulsating pain (7/10) with associated nausea and photophobia.",
    keyFindings: [
      "Unilateral pulsating headache (right side) — persisting for 2 weeks",
      "Associated nausea and photophobia",
      "Pain intensity 7/10, worsened by physical activity",
      "Family history: mother with migraine",
    ],
    redFlags: [
      "New-onset headache in a hypertensive patient over age 50 — secondary causes must be ruled out",
    ],
    checklistItems: [
      {
        id: "tour-ck-1",
        sessionId: TOUR_SESSION_ID,
        label: "Assess for neurological deficits",
        isChecked: true,
        isAutoChecked: true,
        doctorNote: null,
        sortOrder: 0,
        source: "AI",
      },
      {
        id: "tour-ck-2",
        sessionId: TOUR_SESSION_ID,
        label: "Order brain MRI with contrast",
        isChecked: false,
        isAutoChecked: false,
        doctorNote: null,
        sortOrder: 1,
        source: "AI",
      },
      {
        id: "tour-ck-3",
        sessionId: TOUR_SESSION_ID,
        label: "Verify blood pressure readings",
        isChecked: false,
        isAutoChecked: false,
        doctorNote: null,
        sortOrder: 2,
        source: "AI",
      },
    ],
  })
}

export function injectDdxData() {
  useDdxStore.getState().loadFromDB([
    {
      id: "tour-dx-1",
      sessionId: TOUR_SESSION_ID,
      icdCode: "8A80.1",
      diseaseName: "Migraine without aura",
      confidence: "high",
      evidence:
        "Unilateral pulsating headache, nausea, photophobia, family history — classic migraine presentation",
      citations: [
        {
          source: "icd11",
          title: "8A80.1 Migraine without aura",
          url: "https://icd.who.int/browse/2024-01/mms/en#1415573001",
          snippet: "Recurrent headache disorder manifesting in attacks lasting 4-72 hours.",
        },
        {
          source: "pubmed",
          title: "Diagnosis and management of migraine in primary care",
          url: "https://pubmed.ncbi.nlm.nih.gov/35172856",
          snippet: "Migraine is a common neurological disorder affecting approximately 12% of the population.",
        },
      ],
      sortOrder: 0,
    },
    {
      id: "tour-dx-2",
      sessionId: TOUR_SESSION_ID,
      icdCode: "8A84",
      diseaseName: "Tension-type headache",
      confidence: "moderate",
      evidence:
        "Bilateral pressing headache possible, but pulsating quality and associated nausea are more consistent with migraine",
      citations: [
        {
          source: "icd11",
          title: "8A84 Tension-type headache",
          url: "https://icd.who.int/browse/2024-01/mms/en#1710834068",
          snippet: "Recurrent episodes of headache lasting minutes to days.",
        },
      ],
      sortOrder: 1,
    },
    {
      id: "tour-dx-3",
      sessionId: TOUR_SESSION_ID,
      icdCode: "8B22",
      diseaseName: "Hypertensive headache",
      confidence: "low",
      evidence:
        "History of hypertension present. Secondary headache due to hypertensive crisis must be ruled out.",
      citations: [],
      sortOrder: 2,
    },
  ])
}

export function injectRecordData() {
  useRecordStore.getState().setRecord({
    id: "tour-record",
    sessionId: TOUR_SESSION_ID,
    date: new Date().toISOString(),
    patientName: "Demo Patient",
    chiefComplaint: "Right-sided headache persisting for 2 weeks",
    hpiText:
      "55-year-old female presenting with a right-sided pulsating headache that began 2 weeks ago. Pain intensity is 7/10, with associated nausea and photophobia. Worsened by physical activity. Reports exacerbation with stress and bright lights.",
    medications: "Amlodipine 5mg QD (hypertension)",
    rosText:
      "Positive: headache, nausea, photophobia\nNegative: fever, vision changes, neck stiffness, altered consciousness",
    pmh: "Hypertension (diagnosed 2018)",
    socialHistory: "Non-smoker, occasional alcohol use",
    familyHistory: "Mother: migraine / Father: hypertension, type 2 diabetes",
    vitals: { bp: "142/88", hr: "76", temp: "36.8", rr: "16", spo2: "98" },
    physicalExam: "BP 142/88, neurological exam normal, no papilledema",
    labsStudies: "Brain MRI with contrast ordered",
    assessment:
      "Migraine without aura is the most likely diagnosis. Low suspicion for secondary headache, but imaging warranted given hypertension history.",
    plan: "1. Prescribe Sumatriptan 50mg PRN\n2. Brain MRI with contrast\n3. Recommend headache diary\n4. Follow-up in 2 weeks",
  })
}

export function injectTranscriptData() {
  const now = Date.now()
  const entries: TranscriptEntry[] = [
    {
      id: "tour-t1",
      sessionId: TOUR_SESSION_ID,
      speaker: "DOCTOR",
      rawSpeakerId: 0,
      text: "Hello. What brings you in today?",
      startTime: 0,
      endTime: 3,
      confidence: 0.98,
      isFinal: true,
      createdAt: new Date(now).toISOString(),
    },
    {
      id: "tour-t2",
      sessionId: TOUR_SESSION_ID,
      speaker: "PATIENT",
      rawSpeakerId: 1,
      text: "I've had this headache on the right side of my head for about two weeks now. It's a throbbing kind of pain.",
      startTime: 4,
      endTime: 9,
      confidence: 0.97,
      isFinal: true,
      createdAt: new Date(now + 4000).toISOString(),
    },
    {
      id: "tour-t3",
      sessionId: TOUR_SESSION_ID,
      speaker: "DOCTOR",
      rawSpeakerId: 0,
      text: "On a scale of 1 to 10, how would you rate the pain? Do you experience any nausea or sensitivity to light?",
      startTime: 10,
      endTime: 15,
      confidence: 0.96,
      isFinal: true,
      createdAt: new Date(now + 10000).toISOString(),
    },
    {
      id: "tour-t4",
      sessionId: TOUR_SESSION_ID,
      speaker: "PATIENT",
      rawSpeakerId: 1,
      text: "About a 7. I feel nauseous and bright lights really bother me.",
      startTime: 16,
      endTime: 21,
      confidence: 0.95,
      isFinal: true,
      createdAt: new Date(now + 16000).toISOString(),
    },
    {
      id: "tour-t5",
      sessionId: TOUR_SESSION_ID,
      speaker: "DOCTOR",
      rawSpeakerId: 0,
      text: "You mentioned you're on blood pressure medication — Amlodipine 5mg, correct?",
      startTime: 22,
      endTime: 27,
      confidence: 0.97,
      isFinal: true,
      createdAt: new Date(now + 22000).toISOString(),
    },
    {
      id: "tour-t6",
      sessionId: TOUR_SESSION_ID,
      speaker: "PATIENT",
      rawSpeakerId: 1,
      text: "Yes, that's right. My mother also had severe migraines.",
      startTime: 28,
      endTime: 32,
      confidence: 0.94,
      isFinal: true,
      createdAt: new Date(now + 28000).toISOString(),
    },
  ]

  useTranscriptStore.getState().loadEntries(entries)
  useTranscriptStore.getState().setIdentificationStatus("identified")
}

export function injectKeywords() {
  useTranscriptStore.getState().setDiagnosticKeywords([
    { phrase: "headache on the right side", category: "symptom" },
    { phrase: "throbbing kind of pain", category: "symptom" },
    { phrase: "nauseous", category: "symptom" },
    { phrase: "bright lights really bother me", category: "symptom" },
    { phrase: "Amlodipine 5mg", category: "medication" },
    { phrase: "migraines", category: "diagnosis" },
    { phrase: "blood pressure medication", category: "medication" },
  ])
}

export function injectResearchData() {
  const now = new Date().toISOString()
  useResearchStore.getState().loadFromDB([
    {
      id: "tour-res-1",
      role: "user",
      content: "What are the recommended first-line treatments for migraine without aura?",
      citations: [],
      createdAt: now,
    },
    {
      id: "tour-res-2",
      role: "assistant",
      content:
        "## First-Line Acute Treatment\n\n" +
        "For mild-to-moderate migraine attacks:\n" +
        "- **NSAIDs**: Ibuprofen 400–600mg or Naproxen 500mg\n" +
        "- **Acetaminophen**: 1000mg (less effective than NSAIDs)\n\n" +
        "For moderate-to-severe attacks:\n" +
        "- **Triptans**: Sumatriptan 50–100mg PO or 6mg SC, Rizatriptan 10mg, Eletriptan 40mg\n" +
        "- Triptans are most effective when taken early in the attack\n\n" +
        "## Preventive Therapy\n\n" +
        "Consider if ≥4 migraine days/month or significant disability:\n" +
        "- **Beta-blockers**: Propranolol 80–240mg/day\n" +
        "- **Antidepressants**: Amitriptyline 10–50mg/day\n" +
        "- **Anticonvulsants**: Topiramate 50–100mg/day\n" +
        "- **CGRP monoclonal antibodies**: Erenumab, Fremanezumab (for refractory cases)\n\n" +
        "Given the patient's hypertension, a beta-blocker (e.g., Propranolol) may serve dual purpose for both migraine prevention and blood pressure control.\n\n" +
        "[[PUBMED]](https://pubmed.ncbi.nlm.nih.gov/35172856) [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1415573001)",
      citations: [
        {
          source: "pubmed",
          title: "AHS Consensus Statement: Acute Treatment of Migraine",
          url: "https://pubmed.ncbi.nlm.nih.gov/35172856",
          snippet: "Evidence-based guideline for acute migraine pharmacotherapy in adults.",
        },
        {
          source: "icd11",
          title: "8A80.1 Migraine without aura",
          url: "https://icd.who.int/browse/2024-01/mms/en#1415573001",
          snippet: "Recurrent headache disorder manifesting in attacks lasting 4-72 hours.",
        },
      ],
      createdAt: now,
    },
  ])
}
