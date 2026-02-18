export type HeroDemoMode = "insights" | "ddx" | "record" | "research"

export interface HeroDemoModeOption {
  id: HeroDemoMode
  label: string
}

export const HERO_DEMO_MODE_OPTIONS: HeroDemoModeOption[] = [
  { id: "insights", label: "Live Insights" },
  { id: "ddx", label: "Differential Dx" },
  { id: "record", label: "Consultation Record" },
  { id: "research", label: "Research" },
]

export interface HeroDemoDdxCandidate {
  id: string
  diagnosis: string
  likelihood: "High" | "Moderate" | "Lower"
  rationale: string
  nextStep: string
}

export interface HeroDemoDdxState {
  chiefConcern: string
  triageSignal: string
  candidates: HeroDemoDdxCandidate[]
  immediateActions: string[]
}

export const HERO_DEMO_DDX_STATE: HeroDemoDdxState = {
  chiefConcern:
    "Acute right lower quadrant pain with fever, nausea, and worsening pain on movement.",
  triageSignal:
    "Escalating peritoneal irritation with inflammatory markers and imaging concern.",
  candidates: [
    {
      id: "ddx-1",
      diagnosis: "Acute appendicitis",
      likelihood: "High",
      rationale:
        "Migratory pain pattern, fever 38.3 C, focal McBurney tenderness, rebound, and positive Rovsing sign.",
      nextStep: "Proceed to surgical pathway once imaging confirms uncomplicated vs complicated status.",
    },
    {
      id: "ddx-2",
      diagnosis: "Complicated appendicitis (microperforation risk)",
      likelihood: "Moderate",
      rationale:
        "Guarding with persistent fever and rising inflammatory burden can signal progression before frank perforation.",
      nextStep: "Prioritize urgent CT interpretation and surgery handoff with sepsis watch.",
    },
    {
      id: "ddx-3",
      diagnosis: "Cecal diverticulitis",
      likelihood: "Moderate",
      rationale:
        "Right-sided diverticulitis can mimic appendicitis with localized RLQ tenderness and elevated CRP.",
      nextStep: "Differentiate on CT for diverticular inflammation pattern and bowel wall findings.",
    },
    {
      id: "ddx-4",
      diagnosis: "Terminal ileitis (infectious vs inflammatory)",
      likelihood: "Lower",
      rationale:
        "Ileal inflammation can produce RLQ pain, but current peritoneal exam is more surgical than inflammatory bowel flare.",
      nextStep: "Review bowel thickening, stool history, and prior inflammatory disease context.",
    },
    {
      id: "ddx-5",
      diagnosis: "Mesenteric adenitis",
      likelihood: "Lower",
      rationale:
        "Can present with RLQ pain and fever, especially after viral prodrome, but exam usually less peritoneal.",
      nextStep: "Evaluate nodal pattern on imaging and correlate with upper respiratory history.",
    },
    {
      id: "ddx-6",
      diagnosis: "Right ureterolithiasis",
      likelihood: "Lower",
      rationale:
        "Colicky lower quadrant pain may overlap, but exam and migratory history currently favor appendiceal source.",
      nextStep: "Use urinalysis and CT findings to exclude stone-related obstruction.",
    },
    {
      id: "ddx-7",
      diagnosis: "Epiploic appendagitis",
      likelihood: "Lower",
      rationale:
        "Localized RLQ pain is possible, though fever and systemic symptoms are usually less prominent.",
      nextStep: "Confirm with focal fat-density lesion and absence of surgical abdomen progression.",
    },
  ],
  immediateActions: [
    "NPO, isotonic IV fluids, and pain control with serial abdominal exams.",
    "CBC, CRP, CMP, urinalysis, serum lactate, and pregnancy test when indicated.",
    "Start empiric ceftriaxone plus metronidazole after blood cultures if sepsis concern.",
    "Escalate to urgent general surgery consultation with imaging readiness.",
  ],
}

export interface HeroDemoDdxSupportReference {
  id: string
  title: string
  source: string
  note: string
}

export interface HeroDemoDdxSupportState {
  diagnosisId: string
  confidence: "High" | "Moderate" | "Lower"
  summary: string
  priorityTests: string[]
  immediateManagement: string[]
  medicationAndMonitoring: string[]
  redFlags: string[]
  disposition: string
  references: HeroDemoDdxSupportReference[]
}

