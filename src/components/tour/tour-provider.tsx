"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { driver, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import { useTourStore } from "@/stores/tour-store"
import { createTourSteps, waitForElement } from "@/data/tour/tour-steps"
import {
  captureSnapshot,
  restoreSnapshot,
  ensureTourSession,
  injectInsightsData,
  type TourSnapshot,
} from "@/data/tour/tour-dummy-data"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

export function TourProvider() {
  const t = useTranslations("Tour")
  const driverRef = useRef<Driver | null>(null)
  const snapshotRef = useRef<TourSnapshot | null>(null)
  const isActive = useTourStore((s) => s.isActive)

  useEffect(() => {
    if (!isActive) return

    // Capture current state before injecting tour data
    snapshotRef.current = captureSnapshot()

    // Ensure a session exists so the consultation layout renders
    ensureTourSession()

    // Small delay to let session state propagate and layout render
    const initTimer = setTimeout(() => {
      const steps = createTourSteps(driverRef, {
        steps: {
          insights: {
            title: t("steps.insights.title"),
            description: t("steps.insights.description"),
          },
          ddx: {
            title: t("steps.ddx.title"),
            description: t("steps.ddx.description"),
          },
          record: {
            title: t("steps.record.title"),
            description: t("steps.record.description"),
          },
          research: {
            title: t("steps.research.title"),
            description: t("steps.research.description"),
          },
          transcript: {
            title: t("steps.transcript.title"),
            description: t("steps.transcript.description"),
          },
          keywords: {
            title: t("steps.keywords.title"),
            description: t("steps.keywords.description"),
          },
          noteInput: {
            title: t("steps.noteInput.title"),
            description: t("steps.noteInput.description"),
          },
          toolbar: {
            title: t("steps.toolbar.title"),
            description: t("steps.toolbar.description"),
          },
          settings: {
            title: t("steps.settings.title"),
            description: t("steps.settings.description"),
          },
        },
      })

      const d = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: "black",
        overlayOpacity: 0.5,
        stagePadding: 10,
        stageRadius: 8,
        disableActiveInteraction: true,
        popoverClass: "rxly-tour-popover",
        progressText: t("progressText"),
        nextBtnText: t("next"),
        prevBtnText: t("previous"),
        doneBtnText: t("done"),
        steps,
        onDestroyed: () => {
          // Restore snapshot
          if (snapshotRef.current) {
            restoreSnapshot(snapshotRef.current)
            snapshotRef.current = null
          }
          useTourStore.getState().endTour()
        },
      })

      driverRef.current = d

      // Pre-initialize step 0: ensure insights tab is active and data is
      // injected before driver.js tries to find [data-tour="insights-panel"]
      useConsultationTabStore.getState().setActiveTab("insights")
      injectInsightsData()

      waitForElement('[data-tour="insights-panel"]', 800).then(() => {
        d.drive()
      })
    }, 200)

    return () => {
      clearTimeout(initTimer)
      if (driverRef.current) {
        // Restore snapshot on cleanup
        if (snapshotRef.current) {
          restoreSnapshot(snapshotRef.current)
          snapshotRef.current = null
        }
        driverRef.current.destroy()
        driverRef.current = null
      }
    }
  }, [isActive, t])

  return null
}
