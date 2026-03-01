"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import LiquidGlass from "liquid-glass-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { Activity, Check, FileDown } from "lucide-react"
import {
  HERO_DEMO_DDX_STATE,
  HERO_DEMO_DDX_SUPPORT_BY_ID,
  HERO_DEMO_FHIR_REVIEW_STATE,
  HERO_DEMO_MODE_OPTIONS,
  HERO_DEMO_PATIENT_HANDOUT_STATE,
  HERO_DEMO_RECORD_STATE,
  HERO_DEMO_RESEARCH_STATE,
  HERO_DEMO_STEP_INTERVAL_MS,
  HERO_DEMO_STEPS,
  type HeroDemoMode,
  type HeroDemoTranscriptEntry,
} from "./hero-consultation-demo-data"
import styles from "./hero-consultation-demo.module.css"

function ddxLikelihoodClass(likelihood: "High" | "Moderate" | "Lower") {
  if (likelihood === "High") {
    return "bg-red-500/15 text-red-700 dark:text-red-300"
  }

  if (likelihood === "Moderate") {
    return "bg-amber-500/15 text-amber-700 dark:text-amber-300"
  }

  return "bg-slate-500/15 text-slate-700 dark:text-slate-300"
}

const INITIAL_DDX_ID = HERO_DEMO_DDX_STATE.candidates[0]?.id ?? ""