export const HERO_DEMO_DDX_SUPPORT_BY_ID: Record<string, HeroDemoDdxSupportState> = {
  "ddx-1": {
    diagnosisId: "ddx-1",
    confidence: "High",
    summary:
      "Clinical pattern is highly consistent with acute appendicitis. Time-to-source-control should be minimized while maintaining fluid and antibiotic support.",
    priorityTests: [
      "CT abdomen/pelvis with IV contrast to define uncomplicated vs complicated disease.",
      "CBC with differential, CRP, CMP, and urinalysis to support severity and rule alternatives.",
      "Focused bedside reassessment every 30-60 minutes for worsening peritoneal signs.",
    ],
    immediateManagement: [
      "Keep NPO and continue balanced crystalloids while preparing operative consult.",
      "Document serial abdominal exam findings and trend pain trajectory.",
      "Activate surgical review now rather than waiting for prolonged observation.",
    ],
    medicationAndMonitoring: [
      "Empiric ceftriaxone plus metronidazole per local pathway before OR transfer.",
      "Use multimodal analgesia and antiemetic support without delaying diagnosis.",
      "Monitor temperature, heart rate, and hemodynamics for early deterioration.",
    ],
    redFlags: [
      "New diffuse peritonitis, hypotension, or persistent tachycardia despite fluids.",
      "Rising lactate or sudden pain relief followed by instability suggesting perforation.",
    ],
    disposition:
      "Urgent operative pathway with same-day appendectomy if no contraindication is identified.",
    references: [
      {
        id: "ref-1-1",
        title: "WSES Guidelines for Acute Appendicitis",
        source: "World Journal of Emergency Surgery",
        note: "Supports early risk stratification and surgery-first management when clinical severity is high.",
      },
      {
        id: "ref-1-2",
        title: "CODA Collaborative Follow-up",
        source: "NEJM / JAMA Surgery",
        note: "Shared decision data, including recurrence risk with non-operative pathways.",
      },
    ],
  },
  "ddx-2": {
    diagnosisId: "ddx-2",
    confidence: "Moderate",
    summary:
      "Current trajectory raises concern for progression toward complicated appendicitis, even if frank perforation is not yet visible.",
    priorityTests: [
      "Immediate CT re-review for free fluid, extraluminal air, or abscess pocket.",
      "Repeat lactate and metabolic profile if systemic signs are worsening.",
      "Broaden microbiology sampling if sepsis criteria are evolving.",
    ],
    immediateManagement: [
      "Short-interval reassessment by surgery and emergency teams jointly.",
      "Preemptive OR readiness and escalation protocol if exam rapidly worsens.",
      "Maintain strict intake/output and hemodynamic trend charting.",
    ],
    medicationAndMonitoring: [
      "Continue broad intra-abdominal coverage with dose adjustment for renal function.",
      "Increase monitoring cadence for fever curve and tachycardia response.",
      "Plan postoperative source-control and antimicrobial de-escalation strategy.",
    ],
    redFlags: [
      "Developing hypotension, persistent vomiting, or rising oxygen requirement.",
      "Progressive diffuse abdominal guarding or new altered mental status.",
    ],
    disposition:
      "High-priority admission with expedited operative planning and sepsis surveillance.",
    references: [
      {
        id: "ref-2-1",
        title: "SIS/IDSA Intra-abdominal Infection Guidance",
        source: "Clinical Infectious Diseases",
        note: "Framework for empiric antibiotic selection and source-control timing.",
      },
      {
        id: "ref-2-2",
        title: "Complicated Appendicitis Outcome Studies",
        source: "Annals of Surgery",
        note: "Delayed control is associated with higher morbidity and LOS.",
      },
    ],
  },
  "ddx-3": {
    diagnosisId: "ddx-3",
    confidence: "Moderate",
    summary:
      "Right-sided diverticulitis remains a meaningful mimic. Imaging characteristics should drive final separation from appendicitis.",
    priorityTests: [
      "CT pattern review for cecal diverticula and adjacent fat stranding distribution.",
      "Inflammatory marker trend and stool symptom correlation.",
      "Surgical and GI co-review if equivocal imaging persists.",
    ],
    immediateManagement: [
      "Continue bowel rest and hydration while diagnostic certainty is established.",
      "Avoid premature closure until appendiceal and cecal findings are reconciled.",
      "Use serial exams to identify transition to generalized peritonitis.",
    ],
    medicationAndMonitoring: [
      "Empiric coverage can overlap appendicitis pathway until diagnosis settles.",
      "Track pain migration and fever response after initial treatment.",
      "Escalate to procedural consult if abscess or perforation features emerge.",
    ],
    redFlags: [
      "Localized abscess formation or signs of perforation on delayed imaging.",
      "Persistent high fever and worsening tenderness despite antibiotics.",
    ],
    disposition:
      "Admit for monitored treatment; determine medical vs surgical route after imaging consensus.",
    references: [
      {
        id: "ref-3-1",
        title: "Right-Sided Diverticulitis Review",
        source: "International Journal of Colorectal Disease",
        note: "Highlights high diagnostic overlap with appendicitis in ED triage.",
      },
      {
        id: "ref-3-2",
        title: "ACR Appropriateness Criteria: RLQ Pain",
        source: "American College of Radiology",
        note: "Supports CT-first clarification in equivocal right lower quadrant syndromes.",
      },
    ],
  },
  "ddx-4": {
    diagnosisId: "ddx-4",
    confidence: "Lower",
    summary:
      "Terminal ileitis is less likely but should remain visible, particularly if bowel wall findings dominate the scan.",
    priorityTests: [
      "Assess terminal ileum thickening and skip-lesion pattern on imaging.",
      "Review stool pattern, weight trend, and prior inflammatory bowel history.",
      "Check fecal inflammatory markers when clinically useful.",
    ],
    immediateManagement: [
      "Continue supportive care while preserving diagnostic flexibility.",
      "Avoid anchoring bias from single positive appendiceal sign.",
      "Coordinate GI input if non-surgical inflammatory pathology rises in probability.",
    ],
    medicationAndMonitoring: [
      "Antibiotic strategy should be revisited if inflammatory bowel etiology predominates.",
      "Monitor hydration status and oral intake tolerance.",
      "Track CRP and WBC trajectory to separate infection from chronic inflammation.",
    ],
    redFlags: [
      "Rapidly increasing pain, bleeding, or systemic instability.",
      "Imaging progression with obstructive pattern or abscess.",
    ],
    disposition:
      "Observation/admission based on severity, with GI pathway if appendicitis is excluded.",
    references: [
      {
        id: "ref-4-1",
        title: "Differential Diagnosis of Terminal Ileitis",
        source: "World Journal of Gastroenterology",
        note: "Provides imaging and clinical discriminators versus appendicitis.",
      },
      {
        id: "ref-4-2",
        title: "Crohn Disease Emergency Presentations",
        source: "Emergency Medicine Clinics",
        note: "Approach to acute RLQ pain in inflammatory bowel populations.",
      },
    ],
  },
  "ddx-5": {
    diagnosisId: "ddx-5",
    confidence: "Lower",
    summary:
      "Mesenteric adenitis can present similarly but usually has less severe peritoneal exam findings.",
    priorityTests: [
      "Look for clustered mesenteric nodes and absence of appendiceal enlargement.",
      "Correlate with recent viral syndrome or upper respiratory symptoms.",
      "Repeat focused exam to verify stability over short interval.",
    ],
    immediateManagement: [
      "Maintain hydration and analgesia while excluding surgical disease.",
      "Use short-interval re-evaluation before discharge decisions.",
      "Provide strict return precautions if outpatient pathway is considered.",
    ],
    medicationAndMonitoring: [
      "Antibiotics are not routine unless superimposed bacterial concern exists.",
      "Trend pain and fever; unexpected worsening should reopen surgical workup.",
      "Limit opioid burden to preserve serial exam quality.",
    ],
    redFlags: [
      "Persistent focal rebound tenderness or escalating inflammatory markers.",
      "Failure to improve over observation period.",
    ],
    disposition:
      "Discharge with safety net only after high-confidence exclusion of appendicitis.",
    references: [
      {
        id: "ref-5-1",
        title: "Mesenteric Adenitis in Acute RLQ Pain",
        source: "Radiographics",
        note: "Imaging criteria that reduce false reassurance in appendicitis-like cases.",
      },
      {
        id: "ref-5-2",
        title: "Emergency Differential for RLQ Pain",
        source: "BMJ Best Practice",
        note: "Structured rule-out strategy before conservative discharge.",
      },
    ],
  },
  "ddx-6": {
    diagnosisId: "ddx-6",
    confidence: "Lower",
    summary:
      "Ureterolithiasis remains a secondary differential and should be excluded with urine and imaging clues.",
    priorityTests: [
      "Urinalysis for hematuria and crystalluria pattern.",
      "CT review for distal ureteral stone and hydronephrosis.",
      "Assess pain quality for classic colicky radiation profile.",
    ],
    immediateManagement: [
      "Continue analgesia while diagnostic pathway clarifies source.",
      "Hydration and antiemetics to support symptom control.",
      "Urology consult if obstructive complications appear.",
    ],
    medicationAndMonitoring: [
      "NSAID-forward pain strategy when renal function and bleeding risk permit.",
      "Consider alpha blocker strategy only when stone diagnosis is secured.",
      "Monitor for fever, AKI, or persistent vomiting requiring admission.",
    ],
    redFlags: [
      "Obstructive pyelonephritis signs (fever, flank pain, sepsis physiology).",
      "Anuria, AKI progression, or refractory pain.",
    ],
    disposition:
      "Outpatient stone pathway only if obstruction/infection risk is excluded and pain is controlled.",
    references: [
      {
        id: "ref-6-1",
        title: "EAU Urolithiasis Guideline",
        source: "European Association of Urology",
        note: "Emergency triage triggers for obstructive and infected stones.",
      },
      {
        id: "ref-6-2",
        title: "Acute Renal Colic Management",
        source: "New England Journal Review",
        note: "Evidence for analgesia-first strategy and selective intervention.",
      },
    ],
  },
  "ddx-7": {
    diagnosisId: "ddx-7",
    confidence: "Lower",
    summary:
      "Epiploic appendagitis is a benign mimic but does not explain this degree of systemic inflammatory signal.",
    priorityTests: [
      "CT assessment for fat-attenuation ovoid lesion with hyperattenuating rim.",
      "Rule out appendiceal dilation and periappendiceal inflammatory extension.",
      "Compare clinical severity with typically self-limited appendagitis course.",
    ],
    immediateManagement: [
      "Supportive treatment while maintaining vigilance for missed surgical pathology.",
      "Use time-based reassessment if diagnosis remains presumptive.",
      "Avoid discharge until pain trajectory is convincingly improving.",
    ],
    medicationAndMonitoring: [
      "NSAID-based therapy when appropriate; avoid unnecessary broad-spectrum antibiotics.",
      "Short follow-up window due to overlap with more serious etiologies.",
      "Escalate if fever or peritoneal signs increase.",
    ],
    redFlags: [
      "Increasing fever, tachycardia, or diffuse guarding not expected for appendagitis.",
      "Worsening inflammatory labs despite conservative management.",
    ],
    disposition:
      "Conservative care only after confident radiologic confirmation and stable repeat exam.",
    references: [
      {
        id: "ref-7-1",
        title: "Epiploic Appendagitis Imaging Features",
        source: "American Journal of Roentgenology",
        note: "Characteristic CT appearance and overlap pitfalls with appendicitis.",
      },
      {
        id: "ref-7-2",
        title: "Mimics of Acute Appendicitis",
        source: "Radiology Clinics",
        note: "Decision points to avoid missed surgical abdomen.",
      },
    ],
  },
}

