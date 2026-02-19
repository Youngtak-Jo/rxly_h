import { Instrument_Serif } from "next/font/google"
import styles from "./landing-sections.module.css"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
})

type FeatureVisual =
  | "transcription"
  | "insights"
  | "ddx"
  | "scribe"
  | "research"
  | "fhir"

type FeatureItem = {
  id: string
  title: string
  description: string
  valueLine: string
  visual: FeatureVisual
  cardClass: string
}

const FEATURE_ITEMS: FeatureItem[] = [
  {
    id: "transcription",
    title: "Real-Time Voice Transcription",
    description:
      "Medical speech is captured live with speaker-aware structuring for doctor and patient turns.",
    valueLine: "Live diarization + structured timeline",
    visual: "transcription",
    cardClass: "featureCardA",
  },
  {
    id: "insights",
    title: "AI Clinical Insights",
    description:
      "Summaries, key findings, red flags, and action checklists update continuously during the consult.",
    valueLine: "Continuous reasoning updates in-session",
    visual: "insights",
    cardClass: "featureCardB",
  },
  {
    id: "ddx",
    title: "Differential Diagnosis (DDx)",
    description:
      "Evidence-ranked differentials are surfaced with rationale and next-step guidance.",
    valueLine: "Ranked candidates with confidence context",
    visual: "ddx",
    cardClass: "featureCardC",
  },
  {
    id: "scribe",
    title: "Automated Medical Scribe",
    description:
      "Consultation context is converted into structured SOAP-ready documentation for clinician review.",
    valueLine: "Structured note draft without post-visit backlog",
    visual: "scribe",
    cardClass: "featureCardD",
  },
  {
    id: "research",
    title: "Evidence Research Assistant",
    description:
      "Clinical questions are answered with sourced evidence from trusted medical data endpoints.",
    valueLine: "Cited evidence briefs at point of care",
    visual: "research",
    cardClass: "featureCardE",
  },
  {
    id: "fhir",
    title: "EMR/EHR Integration (FHIR R4)",
    description:
      "Validated FHIR resource bundles are prepared for review and dispatch into existing systems.",
    valueLine: "Review-first export workflow to EMR/EHR",
    visual: "fhir",
    cardClass: "featureCardF",
  },
]


