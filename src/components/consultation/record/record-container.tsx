"use client"

import { Button } from "@/components/ui/button"
import { RecordSection } from "./record-section"
import { useRecordStore } from "@/stores/record-store"
import { useSessionStore } from "@/stores/session-store"
import { generateRecord } from "@/hooks/use-live-record"

import { IconSparkles, IconLoader2 } from "@tabler/icons-react"

export function RecordContainer() {
  const { record, isGenerating, updateField } = useRecordStore()
  const activeSession = useSessionStore((s) => s.activeSession)

  const handleGenerate = () => {
    if (!activeSession || isGenerating) return
    generateRecord(
      activeSession.id,
      activeSession.patientName,
      record?.id
    )
  }

  const toStr = (val: unknown): string => {
    if (val == null) return ""
    if (typeof val === "string") return val
    if (Array.isArray(val)) return val.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n")
    if (typeof val === "object") return JSON.stringify(val, null, 2)
    return String(val)
  }

  const sections = [
    { key: "chiefComplaint", title: "Chief Complaint" },
    { key: "hpiText", title: "History of Present Illness (HPI)" },
    { key: "medications", title: "Current Medications" },
    { key: "rosText", title: "Review of Systems (ROS)" },
    { key: "pmh", title: "Past Medical History (PMH)" },
    { key: "socialHistory", title: "Social History" },
    { key: "familyHistory", title: "Family History" },
    { key: "physicalExam", title: "Physical Exam" },
    { key: "labsStudies", title: "Labs / Studies" },
    { key: "assessment", title: "Assessment" },
    { key: "plan", title: "Plan" },
  ] as const

  return (
    <div data-tour="record-panel" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Consultation Record</h3>
          {record && (
            <p className="text-xs text-muted-foreground">
              {activeSession?.patientName || "Unknown Patient"} &middot;{" "}
              {new Date(record.date).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          size="sm"
          className="gap-1.5"
        >
          {isGenerating ? (
            <IconLoader2 key="loader" className="size-3.5 animate-spin" />
          ) : (
            <IconSparkles key="sparkles" className="size-3.5" />
          )}
          {isGenerating ? "Generating..." : record ? "Regenerate" : "Generate Record"}
        </Button>
      </div>

      {isGenerating && !record && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Generating consultation record...
        </div>
      )}

      {isGenerating && record && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Updating consultation record...
        </div>
      )}

      {!record && !isGenerating && (
        <p className="text-sm text-muted-foreground/50 italic text-center py-8">
          Click &ldquo;Generate Record&rdquo; to create a structured consultation
          record from the transcript.
        </p>
      )}

      {(record || isGenerating) && (
        <div className="space-y-3">
          {record?.vitals && (
            <div className="rounded-lg border p-3">
              <h4 className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                Vitals
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
                {Object.entries(record.vitals).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {key}
                    </p>
                    <p className="font-mono text-xs">
                      {(value as string) || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.map(({ key, title }) => (
            <RecordSection
              key={key}
              title={title}
              value={toStr(record?.[key])}
              onChange={(value) => updateField(key, value)}
              isLoading={isGenerating && !record}
            />
          ))}
        </div>
      )}
    </div>
  )
}
