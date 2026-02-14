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

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------
export function createTourSteps(driverRef: { current: Driver | null }): DriveStep[] {
  return [
    // ── Step 0: Live Insights ────────────────────────────────────────────
    {
      element: '[data-tour="insights-panel"]',
      popover: {
        title: "Live Insights",
        description:
          "As the consultation progresses, AI generates a real-time summary, key findings, red flags, and an action checklist.\n\nSelect text by dragging to leave inline comments — the AI will re-analyze based on your feedback.",
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

    // ── Step 1: Differential Diagnosis ───────────────────────────────────
    {
      element: '[data-tour="ddx-panel"]',
      popover: {
        title: "Differential Diagnosis",
        description:
          "AI generates a differential diagnosis list with ICD-11 codes, confidence levels (high/moderate/low), and supporting evidence.\n\nClick a diagnosis card to view diagnostic criteria, recommended tests, treatment options, and references.",
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

    // ── Step 2: Consultation Record ──────────────────────────────────────
    {
      element: '[data-tour="record-panel"]',
      popover: {
        title: "Consultation Record",
        description:
          "A structured medical record is automatically generated from the conversation.\n\nAll fields — chief complaint, HPI, medications, ROS, past history, vitals — are editable. Use the regenerate button at the top to rebuild the record at any time.",
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

    // ── Step 3: Research ─────────────────────────────────────────────────
    {
      element: '[data-tour="research-panel"]',
      popover: {
        title: "Research",
        description:
          "Ask AI medical questions based on the current consultation context.\n\nIt searches medical databases including PubMed, ICD-11, and Europe PMC to provide evidence-based answers with citations.",
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

    // ── Step 4: Transcript (speaker recognition) ─────────────────────────
    {
      element: '[data-tour="transcript-viewer"]',
      popover: {
        title: "Live Voice Transcription",
        description:
          "Speech is transcribed to text in real time.\n\nAfter 3 or more utterances, speakers are automatically identified and separated into doctor and patient. Patient speech appears on the left, doctor speech on the right.",
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

    // ── Step 5: Keyword highlighting ────────────────────────────────────
    {
      element: '[data-tour="transcript-viewer"]',
      popover: {
        title: "Diagnostic Keyword Highlighting",
        description:
          "When recording ends, AI automatically identifies clinically significant terms and color-codes them.\n\n🔴 Symptoms  🔵 Diagnoses  🟢 Medications  🟠 Findings  🟣 Vitals",
        side: "left" as const,
        align: "center" as const,
      },
      onHighlightStarted: () => {
        injectKeywords()
      },
    },

    // ── Step 6: Note input ──────────────────────────────────────────────
    {
      element: '[data-tour="note-input"]',
      popover: {
        title: "Send Notes",
        description:
          "Type text notes or attach medical images (X-rays, lab results, etc.).\n\nNotes appear in the timeline, and when sent, AI re-analyzes insights and differential diagnoses.",
        side: "top" as const,
        align: "center" as const,
      },
    },

    // ── Step 7: Header action buttons ───────────────────────────────────
    {
      element: '[data-tour="header-actions"]',
      popover: {
        title: "Toolbar",
        description:
          "• Collapse / expand the transcript panel\n• Download PDF and send via email\n• Configure knowledge connectors (PubMed, ICD-11, etc.)\n• Test the pipeline with simulations",
        side: "bottom" as const,
        align: "end" as const,
      },
    },

    // ── Step 8: Settings ────────────────────────────────────────────────
    {
      element: '[data-tour="settings-btn"]',
      popover: {
        title: "Settings",
        description:
          "Configure speech recognition language, audio processing options (noise suppression, echo cancellation), and theme (light/dark).\n\nChanges take effect from the next recording session.",
        side: "right" as const,
        align: "center" as const,
      },
    },
  ]
}