export interface HeroDemoRecordField {
  label: string
  value: string
}

export interface HeroDemoRecordSectionPreview {
  id: string
  title: string
  content: string
}

export interface HeroDemoRecordState {
  patient: string
  encounterDate: string
  vitals: HeroDemoRecordField[]
  sections: HeroDemoRecordSectionPreview[]
  planChecklist: string[]
}

export const HERO_DEMO_RECORD_STATE: HeroDemoRecordState = {
  patient: "Alex Carter",
  encounterDate: "Feb 18, 2026",
  vitals: [
    { label: "Temp", value: "38.3 C" },
    { label: "HR", value: "102 bpm" },
    { label: "BP", value: "128/78" },
    { label: "RR", value: "20/min" },
    { label: "SpO2", value: "98%" },
    { label: "Pain", value: "8/10" },
  ],
  sections: [
    {
      id: "record-1",
      title: "Chief Complaint",
      content:
        "Sharp right lower quadrant abdominal pain worsening over the past 12 hours with fever and nausea.",
    },
    {
      id: "record-2",
      title: "History of Present Illness (HPI)",
      content:
        "Pain began periumbilically overnight, migrated to the right lower quadrant, and became worse with coughing, walking, and vehicle vibration. One episode of non-bloody emesis and marked anorexia.",
    },
    {
      id: "record-3",
      title: "Review of Systems (ROS)",
      content:
        "Positive for fever, nausea, anorexia, and focal abdominal pain. Negative for dysuria, gross hematuria, diarrhea, chest pain, or shortness of breath.",
    },
    {
      id: "record-4",
      title: "Physical Exam",
      content:
        "Appears uncomfortable. RLQ tenderness at McBurney point with rebound and guarding. Positive Rovsing sign. No CVA tenderness.",
    },
    {
      id: "record-5",
      title: "Labs and Imaging",
      content:
        "WBC 15.2k with neutrophil predominance, CRP elevated. CT abdomen/pelvis: 11 mm inflamed appendix with appendicolith and periappendiceal fat stranding.",
    },
    {
      id: "record-6",
      title: "Assessment",
      content:
        "Acute appendicitis with high risk for clinical progression; complicated course not yet excluded.",
    },
    {
      id: "record-7",
      title: "Plan",
      content:
        "NPO, IV fluids, ceftriaxone plus metronidazole, serial exams, urgent general surgery consultation, and same-day appendectomy workflow.",
    },
    {
      id: "record-8",
      title: "Shared Decision Notes",
      content:
        "Discussed operative pathway benefits, progression/perforation risks with delay, and expected inpatient recovery timeline. Patient agrees to proceed.",
    },
  ],
  planChecklist: [
    "Start IV fluids and maintain strict NPO status.",
    "Complete CT and lab bundle; update surgery immediately with final reads.",
    "Administer empiric ceftriaxone plus metronidazole.",
    "Reassess pain and vital signs every 30-60 minutes while awaiting OR.",
    "Document consent discussion and perioperative risk handoff.",
  ],
}

