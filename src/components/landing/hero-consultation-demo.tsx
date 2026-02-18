"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Activity, Check } from "lucide-react"
import {
  HERO_DEMO_STEP_INTERVAL_MS,
  HERO_DEMO_STEPS,
  type HeroDemoTranscriptEntry,
} from "./hero-consultation-demo-data"
import styles from "./hero-consultation-demo.module.css"

function speakerLabel(entry: HeroDemoTranscriptEntry) {
  return entry.speaker === "DOCTOR" ? "Dr" : "Pt"
}

export function HeroConsultationDemo() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const transcriptRef = useRef<HTMLDivElement | null>(null)

  const isPlaying = !prefersReducedMotion
  const playbackInterval = prefersReducedMotion
    ? HERO_DEMO_STEP_INTERVAL_MS * 2
    : HERO_DEMO_STEP_INTERVAL_MS

  const visibleEntries = useMemo(
    () => HERO_DEMO_STEPS.slice(0, currentStepIndex + 1).map((step) => step.transcript),
    [currentStepIndex]
  )

  const currentStep = HERO_DEMO_STEPS[currentStepIndex]

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")

    const updatePreference = () => {
      const reduced = media.matches
      setPrefersReducedMotion(reduced)
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
    const container = transcriptRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    })
  }, [currentStepIndex, prefersReducedMotion])

  return (
    <section
      aria-label="Rxly product simulation"
      className="relative mx-auto flex h-[34rem] w-full max-w-[74rem] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/85 text-left shadow-[0_30px_90px_-46px_oklch(0.24_0.03_45/0.65)] backdrop-blur-xl sm:h-[36rem] md:h-[38rem]"
    >
      <div className="flex items-center border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <p className="ml-2 text-xs font-medium text-foreground/90">
            Acute Appendicitis Session
          </p>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 p-3 md:grid-cols-2 md:gap-4 md:p-4">
        <section
          className={cn(
            "min-h-0 rounded-xl border border-border/70 bg-background/80 p-3 md:p-4",
            styles.panelIn,
            "flex flex-col ring-1 ring-primary/35"
          )}
          aria-label="Live insights panel"
        >
          <header className="mb-2 flex items-center">
            <div className="flex items-center gap-1.5">
              <Activity className="size-3.5 text-primary" />
              <h3 className="text-xs font-semibold">Live Insights</h3>
            </div>
          </header>

          <div
            className={cn(
              "flex-1 space-y-3 overflow-y-auto pr-1 text-[11px] md:text-xs",
              styles.panelIn
            )}
            key={currentStep.id}
          >
            <article>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Summary
              </p>
              <p className="text-foreground/90">{currentStep.insights.summary}</p>
            </article>

            <article>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Key Findings ({currentStep.insights.keyFindings.length})
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
                Red Flags ({currentStep.insights.redFlags.length})
              </p>
              {currentStep.insights.redFlags.length === 0 ? (
                <p className="text-muted-foreground">No critical warning signs yet.</p>
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
                Checklist
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
          className={cn(
            "min-h-0 rounded-xl border border-border/70 bg-background/80 p-3 md:p-4",
            styles.panelIn,
            "flex flex-col ring-1 ring-primary/20"
          )}
          aria-label="Transcript panel"
        >
          <header className="mb-2 flex items-center">
            <h3 className="text-xs font-semibold">Real-time Transcript</h3>
          </header>

          <div
            ref={transcriptRef}
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
          >
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
                        ? "rounded-tr-sm border border-primary/20 bg-primary/10 text-foreground"
                        : "rounded-sm bg-muted text-foreground"
                    )}
                  >
                    <p>{entry.text}</p>
                    <p
                      className={cn(
                        "mt-1 text-[10px] font-medium",
                        isDoctor ? "text-primary/75" : "text-muted-foreground"
                      )}
                    >
                      {speakerLabel(entry)}
                    </p>
                  </article>
                </div>
              )
            })}

            {isPlaying && (
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>listening</span>
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
    </section>
  )
}