export function HeroConsultationDemo() {
  const t = useTranslations("LandingHeroDemo")
  const [activeMode, setActiveMode] = useState<HeroDemoMode>("insights")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [selectedDdxId, setSelectedDdxId] = useState(INITIAL_DDX_ID)
  const transcriptRef = useRef<HTMLElement | null>(null)
  const activePanelId = `hero-demo-panel-${activeMode}`
  const modeLabels: Record<HeroDemoMode, string> = {
    insights: t("modeLabels.insights"),
    ddx: t("modeLabels.ddx"),
    record: t("modeLabels.record"),
    research: t("modeLabels.research"),
    patientHandout: t("modeLabels.patientHandout"),
  }
  const compactModeLabels: Record<HeroDemoMode, string> = {
    insights: t("modeShortLabels.insights"),
    ddx: t("modeShortLabels.ddx"),
    record: t("modeShortLabels.record"),
    research: t("modeShortLabels.research"),
    patientHandout: t("modeShortLabels.patientHandout"),
  }
  const speakerLabels: Record<HeroDemoTranscriptEntry["speaker"], string> = {
    DOCTOR: t("speaker.doctor"),
    PATIENT: t("speaker.patient"),
  }
  const likelihoodLabels = {
    High: t("likelihood.high"),
    Moderate: t("likelihood.moderate"),
    Lower: t("likelihood.lower"),
  }
  const fhirStatusLabels = {
    Ready: t("fhir.status.ready"),
    "Needs Review": t("fhir.status.needsReview"),
  }
  const vitalLabels: Record<string, string> = {
    Temp: t("record.vitals.temp"),
    HR: t("record.vitals.hr"),
    BP: t("record.vitals.bp"),
    RR: t("record.vitals.rr"),
    SpO2: t("record.vitals.spo2"),
    Pain: t("record.vitals.pain"),
  }
  const recordSectionTitles: Record<string, string> = {
    "record-1": t("record.sections.chiefComplaint"),
    "record-2": t("record.sections.hpi"),
    "record-3": t("record.sections.ros"),
    "record-4": t("record.sections.physicalExam"),
    "record-5": t("record.sections.labsAndImaging"),
    "record-6": t("record.sections.assessment"),
    "record-7": t("record.sections.plan"),
    "record-8": t("record.sections.sharedDecisionNotes"),
  }

  const isInsightsMode = activeMode === "insights"
  const isPlaying = isInsightsMode && !prefersReducedMotion
  const playbackInterval = prefersReducedMotion
    ? HERO_DEMO_STEP_INTERVAL_MS * 2
    : HERO_DEMO_STEP_INTERVAL_MS

  const visibleEntries = useMemo(
    () => HERO_DEMO_STEPS.slice(0, currentStepIndex + 1).map((step) => step.transcript),
    [currentStepIndex]
  )

  const currentStep = HERO_DEMO_STEPS[currentStepIndex]

  const selectedDdxCandidate = useMemo(
    () =>
      HERO_DEMO_DDX_STATE.candidates.find((candidate) => candidate.id === selectedDdxId) ??
      HERO_DEMO_DDX_STATE.candidates[0],
    [selectedDdxId]
  )

  const selectedDdxSupport = useMemo(() => {
    if (!selectedDdxCandidate) {
      return null
    }

    return (
      HERO_DEMO_DDX_SUPPORT_BY_ID[selectedDdxCandidate.id] ??
      HERO_DEMO_DDX_SUPPORT_BY_ID[INITIAL_DDX_ID]
    )
  }, [selectedDdxCandidate])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")

    const updatePreference = () => {
      setPrefersReducedMotion(media.matches)
    }

    updatePreference()
    media.addEventListener("change", updatePreference)

    return () => media.removeEventListener("change", updatePreference)
  }, [])

  useEffect(() => {
    if (!isPlaying) return

    const timer = window.setTimeout(() => {
      setCurrentStepIndex((prev) => (prev + 1) % HERO_DEMO_STEPS.length)
    }, playbackInterval)

    return () => window.clearTimeout(timer)
  }, [isPlaying, currentStepIndex, playbackInterval])

  useEffect(() => {
    if (!isInsightsMode) return

    const container = transcriptRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })
  }, [currentStepIndex, isInsightsMode, prefersReducedMotion])

  const panelBaseClass =
    "min-h-0 rounded-xl border border-border/70 bg-background/80 p-3 md:p-4"

  return (
    <div className="mx-auto w-full max-w-[74rem]">
      <div className="mb-10">
        <div className="relative h-12 w-full overflow-visible">
          <LiquidGlass
            blurAmount={0}
            aberrationIntensity={2}
            elasticity={0.08}
            saturation={140}
            mode="standard"
            cornerRadius={999}
            padding="0"
            style={{ position: "absolute", top: "50%", left: "50%" }}
          >
            <div className={styles.modeToggleViewport}>
              <div role="tablist" aria-label={t("tablistLabel")} className={styles.modeToggleTrack}>
                {HERO_DEMO_MODE_OPTIONS.map((modeOption) => {
                  const isActive = modeOption.id === activeMode
                  return (
                    <button
                      key={modeOption.id}
                      id={`hero-demo-tab-${modeOption.id}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={modeLabels[modeOption.id]}
                      aria-controls={`hero-demo-panel-${modeOption.id}`}
                      onClick={() => setActiveMode(modeOption.id)}
                      className={cn(styles.modeToggleButton, isActive && styles.modeToggleButtonActive)}
                    >
                      <span aria-hidden="true" className={styles.modeToggleLabelLong}>
                        {modeLabels[modeOption.id]}
                      </span>
                      <span aria-hidden="true" className={styles.modeToggleLabelShort}>
                        {compactModeLabels[modeOption.id]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </LiquidGlass>
        </div>
      </div>

      <section
        aria-label={t("simulationLabel")}
        className="relative flex h-[34rem] w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/85 text-left shadow-[0_30px_90px_-46px_oklch(0.24_0.03_45/0.65)] backdrop-blur-xl sm:h-[36rem] md:h-[38rem]"
      >
        <div className="flex items-center border-b border-border/80 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
            <p className="ml-2 text-xs font-medium text-foreground/90">{t("sessionTitle")}</p>
          </div>
        </div>

        <div
          id={activePanelId}
          role="tabpanel"
          aria-labelledby={`hero-demo-tab-${activeMode}`}
          key={activeMode}
          className={cn("min-h-0 flex-1 p-3 md:p-4", styles.modeSwapIn)}
        >
          {isInsightsMode && (
            <div className="grid h-full min-h-0 gap-3 md:grid-cols-[1.04fr_0.96fr] md:gap-4">
              <section
                className={cn(
                  panelBaseClass,
                  styles.panelIn,
                  "relative flex min-h-0 flex-col overflow-y-auto ring-1 ring-primary/35"
                )}
                aria-label={t("panels.insights")}
              >
                <header className="relative z-10 mb-2 flex items-center">
                  <div className="flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" />
                    <h3 className="text-xs font-semibold">{t("headings.liveInsights")}</h3>
                  </div>
                </header>

                <div
                  className={cn(
                    "relative z-10 flex-1 space-y-3 pr-1 text-[11px] md:text-xs",
                    styles.insightsTextRefresh,
                    isPlaying && "insights-shimmer-overlay"
                  )}
                  key={currentStep.id}
                >
                  <article>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t("headings.summary")}
                    </p>
                    <p className="text-foreground/90">{currentStep.insights.summary}</p>
                  </article>

                  <article>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t("headings.keyFindings")} ({currentStep.insights.keyFindings.length})
                    </p>
                    <ul className="space-y-1 text-foreground/90">
                      {currentStep.insights.keyFindings.map((finding) => (
                        <li key={finding} className="flex items-start gap-2">
                          <span className="mt-[0.32rem] size-1.5 rounded-full bg-emerald-500/80" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </article>

                  <article>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t("headings.redFlags")} ({currentStep.insights.redFlags.length})
                    </p>
                    {currentStep.insights.redFlags.length === 0 ? (
                      <p className="text-muted-foreground">{t("noCriticalWarningSigns")}</p>
                    ) : (
                      <ul className="space-y-1 text-foreground/90">
                        {currentStep.insights.redFlags.map((flag) => (
                          <li key={flag} className="flex items-start gap-2">
                            <span className="mt-[0.32rem] size-1.5 rounded-full bg-red-500/80" />
                            <span>{flag}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>

                  <article>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t("headings.checklist")}
                    </p>
                    <ul className="space-y-1">
                      {currentStep.insights.checklist.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-foreground/90">
                          <span
                            className={cn(
                              "mt-[0.1rem] inline-flex size-3.5 items-center justify-center rounded border",
                              item.done
                                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                : "border-border/80 bg-muted text-muted-foreground"
                            )}
                          >
                            {item.done && <Check className="size-2.5" />}
                          </span>
                          <span className={cn(item.done && "text-muted-foreground line-through")}>
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              </section>

              <section
                ref={transcriptRef}
                className={cn(
                  panelBaseClass,
                  styles.panelIn,
                  "flex min-h-0 flex-col overflow-y-auto ring-1 ring-primary/20"
                )}
                aria-label={t("panels.transcript")}
              >
                <header className="mb-2 flex items-center">
                  <h3 className="text-xs font-semibold">{t("headings.transcript")}</h3>
                </header>

                <div className="flex flex-col gap-2 pr-1">
                  {visibleEntries.map((entry) => {
                    const isDoctor = entry.speaker === "DOCTOR"
                    return (
                      <div
                        key={entry.id}
                        className={cn("flex", isDoctor ? "justify-end" : "justify-start")}
                      >
                        <article
                          className={cn(
                            "max-w-[90%] rounded-lg px-3 py-2 text-[11px] leading-relaxed",
                            isDoctor
                              ? "rounded-tr-sm border border-primary/15 bg-primary/10 text-foreground backdrop-blur-sm"
                              : "rounded-tl-sm border border-zinc-300/70 bg-zinc-200/80 text-foreground dark:border-zinc-700/70 dark:bg-zinc-800/70"
                          )}
                        >
                          <p>{entry.text}</p>
                          <p
                            className={cn(
                              "mt-1 text-[10px] font-medium",
                              isDoctor ? "text-primary/75" : "text-muted-foreground"
                            )}
                          >
                            {speakerLabels[entry.speaker]}
                          </p>
                        </article>
                      </div>
                    )
                  })}

                  {isPlaying && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{t("listening")}</span>
                      <span className="flex items-center gap-1">
                        <span className={cn("size-1.5 rounded-full bg-primary/75", styles.typingDot)} />
                        <span
                          className={cn(
                            "size-1.5 rounded-full bg-primary/75",
                            styles.typingDot,
                            styles.typingDotDelayOne
                          )}
                        />
                        <span
                          className={cn(
                            "size-1.5 rounded-full bg-primary/75",
                            styles.typingDot,
                            styles.typingDotDelayTwo
                          )}
                        />
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeMode === "ddx" && (
            <div className="grid h-full min-h-0 gap-3 md:grid-cols-[1.02fr_0.98fr] md:gap-4">
              <section
                className={cn(
                  panelBaseClass,
                  styles.panelIn,
                  "flex min-h-0 flex-col overflow-y-auto ring-1 ring-amber-500/35"
                )}
                aria-label={t("panels.ddx")}
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold">{t("headings.differentialDx")}</h3>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    {t("headings.activeTriage")}
                  </span>
                </header>

                <p className="text-[11px] text-foreground/90 md:text-xs">
                  <span className="font-semibold">{t("headings.chiefConcern")}:</span>{" "}
                  {HERO_DEMO_DDX_STATE.chiefConcern}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
                  <span className="font-semibold text-foreground/80">{t("headings.signal")}:</span>{" "}
                  {HERO_DEMO_DDX_STATE.triageSignal}
                </p>

                <div className="mt-3 space-y-2 pr-1">
                  {HERO_DEMO_DDX_STATE.candidates.map((candidate) => {
                    const isSelected = selectedDdxCandidate?.id === candidate.id

                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedDdxId(candidate.id)}
                        className={cn(
                          styles.ddxCandidateButton,
                          isSelected && styles.ddxCandidateButtonActive
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] font-semibold text-foreground md:text-xs">
                            {candidate.diagnosis}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              ddxLikelihoodClass(candidate.likelihood)
                            )}
                          >
                            {likelihoodLabels[candidate.likelihood]}
                          </span>
                        </div>
                        <p className="mt-1 text-left text-[11px] text-muted-foreground md:text-xs">
                          {candidate.rationale}
                        </p>
                        <p className="mt-1.5 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          {t("headings.nextStep")}
                        </p>
                        <p className="text-left text-[11px] text-foreground/90 md:text-xs">
                          {candidate.nextStep}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section
                className={cn(
                  panelBaseClass,
                  styles.panelIn,
                  "flex min-h-0 flex-col overflow-y-auto ring-1 ring-amber-500/20"
                )}
                aria-label={t("panels.support")}
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold">{t("headings.clinicalDecisionSupport")}</h3>
                  {selectedDdxSupport && (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        ddxLikelihoodClass(selectedDdxSupport.confidence)
                      )}
                    >
                      {t("confidenceFormat", {
                        value: likelihoodLabels[selectedDdxSupport.confidence],
                      })}
                    </span>
                  )}
                </header>

                {selectedDdxSupport && selectedDdxCandidate ? (
                  <div className="space-y-3 pr-1 text-[11px] md:text-xs">
                    <article className="rounded-lg border border-border/70 bg-background/70 p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("headings.selectedDiagnosis")}
                      </p>
                      <p className="mt-1 font-semibold text-foreground">{selectedDdxCandidate.diagnosis}</p>
                      <p className="mt-1 text-muted-foreground">{selectedDdxSupport.summary}</p>
                    </article>

                    <article>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("headings.priorityTests")}
                      </p>
                      <ul className="space-y-1.5 text-foreground/90">
                        {selectedDdxSupport.priorityTests.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-[0.32rem] size-1.5 rounded-full bg-amber-500/80" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>

                    <article>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("headings.immediateManagement")}
                      </p>
                      <ul className="space-y-1.5 text-foreground/90">
                        {selectedDdxSupport.immediateManagement.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-[0.32rem] size-1.5 rounded-full bg-amber-500/80" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>

                    <article>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("headings.medicationAndMonitoring")}
                      </p>
                      <ul className="space-y-1.5 text-foreground/90">
                        {selectedDdxSupport.medicationAndMonitoring.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-[0.32rem] size-1.5 rounded-full bg-amber-500/80" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>

                    <article className="rounded-lg border border-red-500/25 bg-red-500/5 p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700 dark:text-red-300">
                        {t("headings.redFlags")}
                      </p>
                      <ul className="mt-1 space-y-1.5 text-foreground/90">
                        {selectedDdxSupport.redFlags.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-[0.32rem] size-1.5 rounded-full bg-red-500/80" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </article>

                    <article className="rounded-lg border border-border/70 bg-background/70 p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("headings.disposition")}
                      </p>
                      <p className="mt-1 text-foreground/90">{selectedDdxSupport.disposition}</p>
                    </article>

                    <article>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("headings.keyReferences")}
                      </p>
                      <div className="space-y-1.5">
                        {selectedDdxSupport.references.map((ref) => (
                          <div
                            key={ref.id}
                            className="rounded-lg border border-border/70 bg-background/70 p-2.5"
                          >
                            <p className="font-medium text-foreground/95">{ref.title}</p>
                            <p className="text-[10px] text-muted-foreground">{ref.source}</p>
                            <p className="mt-0.5 text-muted-foreground">{ref.note}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                ) : null}
              </section>
            </div>
          )}

          {activeMode === "record" && (
            <div className="grid h-full min-h-0 gap-3 md:grid-cols-[1fr_1.15fr] md:gap-4">
              <section
                className={cn(
                  panelBaseClass,
                  styles.panelIn,
                  "flex min-h-0 flex-col overflow-y-auto ring-1 ring-emerald-500/35"
                )}
                aria-label={t("panels.record")}
              >
                <header className="mb-3">
                  <h3 className="text-xs font-semibold">{t("headings.consultationRecord")}</h3>
                  <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
                    {HERO_DEMO_RECORD_STATE.patient} | {HERO_DEMO_RECORD_STATE.encounterDate}
                  </p>
                </header>

                <div className="rounded-lg border border-border/70 bg-background/70 p-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {t("headings.vitals")}
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] md:text-xs">
                    {HERO_DEMO_RECORD_STATE.vitals.map((vital) => (
                      <div key={vital.label}>
                        <p className="text-[10px] uppercase text-muted-foreground">
                          {vitalLabels[vital.label] ?? vital.label}
                        </p>
                        <p className="font-medium text-foreground/90">{vital.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 space-y-2 pr-1">
                  {HERO_DEMO_RECORD_STATE.sections.map((section) => (
                    <article
                      key={section.id}
                      className="rounded-lg border border-border/70 bg-background/70 p-2.5"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {recordSectionTitles[section.id] ?? section.title}
                      </p>
                      <p className="mt-1 text-[11px] text-foreground/90 md:text-xs">{section.content}</p>
                    </article>
                  ))}

                  <article className="rounded-lg border border-border/70 bg-background/70 p-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {t("headings.planChecklist")}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {HERO_DEMO_RECORD_STATE.planChecklist.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-[11px] text-foreground/90 md:text-xs"
                        >
                          <span className="mt-[0.1rem] inline-flex size-3.5 items-center justify-center rounded border border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            <Check className="size-2.5" />
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
              </section>

              <section
                className={cn(
                  panelBaseClass,
                  styles.panelIn,
                  "flex min-h-0 flex-col overflow-hidden ring-1 ring-emerald-500/20"
                )}
                aria-label={t("panels.fhir")}
              >
                <div
                  className={cn(
                    "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80",
                    styles.fhirDialogMock
                  )}
                >
                  <header className="border-b border-border/80 px-3 py-2.5">
                    <h3 className="text-xs font-semibold">{t("fhir.title")}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
                      {t("fhir.description")}
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-foreground/80">
                      {HERO_DEMO_FHIR_REVIEW_STATE.patientDisplay}
                    </p>
                  </header>

                  <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2.5 pb-3">
                    {HERO_DEMO_FHIR_REVIEW_STATE.resources.map((resource) => {
                      const isReady = resource.status === "Ready"

                      return (
                        <article
                          key={resource.id}
                          className="rounded-lg border border-border/70 bg-background/70 p-2.5 text-[11px] md:text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-foreground">{resource.resourceType}</p>
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                isReady
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              )}
                            >
                              {fhirStatusLabels[resource.status]}
                            </span>
                          </div>
                          <p className="mt-1 text-muted-foreground">{resource.summary}</p>
                          <ul className="mt-1.5 space-y-1 text-foreground/90">
                            {resource.keyFields.map((field) => (
                              <li key={field} className="flex items-start gap-2">
                                <span className="mt-[0.32rem] size-1.5 rounded-full bg-emerald-500/80" />
                                <span className="font-mono text-[10px] md:text-[11px]">{field}</span>
                              </li>
                            ))}
                          </ul>
                        </article>
                      )
                    })}

                    <article className="rounded-lg border border-border/70 bg-background/70 p-2.5 text-[11px] md:text-xs">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                        {t("headings.validationNotes")}
                      </p>
                      <ul className="mt-2 space-y-1.5 text-foreground/90">
                        {HERO_DEMO_FHIR_REVIEW_STATE.validationChecks.map((check) => (
                          <li key={check} className="flex items-start gap-2">
                            <span className="mt-[0.32rem] size-1.5 rounded-full bg-emerald-500/80" />
                            <span>{check}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  </div>

                  <footer className="z-10 flex shrink-0 items-center justify-end gap-2 border-t border-border/80 bg-background px-3 py-2.5">
                    <button
                      type="button"
                      className="rounded-md border border-border/80 bg-background px-3 py-1.5 text-[11px] font-medium text-foreground/90 transition-colors hover:bg-muted md:text-xs"
                    >
                      {t("fhir.cancel")}
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-emerald-700 md:text-xs"
                    >
                      {t("fhir.sendToEmr")}
                    </button>
                  </footer>
                </div>
              </section>
            </div>
          )}

          {activeMode === "research" && (
            <div className="h-full min-h-0">
              <section
                className={cn(
                  panelBaseClass,
                  styles.panelIn,
                  "flex h-full min-h-0 flex-col overflow-y-auto ring-1 ring-sky-500/35"
                )}
                aria-label={t("panels.research")}
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold">{t("headings.research")}</h3>
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-sky-700 dark:text-sky-300">
                      {HERO_DEMO_RESEARCH_STATE.modelLabel}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{t("research.generatedAt")}</p>
                  </div>
                </header>

                <div className="space-y-3 pr-1">
                  <div className="flex justify-end">
                    <article className="max-w-[98%] rounded-2xl rounded-br-sm border border-primary/25 bg-primary/10 px-3 py-2 text-[11px] leading-relaxed md:text-xs">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary/80">
                        {t("headings.userQuery")}
                      </p>
                      <p className="text-foreground/95">{HERO_DEMO_RESEARCH_STATE.userQuery}</p>
                    </article>
                  </div>

                  <div className="research-markdown text-[11px] md:text-xs">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {HERO_DEMO_RESEARCH_STATE.assistantMarkdown}
                    </ReactMarkdown>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeMode === "patientHandout" && (
            <div className="h-full min-h-0">
              <section
                className={cn(
                  panelBaseClass,
                  styles.panelIn,
                  "flex h-full min-h-0 flex-col overflow-y-auto ring-1 ring-cyan-500/35"
                )}
                aria-label={t("panels.patientHandout")}
              >
                <header className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold">{t("headings.patientHandout")}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
                      {HERO_DEMO_PATIENT_HANDOUT_STATE.patientDisplay}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-medium text-cyan-700 transition-colors hover:bg-cyan-500/15 dark:text-cyan-200"
                    aria-label={t("patientHandout.downloadPdfAria")}
                  >
                    <FileDown className="size-3.5" />
                    {t("patientHandout.downloadPdf")}
                  </button>
                </header>

                <article className="research-markdown rounded-lg border border-border/70 bg-background/70 p-3 text-[11px] md:text-xs">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {HERO_DEMO_PATIENT_HANDOUT_STATE.markdown}
                  </ReactMarkdown>
                </article>
              </section>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
