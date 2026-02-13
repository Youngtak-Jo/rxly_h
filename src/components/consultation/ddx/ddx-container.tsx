"use client"

import { useDdxStore } from "@/stores/ddx-store"
import { DiagnosisSection } from "./diagnosis-section"

export function DdxContainer() {
  const { diagnoses, isProcessing } = useDdxStore()

  const hasContent = diagnoses.length > 0

  return (
    <div className="space-y-6">
      {isProcessing && !hasContent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          Generating differential diagnosis...
        </div>
      )}

      {isProcessing && hasContent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <span className="h-2 w-2 rounded-full bg-orange-500" />
          Updating differential diagnosis...
        </div>
      )}

      <DiagnosisSection />
    </div>
  )
}
