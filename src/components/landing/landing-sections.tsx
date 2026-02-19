import Image from "next/image"
import { Instrument_Serif } from "next/font/google"
import styles from "./landing-sections.module.css"

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
})

type ConnectorItem = {
  id: string
  name: string
  logoSrc?: string
}

type SettingsOption = {
  id: string
  title: string
  description: string
}

type FhirResourceState = {
  id: string
  resource: string
  status: "Ready" | "Review"
}

const CONNECTORS: ConnectorItem[] = [
  { id: "pubmed", name: "PubMed" },
  { id: "icd11", name: "ICD-11" },
  { id: "europe-pmc", name: "Europe PMC" },
  { id: "openfda", name: "OpenFDA" },
  { id: "clinicaltrials", name: "ClinicalTrials.gov" },
  { id: "dailymed", name: "DailyMed" },
]

const SETTINGS_OPTIONS: SettingsOption[] = [
  {
    id: "model-routing",
    title: "AI Model Routing",
    description: "Choose different models by task such as transcript analysis, DDx, research, and handout generation.",
  },
  {
    id: "custom-instructions",
    title: "Custom Instructions",
    description: "Define clinic-level rules, tone, language, and documentation preferences inside Settings.",
  },
  {
    id: "ehr-fit",
    title: "EMR/EHR Environment Fit",
    description: "Tailor output and handoff behavior to your existing charting and review workflow.",
  },
  {
    id: "team-preferences",
    title: "Team Configuration",
    description: "Set defaults by department so each room gets the right workflow without manual setup.",
  },
]

const SECURITY_CONTROLS = [
  "AES-256-GCM encryption for sensitive data at rest",
  "Secure transport with strict HTTPS enforcement",
  "Audit-ready logging and traceability hooks",
  "Prompt input sanitization and rate limiting safeguards",
]

const FHIR_FLOW = [
  "Capture encounter and narrative context",
  "Assemble FHIR R4 resources",
  "Validate and flag items needing review",
  "Dispatch approved bundle to EHR",
]

const FHIR_RESOURCES: FhirResourceState[] = [
  { id: "encounter", resource: "Encounter", status: "Ready" },
  { id: "condition", resource: "Condition", status: "Ready" },
  { id: "observation", resource: "Observation", status: "Ready" },
  { id: "medication-request", resource: "MedicationRequest", status: "Review" },
]

function renderConnectorTile(connector: ConnectorItem, key: string) {
  return (
    <li key={key} className={styles.connectorTile}>
      {connector.logoSrc ? (
        <Image
          src={connector.logoSrc}
          alt={`${connector.name} logo`}
          width={140}
          height={40}
          className={styles.connectorLogo}
        />
      ) : (
        <span className={styles.connectorFallback}>{connector.name}</span>
      )}
    </li>
  )
}

