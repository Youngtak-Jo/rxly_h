"use client"

import { useEffect, useRef } from "react"
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
      const steps = createTourSteps(driverRef)

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
        progressText: "{{current}} / {{total}}",
        nextBtnText: "Next",
        prevBtnText: "Previous",
        doneBtnText: "Done",
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
  }, [isActive])

  return null
}
