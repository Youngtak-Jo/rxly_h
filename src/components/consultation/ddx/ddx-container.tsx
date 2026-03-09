"use client"

import { useTranslations } from "next-intl"

import {
  DocumentShell,
} from "@/components/consultation/documents/document-shell"
import { useDdxStore } from "@/stores/ddx-store"
import { DiagnosisSection } from "./diagnosis-section"

export function DdxContainer() {
  const tTabs = useTranslations("ConsultationTabs")
  const tSupport = useTranslations("DiagnosisSupport")
  const diagnoses = useDdxStore((state) => state.diagnoses)
  const isProcessing = useDdxStore((state) => state.isProcessing)

  return (
    <div data-tour="ddx-panel">
      <DocumentShell
        ambientState={isProcessing ? "updating" : "idle"}
        footerMeta={
          diagnoses.length > 0 ? (
            <span>{tTabs("status.diagnosisCount", { count: diagnoses.length })}</span>
          ) : null
        }
        empty={!isProcessing && diagnoses.length === 0}
        emptyMessage={tSupport("emptyState")}
      >
        <DiagnosisSection />
      </DocumentShell>
    </div>
  )
}