export function LandingSections() {
  return (
    <div className={styles.surface}>
      <div aria-hidden className={`${styles.driftBlob} ${styles.blobOne}`} />
      <div aria-hidden className={`${styles.driftBlob} ${styles.blobTwo}`} />

      <section
        id="connectors"
        className={`scroll-mt-28 px-6 pt-20 md:scroll-mt-36 md:px-10 md:pt-24 ${styles.section} ${styles.delayOne}`}
      >
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Connectors</p>
          <h2 className={`${instrumentSerif.className} ${styles.title}`}>
            Trusted medical sources, always in the loop
          </h2>
          <p className={styles.description}>
            Rxly can be wired to tier-1 clinical data endpoints so evidence appears at the point of care.
          </p>

          <article className={styles.card}>
            <div className={styles.marqueeViewport}>
              <div className={styles.marqueeTrack}>
                <ul className={styles.marqueeRow}>
                  {CONNECTORS.map((connector) => renderConnectorTile(connector, `${connector.id}-primary`))}
                </ul>
                <ul className={styles.marqueeRow} aria-hidden="true">
                  {CONNECTORS.map((connector) => renderConnectorTile(connector, `${connector.id}-clone`))}
                </ul>
              </div>
            </div>
            <p className={styles.note}>
              Logo slots are in place. Insert brand assets later and each tile will auto-switch from text fallback
              to logo.
            </p>
          </article>
        </div>
      </section>

      <section
        id="customization"
        className={`scroll-mt-28 px-6 pt-12 md:scroll-mt-36 md:px-10 md:pt-16 ${styles.section} ${styles.delayTwo}`}
      >
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Customization</p>
          <h2 className={`${instrumentSerif.className} ${styles.title}`}>
            Settings that adapt to each clinical environment
          </h2>
          <p className={styles.description}>
            From model selection to instruction policy, teams can shape Rxly around real clinic workflows.
          </p>

          <div className={styles.twoColumn}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Built for practical day-to-day operations</h3>
              <ul className={styles.settingsList}>
                {SETTINGS_OPTIONS.map((option) => (
                  <li key={option.id} className={styles.settingsItem}>
                    <p>{option.title}</p>
                    <span>{option.description}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className={styles.card}>
              <p className={styles.previewKicker}>Settings Preview</p>
              <div className={styles.previewList}>
                <p className={styles.previewRow}>
                  <span>Clinical Support Model</span>
                  <strong>GPT-5 / Claude</strong>
                </p>
                <p className={styles.previewRow}>
                  <span>Custom Instruction Profile</span>
                  <strong>Family Medicine Default</strong>
                </p>
                <p className={styles.previewRow}>
                  <span>EMR/EHR Mapping</span>
                  <strong>Practice-specific Template</strong>
                </p>
                <p className={styles.previewRow}>
                  <span>Output Language</span>
                  <strong>English</strong>
                </p>
              </div>
              <p className={styles.note}>
                Teams can standardize defaults per care setting and still allow clinician-level overrides.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="security"
        className={`scroll-mt-28 px-6 pt-12 md:scroll-mt-36 md:px-10 md:pt-16 ${styles.section} ${styles.delayThree}`}
      >
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Security</p>
          <h2 className={`${instrumentSerif.className} ${styles.title}`}>
            Encryption-first with HIPAA-aligned safeguards
          </h2>
          <p className={styles.description}>
            Security controls are designed for healthcare handling requirements across storage, transport, and
            operational access.
          </p>

          <div className={styles.twoColumn}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Core technical safeguards</h3>
              <ul className={styles.securityList}>
                {SECURITY_CONTROLS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={`${styles.card} ${styles.securityNoticeCard}`}>
              <p className={styles.previewKicker}>Compliance Status</p>
              <h3 className={styles.cardTitle}>HIPAA-aligned implementation in progress</h3>
              <p className={styles.descriptionInline}>
                Controls are built to support HIPAA technical safeguards and review-friendly governance workflows.
              </p>
              <p className={styles.noticeText}>BAA not yet available.</p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="ehr-integration"
        className={`scroll-mt-28 px-6 pb-20 pt-12 md:scroll-mt-36 md:px-10 md:pb-24 md:pt-16 ${styles.section} ${styles.delayFour}`}
      >
        <div className={styles.inner}>
          <p className={styles.eyebrow}>EHR Integration</p>
          <h2 className={`${instrumentSerif.className} ${styles.title}`}>FHIR R4-ready handoff for EMR/EHR</h2>
          <p className={styles.description}>
            Data is staged as structured FHIR R4 resources, reviewed by clinicians, and then dispatched into your
            EHR flow.
          </p>

          <div className={styles.twoColumn}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Review-first export sequence</h3>
              <div className={styles.flowGrid}>
                {FHIR_FLOW.map((step, index) => (
                  <p key={step} className={styles.flowStep}>
                    <span>{index + 1}</span>
                    {step}
                  </p>
                ))}
              </div>
            </article>

            <article className={styles.card}>
              <h3 className={styles.cardTitle}>FHIR resource status</h3>
              <ul className={styles.resourceList}>
                {FHIR_RESOURCES.map((item) => (
                  <li key={item.id} className={styles.resourceRow}>
                    <span>{item.resource}</span>
                    <span
                      className={`${styles.resourceBadge} ${
                        item.status === "Ready" ? styles.resourceReady : styles.resourceReview
                      }`}
                    >
                      {item.status}
                    </span>
                  </li>
                ))}
              </ul>
              <p className={styles.note}>Validation warnings stay visible until clinician review is complete.</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  )
}