export interface HeroDemoFhirResourcePreview {
  id: string
  resourceType: string
  status: "Ready" | "Needs Review"
  summary: string
  keyFields: string[]
}

export interface HeroDemoFhirReviewState {
  title: string
  description: string
  patientDisplay: string
  resources: HeroDemoFhirResourcePreview[]
  validationChecks: string[]
  cancelLabel: string
  sendLabel: string
}

export const HERO_DEMO_FHIR_REVIEW_STATE: HeroDemoFhirReviewState = {
  title: "Review FHIR Data",
  description: "Review and edit generated FHIR resources before sending to your EMR.",
  patientDisplay: "Alex Carter | Encounter 2026-02-18",
  resources: [
    {
      id: "fhir-1",
      resourceType: "Encounter",
      status: "Ready",
      summary:
        "Emergency encounter created with acute abdominal pain workflow and triage metadata.",
      keyFields: [
        "status=in-progress",
        "class=AMB",
        "serviceType=Emergency Medicine",
      ],
    },
    {
      id: "fhir-2",
      resourceType: "Condition",
      status: "Ready",
      summary:
        "Primary diagnosis mapped to acute appendicitis with active verification status.",
      keyFields: [
        "code=ICD-11 DB30.4",
        "clinicalStatus=active",
        "verificationStatus=provisional",
      ],
    },
    {
      id: "fhir-3",
      resourceType: "Observation",
      status: "Ready",
      summary:
        "Vital signs and inflammatory lab observations packaged for encounter timeline.",
      keyFields: [
        "Temp=38.3 C",
        "HR=102 bpm",
        "WBC=15.2 x10^9/L",
      ],
    },
    {
      id: "fhir-4",
      resourceType: "MedicationRequest",
      status: "Needs Review",
      summary:
        "Empiric ceftriaxone and metronidazole orders generated with route and timing.",
      keyFields: [
        "intent=order",
        "dosageInstruction pending pharmacy validation",
        "priority=urgent",
      ],
    },
    {
      id: "fhir-5",
      resourceType: "ServiceRequest",
      status: "Ready",
      summary:
        "Urgent surgical consult and appendectomy pathway request staged for EMR dispatch.",
      keyFields: [
        "priority=stat",
        "category=Procedure",
        "reasonCode=Acute appendicitis",
      ],
    },
  ],
  validationChecks: [
    "5 resources validated, 0 schema errors, 1 clinical review warning.",
    "MedicationRequest dosage requires pharmacist confirmation.",
    "Encounter participant and author references are mapped to active user identity.",
  ],
  cancelLabel: "Cancel",
  sendLabel: "Send to EMR",
}

