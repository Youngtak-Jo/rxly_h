"use client"

import { Button } from "@/components/ui/button"
import { RecordSection } from "./record-section"
import { useRecordStore } from "@/stores/record-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useSessionStore } from "@/stores/session-store"
import { IconSparkles, IconLoader2 } from "@tabler/icons-react"

export function RecordContainer() {
  const { record, isGenerating, setRecord, setGenerating, updateField } =
    useRecordStore()
  const getFullTranscript = useTranscriptStore((s) => s.getFullTranscript)
  const summary = useInsightsStore((s) => s.summary)
  const keyFindings = useInsightsStore((s) => s.keyFindings)
  const activeSession = useSessionStore((s) => s.activeSession)

  const generateRecord = async () => {
    if (!activeSession) return
    const transcript = getFullTranscript()

    // Fetch doctor notes and image URLs for record generation
    let doctorNotes = ""
    let imageUrls: string[] = []
    try {
      const notesRes = await fetch(
        `/api/sessions/${activeSession.id}/notes`
      )
      if (notesRes.ok) {
        const notes = await notesRes.json()
        if (notes.length > 0) {
          doctorNotes = notes
            .map((n: { content: string }) => n.content)
            .filter(Boolean)
            .join("\n")
          imageUrls = notes.flatMap(
            (n: { imageUrls: string[] }) => n.imageUrls || []
          )
        }
      }
    } catch {
      // Continue without notes
    }

    // Need at least transcript, notes, or images to generate
    if (!transcript.trim() && !doctorNotes.trim() && imageUrls.length === 0) return

    setGenerating(true)
    try {

      const res = await fetch("/api/grok/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          doctorNotes,
          imageUrls,
          insights: { summary, keyFindings },
          sessionId: activeSession.id,
          existingRecord: record,
        }),
      })

      if (!res.ok) throw new Error("Failed to generate record")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No stream")

      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
      }

      // Parse the final accumulated JSON
      try {
        const parsed = JSON.parse(accumulated)
        setRecord({
          id: record?.id || "temp",
          sessionId: activeSession.id,
          date: new Date().toISOString(),
          patientName: activeSession.patientName,
          chiefComplaint: parsed.chiefComplaint || null,
          hpiText: parsed.hpiText || null,
          medications: parsed.medications || null,
          rosText: parsed.rosText || null,
          pmh: parsed.pmh || null,
          socialHistory: parsed.socialHistory || null,
          familyHistory: parsed.familyHistory || null,
          vitals: parsed.vitals || null,
          physicalExam: parsed.physicalExam || null,
          labsStudies: parsed.labsStudies || null,
          assessment: parsed.assessment || null,
          plan: parsed.plan || null,
        })
      } catch {
        console.error("Failed to parse record response")
        setGenerating(false)
      }
    } catch (error) {
      console.error("Failed to generate record:", error)
      setGenerating(false)
    }
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
    <div className="space-y-4">
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
          onClick={generateRecord}
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
              <div className="grid grid-cols-5 gap-2 text-sm">
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