function renderFeaturePreview(visual: FeatureVisual) {
  switch (visual) {
    case "transcription":
      return (
        <div className={styles.featurePreviewShell}>
          <div className={styles.featureMeta}>
            <span className={styles.miniPill}>
              <span className={styles.liveDot} />
              Live capture
            </span>
            <div className={styles.waveBars} aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <ul className={styles.transcriptList}>
            <li className={styles.transcriptRow}>
              <span className={styles.speakerChipDoctor}>Dr</span>
              <p>Pain started centrally overnight and now localizes to the RLQ.</p>
              <span>00:22</span>
            </li>
            <li className={styles.transcriptRow}>
              <span className={styles.speakerChipPatient}>Pt</span>
              <p>Walking and coughing make it sharper than before.</p>
              <span>00:36</span>
            </li>
            <li className={styles.transcriptRow}>
              <span className={styles.speakerChipDoctor}>Dr</span>
              <p>Noted. Logging symptom progression and timeline markers.</p>
              <span>00:48</span>
            </li>
          </ul>
        </div>
      )

    case "insights":
      return (
        <div className={styles.featurePreviewShell}>
          <p className={styles.insightSummary}>
            Appendicitis likelihood is increasing with progressive focal tenderness and fever.
          </p>
          <ul className={styles.insightList}>
            <li>Migratory abdominal pain now anchored in RLQ.</li>
            <li>Inflammatory pattern is strengthening across vitals + exam.</li>
          </ul>
          <p className={styles.redFlagPill}>Red flag: rebound tenderness now present.</p>
          <p className={styles.checkRow}>
            <span className={styles.checkDone}>Done</span>
            CBC + CRP + urinalysis bundle queued.
          </p>
          <p className={styles.checkRow}>
            <span className={styles.checkDone}>Done</span>
            Surgery handoff draft generated.
          </p>
          <div className={styles.shimmerLine} aria-hidden />
        </div>
      )

    case "ddx":
      return (
        <div className={styles.featurePreviewShell}>
          <ul className={styles.ddxList}>
            <li className={styles.ddxRow}>
              <div>
                <p>Acute appendicitis</p>
              </div>
              <span className={`${styles.miniPill} ${styles.likelihoodHigh}`}>High</span>
            </li>
            <li className={styles.ddxRow}>
              <div>
                <p>Complicated appendicitis risk</p>
              </div>
              <span className={`${styles.miniPill} ${styles.likelihoodModerate}`}>Moderate</span>
            </li>
            <li className={styles.ddxRow}>
              <div>
                <p>Cecal diverticulitis</p>
              </div>
              <span className={`${styles.miniPill} ${styles.likelihoodLower}`}>Lower</span>
            </li>
          </ul>
          <p className={styles.ddxNextStep}>
            Next step: confirm CT findings and route to urgent surgical review.
          </p>
        </div>
      )

    case "scribe":
      return (
        <div className={styles.featurePreviewShell}>
          <div className={styles.scribeTabs}>
            <span className={styles.scribeTabActive}>S</span>
            <span>O</span>
            <span>A</span>
            <span>P</span>
          </div>
          <div className={styles.scribeBody}>
            <p>CC: RLQ pain worsening over 12 hours with nausea and chills.</p>
            <p>Exam: McBurney tenderness, guarding, positive Rovsing sign.</p>
            <p>Plan: NPO, IV fluids, ceftriaxone + metronidazole, surgery consult.</p>
          </div>
          <div className={styles.completionTrack}>
            <span className={styles.completionFill} />
          </div>
        </div>
      )

    case "research":
      return (
        <div className={styles.featurePreviewShell}>
          <p className={styles.queryBubble}>
            Query: expected HbA1c target attainment after metformin uptitration + empagliflozin?
          </p>
          <div className={styles.sourceList}>
            <span className={`${styles.miniPill} ${styles.sourceChip}`}>PubMed</span>
            <span className={`${styles.miniPill} ${styles.sourceChip}`}>ClinicalTrials.gov</span>
            <span className={`${styles.miniPill} ${styles.sourceChip}`}>DailyMed</span>
          </div>
          <div className={styles.answerPanel}>
            <p>
              Evidence brief: real-world cohorts show ~1.2 to 1.8% HbA1c reduction with baseline-dependent
              target attainment at 24 to 52 weeks.
            </p>
          </div>
        </div>
      )

    case "fhir":
      return (
        <div className={styles.featurePreviewShell}>
          <ul className={styles.resourceList}>
            <li className={styles.resourceRow}>
              <span>Encounter</span>
              <span className={`${styles.miniPill} ${styles.statusReady}`}>Ready</span>
            </li>
            <li className={styles.resourceRow}>
              <span>Condition</span>
              <span className={`${styles.miniPill} ${styles.statusReady}`}>Ready</span>
            </li>
            <li className={styles.resourceRow}>
              <span>Observation</span>
              <span className={`${styles.miniPill} ${styles.statusReady}`}>Ready</span>
            </li>
            <li className={styles.resourceRow}>
              <span>MedicationRequest</span>
              <span className={`${styles.miniPill} ${styles.statusReview}`}>Needs Review</span>
            </li>
          </ul>
          <ul className={styles.validationList}>
            <li>4 resources validated, 1 clinical review warning.</li>
            <li>Medication dosage needs pharmacist confirmation.</li>
          </ul>
          <span className={styles.exportStub}>Send to EMR</span>
        </div>
      )

    default:
      return null
  }
}

export function LandingSections() {
  return (
    <div className={styles.surface}>
      <div aria-hidden className={`${styles.driftBlob} ${styles.blobOne}`} />
      <div aria-hidden className={`${styles.driftBlob} ${styles.blobTwo}`} />

      <section
        id="features"
        className={`scroll-mt-28 px-6 pb-8 pt-20 md:scroll-mt-36 md:px-10 md:pt-24 ${styles.section} ${styles.delayOne}`}
      >
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">Features</p>
          <h2
            className={`${instrumentSerif.className} mt-3 text-3xl font-normal tracking-tight text-foreground md:text-4xl`}
          >
            Clinical intelligence across the full consultation loop
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-foreground/70 md:text-base">
            From capture to decision support and export, Rxly keeps the clinician in control while AI
            handles real-time synthesis.
          </p>

          <div className={styles.featureGrid}>
            {FEATURE_ITEMS.map((item) => (
              <article key={item.id} className={`${styles.featureCardShell} ${styles[item.cardClass]}`}>
                <div className={styles.featureHead}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <p className={styles.featureValueLine}>{item.valueLine}</p>
                </div>
                {renderFeaturePreview(item.visual)}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