export interface HeroDemoResearchState {
  userQuery: string
  assistantMarkdown: string
}

export const HERO_DEMO_RESEARCH_STATE: HeroDemoResearchState = {
  userQuery:
    "We plan to increase metformin from 1000 mg to 2000 mg and add empagliflozin. Please provide the expected rate of achieving HbA1c <7% with this combination, the real-world magnitude of HbA1c reduction, and the evidence supporting gradual metformin titration at two-week intervals.",
  assistantMarkdown: `## Evidence Brief: Metformin Uptitration + Empagliflozin

### Quick answer
- **Expected HbA1c < 7% attainment** after intensification to metformin 2000 mg/day plus empagliflozin is typically in the **~38-62% range** at 6-12 months, depending on baseline HbA1c and adherence.
- **Real-world HbA1c reduction** with this combination is generally around **1.2-1.8 percentage points** from baseline in routine practice cohorts.
- **Two-week metformin titration** is supported by tolerability-focused evidence and guideline-concordant dose escalation workflows that reduce GI discontinuation while preserving long-term glycemic benefit.

### 1) Estimated rate of achieving HbA1c < 7%

| Baseline HbA1c before intensification | Typical cohort profile | Estimated proportion reaching HbA1c < 7% (24-52 weeks) |
| --- | --- | --- |
| 7.8-8.4% | Earlier intensification, higher persistence | 48-62% |
| 8.5-9.0% | Mixed adherence, routine specialist follow-up | 40-52% |
| 9.1-10.0% | Delayed intensification or high insulin resistance | 28-41% |

> Interpretation: the target-attainment rate is strongly baseline-dependent. Most real-world programs see the largest gains when dose escalation and adherence support occur in parallel.

### 2) Real-world HbA1c lowering magnitude

| Regimen context | Mean HbA1c change | Practical range |
| --- | --- | --- |
| Metformin uptitration (1000 -> 2000 mg/day) alone | -0.3% to -0.6% | up to -0.8% with strong adherence |
| Empagliflozin add-on to metformin backbone | -0.6% to -0.9% | up to -1.1% in higher baseline groups |
| Combined strategy in routine care | -1.2% to -1.8% | occasionally approaches -2.0% in high baseline HbA1c |

### 3) Evidence for two-week metformin titration

| Titration element | Evidence signal | Clinical implication |
| --- | --- | --- |
| Increment every 1-2 weeks with meals | Consistent with guideline dosing and trial run-in protocols | Improves GI tolerability and continuation |
| Slower escalation for GI-sensitive patients | Observational persistence data and prescribing standards | Reduces early dropout that limits glycemic benefit |
| Reach effective dose before judging add-on effect | Longitudinal treatment-effect curves | Supports fair assessment of SGLT2 response |

### 4) Suggested implementation pathway

| Timepoint | Suggested action | Monitoring focus |
| --- | --- | --- |
| Week 0 | Metformin 1000 mg/day + start empagliflozin | Baseline renal function, volume status, GI counseling |
| Week 2 | Increase metformin to 1500 mg/day if tolerated | GI symptoms, adherence, hydration |
| Week 4 | Increase metformin to 2000 mg/day (or max tolerated) | Ongoing tolerance, fasting glucose trend |
| Week 8-12 | Reassess HbA1c trajectory and adverse events | Decide on further intensification if target unmet |

### 5) Evidence basis used in this synthesis
1. ADA/EASD consensus care pathways for T2D intensification and metformin use.
2. Empagliflozin randomized add-on trials and extension analyses.
3. Real-world comparative cohort studies evaluating metformin + SGLT2 combinations.
4. Prescribing references describing gradual metformin titration at 1-2 week intervals.

---
**Demo note:** Values above are illustrative evidence-style ranges for UI preview and should be validated against patient-specific factors before clinical use.
`,
}

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
      text: "You look uncomfortable. Walk me through exactly when this pain started and how it has changed.",
    },
    insights: {
      summary:
        "Acute abdominal pain interview initiated with immediate concern for evolving surgical abdomen.",
      keyFindings: [
        "Consultation started with focused pain timeline elicitation",
        "Patient appears uncomfortable and limits movement",
      ],
      redFlags: [],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: false },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: false },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: false },
      ],
    },
  },
  {
    id: "step-2",
    transcript: {
      id: "tx-2",
      speaker: "PATIENT",
      text: "It started around my belly button overnight, but now it is sharp in the lower right side and keeps getting worse.",
    },
    insights: {
      summary:
        "Classic migration from periumbilical pain to RLQ significantly increases appendicitis probability.",
      keyFindings: [
        "Migratory abdominal pain now localized to RLQ",
        "Pain intensity continues to increase over time",
        "No relief with rest",
      ],
      redFlags: ["Classic migration pattern for acute appendicitis"],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: false },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: false },
      ],
    },
  },
  {
    id: "step-3",
    transcript: {
      id: "tx-3",
      speaker: "PATIENT",
      text: "I threw up once, I do not want to eat anything, and even small movements make it hurt more.",
    },
    insights: {
      summary:
        "Nausea, emesis, anorexia, and movement pain support inflammatory intra-abdominal process with surgical concern.",
      keyFindings: [
        "Nausea with one non-bloody emesis",
        "Marked anorexia",
        "Pain worsens with movement and position change",
      ],
      redFlags: ["Escalating pain with systemic GI symptoms"],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: false },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: false },
      ],
    },
  },
  {
    id: "step-4",
    transcript: {
      id: "tx-4",
      speaker: "DOCTOR",
      text: "Any urinary burning, blood in urine, or diarrhea? Also, does coughing or the car ride make this pain spike?",
    },
    insights: {
      summary:
        "Differential-focused questioning performed to separate appendicitis from urinary and bowel mimics.",
      keyFindings: [
        "Urinary and diarrheal rule-out questions asked",
        "Provoked pain with cough/motion query supports peritoneal irritation screen",
      ],
      redFlags: [],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: false },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: false },
      ],
    },
  },
  {
    id: "step-5",
    transcript: {
      id: "tx-5",
      speaker: "PATIENT",
      text: "No urinary symptoms and no diarrhea. The car bumps were terrible, and I had chills this morning.",
    },
    insights: {
      summary:
        "Negative urinary/diarrheal symptoms plus chills and motion sensitivity further narrow toward appendiceal inflammation.",
      keyFindings: [
        "No dysuria, hematuria, or diarrhea reported",
        "Pain worsened by transport vibration",
        "Chills reported this morning",
      ],
      redFlags: ["Pain amplified by movement with new systemic symptoms"],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: true },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: true },
        { id: "ck-6", label: "Begin NPO and IV hydration", done: false },
      ],
    },
  },
  {
    id: "step-6",
    transcript: {
      id: "tx-6",
      speaker: "DOCTOR",
      text: "Your temperature is 38.3 C, heart rate is 102, and there is focal tenderness at McBurney point with guarding.",
    },
    insights: {
      summary:
        "Objective vitals and focal exam findings now place appendicitis at top of differential.",
      keyFindings: [
        "Temperature 38.3 C with tachycardia",
        "McBurney point tenderness and guarding",
        "Localized peritoneal irritation",
      ],
      redFlags: ["Systemic inflammatory response with focal RLQ peritoneal signs"],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: true },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: true },
        { id: "ck-6", label: "Begin NPO and IV hydration", done: true },
        { id: "ck-7", label: "Start empiric IV antibiotics", done: false },
      ],
    },
  },
  {
    id: "step-7",
    transcript: {
      id: "tx-7",
      speaker: "DOCTOR",
      text: "Rebound tenderness and Rovsing sign are both positive, so we need urgent imaging and a surgery review now.",
    },
    insights: {
      summary:
        "Positive peritoneal maneuvers significantly increase urgency for definitive imaging and surgical handoff.",
      keyFindings: [
        "Rebound tenderness present",
        "Rovsing sign positive",
        "Exam trend worsening compared with arrival",
      ],
      redFlags: [
        "Progressive peritoneal signs",
        "High short-term risk of complicated appendicitis if delayed",
      ],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: true },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: true },
        { id: "ck-6", label: "Begin NPO and IV hydration", done: true },
        { id: "ck-7", label: "Start empiric IV antibiotics", done: true },
        { id: "ck-8", label: "Order CT abdomen/pelvis with contrast", done: false },
      ],
    },
  },
  {
    id: "step-8",
    transcript: {
      id: "tx-8",
      speaker: "DOCTOR",
      text: "Your labs show WBC 15.2 and elevated CRP, which supports active inflammation and keeps appendicitis very likely.",
    },
    insights: {
      summary:
        "Laboratory profile aligns with active appendiceal inflammation and supports rapid definitive management.",
      keyFindings: [
        "Leukocytosis with neutrophil predominance",
        "CRP elevated",
        "Urinalysis not suggestive of primary urinary etiology",
      ],
      redFlags: ["Inflammatory burden rising with ongoing focal peritoneal exam"],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: true },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: true },
        { id: "ck-6", label: "Begin NPO and IV hydration", done: true },
        { id: "ck-7", label: "Start empiric IV antibiotics", done: true },
        { id: "ck-8", label: "Order CT abdomen/pelvis with contrast", done: true },
        { id: "ck-9", label: "Notify surgery with preliminary data", done: false },
      ],
    },
  },
  {
    id: "step-9",
    transcript: {
      id: "tx-9",
      speaker: "DOCTOR",
      text: "CT confirms an inflamed 11 mm appendix with appendicolith and surrounding fat stranding.",
    },
    insights: {
      summary:
        "Imaging confirms acute appendicitis with appendicolith, closing major diagnostic uncertainty.",
      keyFindings: [
        "CT: dilated inflamed appendix (11 mm)",
        "Appendicolith present",
        "Periappendiceal fat stranding",
      ],
      redFlags: ["Appendicolith increases risk of progression and treatment failure if delayed"],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: true },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: true },
        { id: "ck-6", label: "Begin NPO and IV hydration", done: true },
        { id: "ck-7", label: "Start empiric IV antibiotics", done: true },
        { id: "ck-8", label: "Order CT abdomen/pelvis with contrast", done: true },
        { id: "ck-9", label: "Notify surgery with preliminary data", done: true },
      ],
    },
  },
  {
    id: "step-10",
    transcript: {
      id: "tx-10",
      speaker: "DOCTOR",
      text: "We are moving to same-day appendectomy, and we have already started IV ceftriaxone and metronidazole.",
    },
    insights: {
      summary:
        "Definitive treatment path activated with antibiotics, source-control planning, and ongoing monitoring.",
      keyFindings: [
        "Urgent surgery pathway activated",
        "Empiric IV ceftriaxone plus metronidazole started",
        "NPO and IV fluid protocol maintained",
      ],
      redFlags: ["Delay to OR could increase perforation risk"],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: true },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: true },
        { id: "ck-6", label: "Begin NPO and IV hydration", done: true },
        { id: "ck-7", label: "Start empiric IV antibiotics", done: true },
        { id: "ck-8", label: "Order CT abdomen/pelvis with contrast", done: true },
        { id: "ck-9", label: "Notify surgery with preliminary data", done: true },
      ],
    },
  },
  {
    id: "step-11",
    transcript: {
      id: "tx-11",
      speaker: "PATIENT",
      text: "Understood. I want to proceed with surgery today if that is the safest option.",
    },
    insights: {
      summary:
        "Shared decision-making completed. Patient agrees with urgent operative management and documented risk discussion.",
      keyFindings: [
        "Patient preference aligned with urgent appendectomy",
        "Risks of delay and expected recovery discussed",
        "Consent preparation initiated",
      ],
      redFlags: [],
      checklist: [
        { id: "ck-1", label: "Clarify onset and migration pattern", done: true },
        { id: "ck-2", label: "Screen GI, urinary, and systemic symptoms", done: true },
        { id: "ck-3", label: "Assess movement-related pain and guarding", done: true },
        { id: "ck-4", label: "Complete vitals and focused abdominal exam", done: true },
        { id: "ck-5", label: "Order initial labs (CBC, CRP, UA, lactate)", done: true },
        { id: "ck-6", label: "Begin NPO and IV hydration", done: true },
        { id: "ck-7", label: "Start empiric IV antibiotics", done: true },
        { id: "ck-8", label: "Order CT abdomen/pelvis with contrast", done: true },
        { id: "ck-9", label: "Notify surgery with preliminary data", done: true },
      ],
    },
  },
]
