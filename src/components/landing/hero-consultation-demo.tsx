"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import LiquidGlass from "liquid-glass-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Activity, Check, FileDown } from "lucide-react"

import { useMobileViewport } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

import {
  HERO_DEMO_DDX_STATE,
  HERO_DEMO_DDX_SUPPORT_BY_ID,
  HERO_DEMO_DOCUMENT_OPTIONS,
  HERO_DEMO_FHIR_REVIEW_STATE,
  HERO_DEMO_MODE_OPTIONS,
  HERO_DEMO_PATIENT_HANDOUT_STATE,
  HERO_DEMO_RECORD_STATE,
  HERO_DEMO_RESEARCH_STATE,
  HERO_DEMO_STEP_INTERVAL_MS,
  HERO_DEMO_STEPS,
  type HeroDemoDocumentKind,
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

function documentSelectorClass(kind: HeroDemoDocumentKind, isActive: boolean) {
  if (!isActive) {
    return "border-border/70 bg-background/70 text-foreground/80 hover:border-border/90 hover:bg-background"
  }

  if (kind === "record") {
    return "border-emerald-500/35 bg-emerald-500/12 text-foreground"
  }

  if (kind === "research") {
    return "border-sky-500/35 bg-sky-500/12 text-foreground"
  }

  return "border-cyan-500/35 bg-cyan-500/12 text-foreground"
}

const INITIAL_DDX_ID = HERO_DEMO_DDX_STATE.candidates[0]?.id ?? ""
const INITIAL_DOCUMENT_KIND: HeroDemoDocumentKind = "record"

export function HeroConsultationDemo() {
  const t = useTranslations("LandingHeroDemo")
  const { isMobile, isReady: isMobileReady } = useMobileViewport()
  const [activeMode, setActiveMode] = useState<HeroDemoMode>("insights")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [selectedDdxId, setSelectedDdxId] = useState(INITIAL_DDX_ID)
  const [selectedDocumentKind, setSelectedDocumentKind] =
    useState<HeroDemoDocumentKind>(INITIAL_DOCUMENT_KIND)
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  const activePanelId = `hero-demo-panel-${activeMode}`
  const useMobileLayout = isMobileReady ? isMobile : false
  const modeLabels: Record<HeroDemoMode, string> = {
    insights: t("modeLabels.insights"),
    ddx: t("modeLabels.ddx"),
    documents: t("modeLabels.documents"),
  }
  const compactModeLabels: Record<HeroDemoMode, string> = {
    insights: t("modeShortLabels.insights"),
    ddx: t("modeShortLabels.ddx"),
    documents: t("modeShortLabels.documents"),
  }
  const documentKindLabels: Record<HeroDemoDocumentKind, string> = {
    record: t("documents.kinds.record"),
    research: t("documents.kinds.research"),
    patientHandout: t("documents.kinds.patientHandout"),
  }
  const documentKindDescriptions: Record<HeroDemoDocumentKind, string> = {
    record: t("documents.descriptions.record"),
    research: t("documents.descriptions.research"),
    patientHandout: t("documents.descriptions.patientHandout"),
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
  const latestTranscriptEntry = visibleEntries[visibleEntries.length - 1] ?? null
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

  const representativeDdxCandidate = HERO_DEMO_DDX_STATE.candidates[0]
  const representativeDdxSupport = representativeDdxCandidate
    ? (HERO_DEMO_DDX_SUPPORT_BY_ID[representativeDdxCandidate.id] ?? null)
    : null

  const readyResourceCount = HERO_DEMO_FHIR_REVIEW_STATE.resources.filter(
    (resource) => resource.status === "Ready"
  ).length
  const needsReviewCount = HERO_DEMO_FHIR_REVIEW_STATE.resources.length - readyResourceCount

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
  }, [currentStepIndex, isInsightsMode, prefersReducedMotion, useMobileLayout])

  const panelBaseClass =
    "min-h-0 rounded-xl border border-border/70 bg-background/80 p-3 md:p-4"

  const renderRecordPreview = () => (
    <div className="space-y-3 pr-1">
      <header>
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
            <li key={item} className="flex items-start gap-2 text-[11px] text-foreground/90 md:text-xs">
              <span className="mt-[0.1rem] inline-flex size-3.5 items-center justify-center rounded border border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <Check className="size-2.5" />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )

  const renderResearchPreview = () => (
    <div className="space-y-3 pr-1">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold">{t("headings.research")}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground md:text-xs">
            {HERO_DEMO_RESEARCH_STATE.generatedAt}
          </p>
        </div>
        <p className="text-[10px] font-medium text-sky-700 dark:text-sky-300">
          {HERO_DEMO_RESEARCH_STATE.modelLabel}
        </p>
      </header>

      <div className="flex justify-end">
        <article className="max-w-[98%] rounded-2xl rounded-br-sm border border-primary/25 bg-primary/10 px-3 py-2 text-[11px] leading-relaxed md:text-xs">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary/80">
            {t("headings.userQuery")}
          </p>
          <p className="text-foreground/95">{HERO_DEMO_RESEARCH_STATE.userQuery}</p>
        </article>
      </div>

      <article className="research-markdown rounded-lg border border-border/70 bg-background/70 p-3 text-[11px] md:text-xs">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {HERO_DEMO_RESEARCH_STATE.assistantMarkdown}
        </ReactMarkdown>
      </article>
    </div>
  )

  const renderPatientHandoutPreview = () => (
    <div className="space-y-3 pr-1">
      <header className="flex items-center justify-between gap-3">
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
    </div>
  )

  const renderDesktopInsights = () => (
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
              <div key={entry.id} className={cn("flex", isDoctor ? "justify-end" : "justify-start")}>
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
  )

  const renderMobileInsights = () => (
    <section
      className={cn(
        panelBaseClass,
        styles.panelIn,
        "relative flex h-full min-h-0 flex-col overflow-hidden ring-1 ring-primary/35"
      )}
      aria-label={t("panels.insights")}
    >
      <div className="min-h-0 flex-1 overflow-y-auto pb-24 pr-1">
        <header className="mb-3 flex items-center gap-1.5">
          <Activity className="size-3.5 text-primary" />
          <h3 className="text-xs font-semibold">{t("headings.liveInsights")}</h3>
        </header>

        <div
          className={cn(
            "space-y-3 text-[11px]",
            styles.insightsTextRefresh,
            isPlaying && "insights-shimmer-overlay"
          )}
          key={currentStep.id}
        >
          <article className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("headings.summary")}
            </p>
            <p className="text-foreground/90">{currentStep.insights.summary}</p>
          </article>

          <article className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("headings.keyFindings")}
            </p>
            <ul className="space-y-2 text-foreground/90">
              {currentStep.insights.keyFindings.map((finding) => (
                <li key={finding} className="flex items-start gap-2">
                  <span className="mt-[0.32rem] size-1.5 rounded-full bg-emerald-500/80" />
                  <span>{finding}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("headings.redFlags")}
            </p>
            {currentStep.insights.redFlags.length === 0 ? (
              <p className="text-muted-foreground">{t("noCriticalWarningSigns")}</p>
            ) : (
              <ul className="space-y-2 text-foreground/90">
                {currentStep.insights.redFlags.map((flag) => (
                  <li key={flag} className="flex items-start gap-2">
                    <span className="mt-[0.32rem] size-1.5 rounded-full bg-red-500/80" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-xl border border-border/70 bg-background/70 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("headings.checklist")}
            </p>
            <ul className="space-y-2">
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
      </div>

      {latestTranscriptEntry ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3" aria-label={t("panels.transcript")}>
          <div
            ref={transcriptRef}
            className={cn(
              "flex",
              latestTranscriptEntry.speaker === "DOCTOR" ? "justify-end" : "justify-start"
            )}
          >
            <article
              className={cn(
                "max-w-[84%] rounded-2xl px-3 py-2 text-[10px] leading-relaxed shadow-[0_12px_30px_-18px_rgba(0,0,0,0.55)] backdrop-blur-md",
                latestTranscriptEntry.speaker === "DOCTOR"
                  ? "rounded-br-sm border border-primary/20 bg-primary/14 text-foreground"
                  : "rounded-bl-sm border border-white/30 bg-white/40 text-foreground dark:border-zinc-700/60 dark:bg-zinc-900/44"
              )}
            >
              <p>{latestTranscriptEntry.text}</p>
              <p
                className={cn(
                  "mt-1 text-[9px] font-medium",
                  latestTranscriptEntry.speaker === "DOCTOR"
                    ? "text-primary/75"
                    : "text-muted-foreground"
                )}
              >
                {speakerLabels[latestTranscriptEntry.speaker]}
              </p>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  )

  const renderDesktopDdx = () => (
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
                className={cn(styles.ddxCandidateButton, isSelected && styles.ddxCandidateButtonActive)}
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
          {selectedDdxSupport ? (
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
          ) : null}
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
                  <div key={ref.id} className="rounded-lg border border-border/70 bg-background/70 p-2.5">
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
  )

  const renderMobileDdx = () => (
    <section
      className={cn(
        panelBaseClass,
        styles.panelIn,
        "flex h-full min-h-0 flex-col overflow-y-auto ring-1 ring-amber-500/35"
      )}
      aria-label={t("panels.ddx")}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold">{t("headings.differentialDx")}</h3>
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
          {t("ddx.mobileSummaryTitle")}
        </span>
      </header>

      <article className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-3 text-[11px]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("headings.chiefConcern")}
            </p>
            <p className="mt-1 text-foreground/90">{HERO_DEMO_DDX_STATE.chiefConcern}</p>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              representativeDdxCandidate ? ddxLikelihoodClass(representativeDdxCandidate.likelihood) : ""
            )}
          >
            {representativeDdxCandidate
              ? likelihoodLabels[representativeDdxCandidate.likelihood]
              : null}
          </span>
        </div>

        {representativeDdxCandidate ? (
          <div className="mt-3 space-y-3">
            <div>
              <p className="font-semibold text-foreground">{representativeDdxCandidate.diagnosis}</p>
              <p className="mt-1 text-muted-foreground">{representativeDdxCandidate.rationale}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t("headings.nextStep")}
              </p>
              <p className="mt-1 text-foreground/90">{representativeDdxCandidate.nextStep}</p>
            </div>

            {representativeDdxSupport ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("ddx.immediateActions")}
                </p>
                <ul className="mt-2 space-y-2 text-foreground/90">
                  {representativeDdxSupport.immediateManagement.slice(0, 2).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[0.32rem] size-1.5 rounded-full bg-amber-500/80" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      <article className="mt-3 rounded-xl border border-border/70 bg-background/70 p-3 text-[11px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {t("headings.signal")}
        </p>
        <p className="mt-1 text-foreground/90">{HERO_DEMO_DDX_STATE.triageSignal}</p>
      </article>
    </section>
  )

  const renderDesktopDocuments = () => {
    const isRecordDocument = selectedDocumentKind === "record"

    return (
      <section
        className={cn(
          panelBaseClass,
          styles.panelIn,
          "flex h-full min-h-0 flex-col overflow-hidden ring-1 ring-teal-500/25"
        )}
        aria-label={t("panels.documents")}
      >
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("documents.currentDocument")}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-foreground">
              {documentKindLabels[selectedDocumentKind]}
            </h3>
          </div>
          <p className="text-[10px] text-muted-foreground">{t("headings.documents")}</p>
        </header>

        <div
          className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t("documents.selectorLabel")}
        >
          {HERO_DEMO_DOCUMENT_OPTIONS.map((option) => {
            const isActive = option.id === selectedDocumentKind
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDocumentKind(option.id)}
                className={cn(
                  "min-w-[11rem] rounded-xl border px-3 py-2 text-left transition-colors",
                  documentSelectorClass(option.id, isActive)
                )}
              >
                <p className="text-[11px] font-semibold">{documentKindLabels[option.id]}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {documentKindDescriptions[option.id]}
                </p>
              </button>
            )
          })}
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 gap-3",
            isRecordDocument ? "grid md:grid-cols-[minmax(0,1fr)_18rem]" : "flex"
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/70 bg-background/60 p-3">
            {selectedDocumentKind === "record" ? renderRecordPreview() : null}
            {selectedDocumentKind === "research" ? renderResearchPreview() : null}
            {selectedDocumentKind === "patientHandout" ? renderPatientHandoutPreview() : null}
          </div>

          {isRecordDocument ? (
            <aside className="flex min-h-0 flex-col overflow-y-auto rounded-xl border border-border/70 bg-background/60 p-3">
              <div className="rounded-lg border border-border/70 bg-background/80 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {t("documents.fhirSummaryTitle")}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {t("documents.resourceSummary", {
                    ready: readyResourceCount,
                    needsReview: needsReviewCount,
                  })}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {needsReviewCount > 0
                    ? t("documents.reviewNeeded")
                    : t("documents.syncReady")}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {HERO_DEMO_FHIR_REVIEW_STATE.resources.slice(0, 4).map((resource) => (
                  <article
                    key={resource.id}
                    className="rounded-lg border border-border/70 bg-background/70 p-2.5 text-[11px]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground">{resource.resourceType}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          resource.status === "Ready"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        )}
                      >
                        {fhirStatusLabels[resource.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{resource.summary}</p>
                  </article>
                ))}
              </div>

              <button
                type="button"
                className="mt-auto rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-emerald-700"
              >
                {t("documents.openSync")}
              </button>
            </aside>
          ) : null}
        </div>
      </section>
    )
  }

  const renderMobileDocuments = () => {
    const isRecordDocument = selectedDocumentKind === "record"

    return (
      <section
        className={cn(
          panelBaseClass,
          styles.panelIn,
          "flex h-full min-h-0 flex-col overflow-hidden ring-1 ring-teal-500/25"
        )}
        aria-label={t("panels.documents")}
      >
        <header className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {t("documents.currentDocument")}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-foreground">
            {documentKindLabels[selectedDocumentKind]}
          </h3>
        </header>

        <div
          className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t("documents.selectorLabel")}
        >
          {HERO_DEMO_DOCUMENT_OPTIONS.map((option) => {
            const isActive = option.id === selectedDocumentKind
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSelectedDocumentKind(option.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                  documentSelectorClass(option.id, isActive)
                )}
              >
                {documentKindLabels[option.id]}
              </button>
            )
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border/70 bg-background/60 p-3">
          {isRecordDocument ? (
            <article className="mb-3 rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {t("documents.fhirSummaryTitle")}
                  </p>
                  <p className="mt-1 font-medium text-foreground">
                    {t("documents.resourceSummary", {
                      ready: readyResourceCount,
                      needsReview: needsReviewCount,
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-emerald-500/35 bg-background/80 px-2.5 py-1 text-[10px] font-medium text-foreground"
                >
                  {t("documents.openSync")}
                </button>
              </div>
            </article>
          ) : null}

          {selectedDocumentKind === "record" ? renderRecordPreview() : null}
          {selectedDocumentKind === "research" ? renderResearchPreview() : null}
          {selectedDocumentKind === "patientHandout" ? renderPatientHandoutPreview() : null}
        </div>
      </section>
    )
  }

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
        className="relative flex h-[32rem] w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/85 text-left shadow-[0_30px_90px_-46px_oklch(0.24_0.03_45/0.65)] backdrop-blur-xl sm:h-[35rem] md:h-[38rem]"
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
          {activeMode === "insights" ? (useMobileLayout ? renderMobileInsights() : renderDesktopInsights()) : null}
          {activeMode === "ddx" ? (useMobileLayout ? renderMobileDdx() : renderDesktopDdx()) : null}
          {activeMode === "documents"
            ? useMobileLayout
              ? renderMobileDocuments()
              : renderDesktopDocuments()
            : null}
        </div>
      </section>
    </div>
  )
}
