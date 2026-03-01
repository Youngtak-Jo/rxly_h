import type { DriveStep, Driver } from "driver.js"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import {
  injectDdxData,
  injectRecordData,
  injectResearchData,
  injectTranscriptData,
  injectKeywords,
} from "./tour-dummy-data"

// ---------------------------------------------------------------------------
// Utility: wait for a DOM element to appear (up to timeout ms)
// ---------------------------------------------------------------------------
export function waitForElement(
  selector: string,
  timeout = 600
): Promise<Element | null> {
  return new Promise((resolve) => {
    const existing = document.querySelector(selector)
    if (existing) {
      resolve(existing)
      return
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) {
        observer.disconnect()
        clearTimeout(timer)
        resolve(el)
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    const timer = setTimeout(() => {
      observer.disconnect()
      resolve(document.querySelector(selector))
    }, timeout)
  })
}

export interface TourCopy {
  steps: {
    insights: { title: string; description: string }
    ddx: { title: string; description: string }
    record: { title: string; description: string }
    research: { title: string; description: string }
    transcript: { title: string; description: string }
    keywords: { title: string; description: string }
    noteInput: { title: string; description: string }
    toolbar: { title: string; description: string }
    settings: { title: string; description: string }
  }
}

export function createTourSteps(
  driverRef: { current: Driver | null },
  copy: TourCopy
): DriveStep[] {
  return [
    {
      element: '[data-tour="insights-panel"]',
      popover: {
        title: copy.steps.insights.title,
        description: copy.steps.insights.description,
        side: "right" as const,
        align: "center" as const,
        onNextClick: () => {
          useConsultationTabStore.getState().setActiveTab("ddx")
          injectDdxData()
          waitForElement('[data-tour="ddx-panel"]').then(() => {
            driverRef.current?.moveNext()
          })
        },
      },
    },
    {
      element: '[data-tour="ddx-panel"]',
      popover: {
        title: copy.steps.ddx.title,
        description: copy.steps.ddx.description,
        side: "right" as const,
        align: "center" as const,
        onNextClick: () => {
          useConsultationTabStore.getState().setActiveTab("record")
          injectRecordData()
          waitForElement('[data-tour="record-panel"]').then(() => {
            driverRef.current?.moveNext()
          })
        },
        onPrevClick: () => {
          useConsultationTabStore.getState().setActiveTab("insights")
          waitForElement('[data-tour="insights-panel"]').then(() => {
            driverRef.current?.movePrevious()
          })
        },
      },
    },
    {
      element: '[data-tour="record-panel"]',
      popover: {
        title: copy.steps.record.title,
        description: copy.steps.record.description,
        side: "right" as const,
        align: "center" as const,
        onNextClick: () => {
          useConsultationTabStore.getState().setActiveTab("research")
          injectResearchData()
          waitForElement('[data-tour="research-panel"]').then(() => {
            driverRef.current?.moveNext()
          })
        },
        onPrevClick: () => {
          useConsultationTabStore.getState().setActiveTab("ddx")
          waitForElement('[data-tour="ddx-panel"]').then(() => {
            driverRef.current?.movePrevious()
          })
        },
      },
    },
    {
      element: '[data-tour="research-panel"]',
      popover: {
        title: copy.steps.research.title,
        description: copy.steps.research.description,
        side: "right" as const,
        align: "center" as const,
        onNextClick: () => {
          useConsultationTabStore.getState().setActiveTab("insights")
          const tabStore = useConsultationTabStore.getState()
          if (tabStore.isTranscriptCollapsed && tabStore._toggleTranscript) {
            tabStore._toggleTranscript()
          }
          injectTranscriptData()
          waitForElement('[data-tour="transcript-viewer"]').then(() => {
            driverRef.current?.moveNext()
          })
        },
        onPrevClick: () => {
          useConsultationTabStore.getState().setActiveTab("record")
          waitForElement('[data-tour="record-panel"]').then(() => {
            driverRef.current?.movePrevious()
          })
        },
      },
    },
    {
      element: '[data-tour="transcript-viewer"]',
      popover: {
        title: copy.steps.transcript.title,
        description: copy.steps.transcript.description,
        side: "left" as const,
        align: "center" as const,
        onPrevClick: () => {
          useConsultationTabStore.getState().setActiveTab("research")
          waitForElement('[data-tour="research-panel"]').then(() => {
            driverRef.current?.movePrevious()
          })
        },
      },
    },
    {
      element: '[data-tour="transcript-viewer"]',
      popover: {
        title: copy.steps.keywords.title,
        description: copy.steps.keywords.description,
        side: "left" as const,
        align: "center" as const,
      },
      onHighlightStarted: () => {
        injectKeywords()
      },
    },
    {
      element: '[data-tour="note-input"]',
      popover: {
        title: copy.steps.noteInput.title,
        description: copy.steps.noteInput.description,
        side: "top" as const,
        align: "center" as const,
      },
    },
    {
      element: '[data-tour="header-actions"]',
      popover: {
        title: copy.steps.toolbar.title,
        description: copy.steps.toolbar.description,
        side: "bottom" as const,
        align: "end" as const,
      },
    },
    {
      element: '[data-tour="settings-btn"]',
      popover: {
        title: copy.steps.settings.title,
        description: copy.steps.settings.description,
        side: "right" as const,
        align: "center" as const,
      },
    },
  ]
}
