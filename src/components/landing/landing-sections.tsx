import Image from "next/image"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { LandingCta } from "./landing-cta"
import { Instrument_Serif } from "next/font/google"
import {
  Fingerprint,
  Lock,
  CheckCircle2,
  FileJson,
  ChevronRight,
  Settings,
  SlidersHorizontal,
  Bot,
  Languages,
  ChevronDown,
  ShieldCheck,
  Activity
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

export async function LandingSections() {
  const t = await getTranslations("LandingSections")

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
                {t("connectors.title")}
              </h2>
              <p className={styles.description}>
                {t("connectors.description")}
              </p>
              <Link href="/features/connectors" className={styles.learnMoreLink}>
                {t("learnMore")} <ChevronRight className={styles.learnMoreIcon} />
              </Link>
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
              <p className={styles.eyebrow}>{t("customization.eyebrow")}</p>
              <h2 className={`${instrumentSerif.className} ${styles.title}`}>
                {t("customization.title")}
              </h2>
              <p className={styles.description}>
                {t("customization.description")}
              </p>
              <Link href="/features/customization" className={styles.learnMoreLink}>
                {t("learnMore")} <ChevronRight className={styles.learnMoreIcon} />
              </Link>
            </div>
            <div className={`${styles.visualSquare} ${styles.customSquare}`}>
              <div className={`${styles.mockUiGlass} ${styles.settingsDialog}`}>
                <div className={styles.settingsHeader}>
                  <Settings className={styles.settingsHeaderIcon} />
                  <span>{t("customization.header")}</span>
                </div>
                <div className={styles.settingsBody}>
                  {/* Row 1: AI Model (Select Box) */}
                  <div className={styles.settingsRow}>
                    <div className={styles.settingsRowLeft}>
                      <div className={styles.settingsIconWrapper}>
                        <Bot className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className={styles.settingsRowText}>
                        <span className={styles.settingsRowTitle}>{t("customization.aiModel")}</span>
                        <span className={styles.settingsRowDesc}>{t("customization.aiModelDescription")}</span>
                      </div>
                    </div>
                    <div className={styles.mockSelect}>
                      <span>Opus 4.6</span>
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </div>
                  </div>

                  {/* Row 2: Tone & Style (Segmented Control) */}
                  <div className={styles.settingsRow}>
                    <div className={styles.settingsRowLeft}>
                      <div className={styles.settingsIconWrapper}>
                        <SlidersHorizontal className="w-4 h-4 text-pink-600" />
                      </div>
                      <div className={styles.settingsRowText}>
                        <span className={styles.settingsRowTitle}>{t("customization.toneStyle")}</span>
                        <span className={styles.settingsRowDesc}>{t("customization.toneStyleDescription")}</span>
                      </div>
                    </div>
                    <div className={styles.mockSegmentedControl}>
                      <span className={`${styles.mockSegment} ${styles.mockSegmentActive}`}>{t("customization.professional")}</span>
                      <span className={styles.mockSegment}>{t("customization.concise")}</span>
                    </div>
                  </div>

                  {/* Row 3: Auto-translate (Toggle) */}
                  <div className={styles.settingsRow}>
                    <div className={styles.settingsRowLeft}>
                      <div className={styles.settingsIconWrapper}>
                        <Languages className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className={styles.settingsRowText}>
                        <span className={styles.settingsRowTitle}>{t("customization.autoTranslate")}</span>
                        <span className={styles.settingsRowDesc}>{t("customization.autoTranslateDescription")}</span>
                      </div>
                    </div>
                    <div className={`${styles.mockToggle} ${styles.mockToggleActive}`}></div>
                  </div>

                  {/* Row 4: Evidence Level (Slider) */}
                  <div className={`${styles.settingsRow} ${styles.settingsRowVertical}`}>
                    <div className={styles.settingsRowHeader}>
                      <span className={styles.settingsRowTitle}>{t("customization.evidenceThreshold")}</span>
                      <span className={styles.settingsRowValue}>{t("customization.highConfidence")}</span>
                    </div>
                    <div className={styles.mockSliderContainer}>
                      <div className={styles.mockSliderTrack}>
                        <div className={styles.mockSliderFill} style={{ width: '85%' }}></div>
                        <div className={styles.mockSliderThumb} style={{ left: '85%' }}></div>
                      </div>
                      <div className={styles.mockSliderScale}>
                        <span>{t("customization.low")}</span>
                        <span>{t("customization.medium")}</span>
                        <span>{t("customization.high")}</span>
                      </div>
                    </div>
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
              <p className={styles.eyebrow}>{t("security.eyebrow")}</p>
              <h2 className={`${instrumentSerif.className} ${styles.title}`}>
                {t("security.title")}
              </h2>
              <p className={styles.description}>
                {t("security.description")}
              </p>
              <Link href="/features/security" className={styles.learnMoreLink}>
                {t("learnMore")} <ChevronRight className={styles.learnMoreIcon} />
              </Link>
            </div>
            <div className={`${styles.visualSquare} ${styles.securitySquare}`}>
              <div className={`${styles.mockUiGlass} ${styles.securityCard}`}>
                <div className={styles.securityHeaderVisual}>
                  <div className={styles.securityPulseRings}>
                    <div className={styles.ring1}></div>
                    <div className={styles.ring2}></div>
                    <div className={styles.ring3}></div>
                  </div>
                  <div className={styles.securityIconCenter}>
                    <ShieldCheck className={styles.centerIcon} />
                  </div>
                </div>

                <div className={styles.securityStatusPanel}>
                  <span className={styles.securityStatusLabel}>{t("security.systemStatus")}</span>
                  <span className={styles.securityStatusValue}>{t("security.protected")}</span>
                </div>

                <div className={styles.securityList}>
                  <div className={styles.securityItem}>
                    <div className={styles.securityItemIcon}>
                      <Lock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className={styles.securityItemText}>
                      <span className={styles.securityItemTitle}>{t("security.aes")}</span>
                      <span className={styles.securityItemSub}>{t("security.aesDescription")}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>

                  <div className={styles.securityItem}>
                    <div className={styles.securityItemIcon}>
                      <Fingerprint className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className={styles.securityItemText}>
                      <span className={styles.securityItemTitle}>{t("security.https")}</span>
                      <span className={styles.securityItemSub}>{t("security.httpsDescription")}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>

                  <div className={styles.securityItem}>
                    <div className={styles.securityItemIcon}>
                      <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className={styles.securityItemText}>
                      <span className={styles.securityItemTitle}>{t("security.audit")}</span>
                      <span className={styles.securityItemSub}>{t("security.auditDescription")}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
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
              <p className={styles.eyebrow}>{t("ehr.eyebrow")}</p>
              <h2 className={`${instrumentSerif.className} ${styles.title}`}>{t("ehr.title")}</h2>
              <p className={styles.description}>
                {t("ehr.description")}
              </p>
              <Link href="/features/ehr" className={styles.learnMoreLink}>
                {t("learnMore")} <ChevronRight className={styles.learnMoreIcon} />
              </Link>
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

      <LandingCta />
    </div>
  )
}
