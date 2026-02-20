import Image from "next/image"
import Link from "next/link"
import { Instrument_Serif } from "next/font/google"
import {
  Search,
  PenTool,
  Fingerprint,
  Lock,
  CheckCircle2,
  FileJson,
  Briefcase,
  Zap,
  MousePointer2,
  ChevronRight,
  Settings,
  SlidersHorizontal,
  Bot,
  Languages
} from "lucide-react"
import styles from "./landing-sections.module.css"

const CONNECTORS = [
  { id: "pubmed", name: "PubMed", logoSrc: "/connector-logos/pubmed.svg" },
  { id: "icd11", name: "ICD-11", logoSrc: "/connector-logos/icd11-who.png" },
  { id: "europe-pmc", name: "Europe PMC", logoSrc: "/connector-logos/europe-pmc.png" },
  { id: "openfda", name: "OpenFDA", logoSrc: "/connector-logos/openfda3.png" },
  { id: "clinicaltrials", name: "ClinicalTrials.gov", logoSrc: "/connector-logos/NIH-Symbol.png" },
  { id: "dailymed", name: "DailyMed", logoSrc: "/connector-logos/dailymed2.png" },
]

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
})

export function LandingSections() {
  return (
    <div className={styles.surface}>
      <div aria-hidden className={`${styles.driftBlob} ${styles.blobOne}`} />
      <div aria-hidden className={`${styles.driftBlob} ${styles.blobTwo}`} />

      {/* Connectors */}
      <section
        id="connectors"
        className={`scroll-mt-28 px-6 pt-20 md:scroll-mt-36 md:px-10 md:pt-24 ${styles.section} ${styles.delayOne}`}
      >
        <div className={styles.inner}>
          <div className={styles.sectionInner}>
            <div className={styles.textContent}>
              <p className={styles.eyebrow}>Connectors</p>
              <h2 className={`${instrumentSerif.className} ${styles.title}`}>
                Trusted medical sources, always in the loop
              </h2>
              <p className={styles.description}>
                Rxly can be wired to tier-1 clinical data endpoints so evidence appears at the point of care.
              </p>
              <a href="#" className={styles.learnMoreLink}>
                Learn more <ChevronRight className={styles.learnMoreIcon} />
              </a>
            </div>
            <div className={`${styles.visualSquare} ${styles.connectorsSquare}`}>
              <div className={styles.connectorsUiContainer}>
                <div className={styles.connectorsGrid}>
                  {CONNECTORS.map(connector => (
                    <div key={connector.id} className={styles.connectorLogoCard}>
                      <Image
                        src={connector.logoSrc}
                        alt={connector.name}
                        width={120}
                        height={40}
                        className={styles.connectorLogoImg}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customization */}
      <section
        id="customization"
        className={`scroll-mt-28 px-6 pt-12 md:scroll-mt-36 md:px-10 md:pt-16 ${styles.section} ${styles.delayTwo}`}
      >
        <div className={styles.inner}>
          <div className={`${styles.sectionInner} ${styles.sectionInnerReverse}`}>
            <div className={styles.textContent}>
              <p className={styles.eyebrow}>Customization</p>
              <h2 className={`${instrumentSerif.className} ${styles.title}`}>
                Settings that adapt to each clinical environment
              </h2>
              <p className={styles.description}>
                From model selection to instruction policy, teams can shape Rxly around real clinic workflows.
              </p>
              <a href="#" className={styles.learnMoreLink}>
                Learn more <ChevronRight className={styles.learnMoreIcon} />
              </a>
            </div>
            <div className={`${styles.visualSquare} ${styles.customSquare}`}>
              <div className={`${styles.mockUiGlass} ${styles.settingsDialog}`}>
                <div className={styles.settingsHeader}>
                  <Settings className={styles.settingsHeaderIcon} />
                  <span>Clinic Preferences</span>
                </div>
                <div className={styles.settingsBody}>
                  <div className={styles.settingsRow}>
                    <div className={styles.settingsRowLeft}>
                      <div className={styles.settingsIconWrapper}>
                        <Bot className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className={styles.settingsRowText}>
                        <span className={styles.settingsRowTitle}>AI Model</span>
                        <span className={styles.settingsRowDesc}>GPT-5 / Claude 3.5</span>
                      </div>
                    </div>
                    <div className={styles.mockToggle}></div>
                  </div>

                  <div className={styles.settingsRow}>
                    <div className={styles.settingsRowLeft}>
                      <div className={styles.settingsIconWrapper}>
                        <SlidersHorizontal className="w-4 h-4 text-pink-600" />
                      </div>
                      <div className={styles.settingsRowText}>
                        <span className={styles.settingsRowTitle}>Tone & Style</span>
                        <span className={styles.settingsRowDesc}>Professional, concise</span>
                      </div>
                    </div>
                    <div className={`${styles.mockToggle} ${styles.mockToggleActive}`}></div>
                  </div>

                  <div className={styles.settingsRow}>
                    <div className={styles.settingsRowLeft}>
                      <div className={styles.settingsIconWrapper}>
                        <Languages className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className={styles.settingsRowText}>
                        <span className={styles.settingsRowTitle}>Output Language</span>
                        <span className={styles.settingsRowDesc}>Korean (Auto-translate)</span>
                      </div>
                    </div>
                    <div className={styles.mockToggle}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section
        id="security"
        className={`scroll-mt-28 px-6 pt-12 md:scroll-mt-36 md:px-10 md:pt-16 ${styles.section} ${styles.delayThree}`}
      >
        <div className={styles.inner}>
          <div className={styles.sectionInner}>
            <div className={styles.textContent}>
              <p className={styles.eyebrow}>Security</p>
              <h2 className={`${instrumentSerif.className} ${styles.title}`}>
                Encryption-first with HIPAA-aligned safeguards
              </h2>
              <p className={styles.description}>
                Security controls are designed for healthcare handling requirements across storage, transport, and
                operational access.
              </p>
              <a href="#" className={styles.learnMoreLink}>
                Learn more <ChevronRight className={styles.learnMoreIcon} />
              </a>
            </div>
            <div className={`${styles.visualSquare} ${styles.securitySquare}`}>
              <div className={`${styles.mockUiGlass} ${styles.securityCard}`}>
                <div className={styles.securityRow}>
                  <Lock className={styles.securityRowIcon} />
                  <span className={styles.securityRowText}>AES-256 Encryption at Rest</span>
                </div>
                <div className={styles.securityRow}>
                  <Fingerprint className={styles.securityRowIcon} />
                  <span className={styles.securityRowText}>Strict HTTPS Enforcement</span>
                </div>
                <div className={styles.securityRow}>
                  <CheckCircle2 className={styles.securityRowIcon} />
                  <span className={styles.securityRowText}>Audit-ready Event Logging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EHR */}
      <section
        id="ehr"
        className={`scroll-mt-28 px-6 pb-20 pt-12 md:scroll-mt-36 md:px-10 md:pb-24 md:pt-16 ${styles.section} ${styles.delayFour}`}
      >
        <div className={styles.inner}>
          <div className={`${styles.sectionInner} ${styles.sectionInnerReverse}`}>
            <div className={styles.textContent}>
              <p className={styles.eyebrow}>EHR</p>
              <h2 className={`${instrumentSerif.className} ${styles.title}`}>FHIR R4-ready handoff for EMR/EHR</h2>
              <p className={styles.description}>
                Data is staged as structured FHIR R4 resources, reviewed by clinicians, and then dispatched into your
                EHR flow.
              </p>
              <a href="#" className={styles.learnMoreLink}>
                Learn more <ChevronRight className={styles.learnMoreIcon} />
              </a>
            </div>
            <div className={`${styles.visualSquare} ${styles.ehrSquare}`}>
              <div className={`${styles.mockUiGlass} ${styles.ehrCard}`}>
                <div className={styles.ehrHeader}>
                  <div className={styles.ehrTitle}>
                    <FileJson className={styles.ehrTitleIcon} />
                    <span>FHIR Bundle</span>
                  </div>
                  <span className={styles.ehrStatus}>Ready</span>
                </div>
                <div className={styles.ehrRow}>
                  <span>Encounter</span>
                  <span className={styles.ehrRowSuccess}>Mapped</span>
                </div>
                <div className={styles.ehrRow}>
                  <span>Condition</span>
                  <span className={styles.ehrRowSuccess}>Mapped</span>
                </div>
                <div className={styles.ehrRow}>
                  <span>Observation</span>
                  <span className={styles.ehrRowSuccess}>Mapped</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`px-6 pb-24 md:px-10 md:pb-32 ${styles.section} ${styles.delayFour} ${styles.ctaSection}`}>
        <div className={styles.inner}>
          <div className={styles.ctaContent}>
            <h2 className={`${instrumentSerif.className} ${styles.ctaTitle}`}>
              Ready to transform your clinical workflow?
            </h2>
            <p className={styles.ctaDescription}>
              Join the future of healthcare with Rxly's intelligent, secure, and integrated platform.
            </p>
            <div className={styles.ctaButtonGroup}>
              <Link href="/consultation" className={styles.ctaPrimaryButton}>
                Start
                <ChevronRight className="w-4 h-4" />
              </Link>
              <a href="mailto:contact@rxly.ai" className={styles.ctaSecondaryButton}>
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
