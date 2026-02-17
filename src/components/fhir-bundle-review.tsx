"use client"

import { useMedplumSyncStore } from "@/stores/medplum-sync-store"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { IconCheck, IconAlertTriangle } from "@tabler/icons-react"
import type { BundleEntry } from "@medplum/fhirtypes"

export function FhirBundleReview() {
  const editedBundle = useMedplumSyncStore((s) => s.editedBundle)
  const status = useMedplumSyncStore((s) => s.status)
  const createdResources = useMedplumSyncStore((s) => s.createdResources)
  const errorMessage = useMedplumSyncStore((s) => s.errorMessage)

  if (status === "success") {
    return (
      <div className="rounded-md border bg-muted/50 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-600">
          <IconCheck className="size-4" />
          Created {createdResources.length} FHIR resources
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground">
          {createdResources.map((r) => (
            <div key={r.id} className="flex items-center justify-between">
              <span>
                {r.resourceType}: {r.display || r.id}
              </span>
              <code className="text-[10px]">{r.id.slice(0, 8)}...</code>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <IconAlertTriangle className="size-4" />
          {errorMessage}
        </div>
      </div>
    )
  }

  if (!editedBundle?.entry) return null

  const grouped = groupEntries(editedBundle.entry as BundleEntry[])

  return (
    <Accordion type="multiple" className="w-full">
      {grouped.Patient && <PatientSection entries={grouped.Patient} />}
      {grouped.Encounter && <EncounterSection entries={grouped.Encounter} />}
      {grouped.Condition && (
        <ConditionSection entries={grouped.Condition} />
      )}
      {grouped.Observation && (
        <ObservationSection entries={grouped.Observation} />
      )}
      {grouped.ClinicalImpression && (
        <ClinicalImpressionSection entries={grouped.ClinicalImpression} />
      )}
      {grouped.Composition && (
        <CompositionSection entries={grouped.Composition} />
      )}
    </Accordion>
  )
}

function groupEntries(entries: BundleEntry[]) {
  const grouped: Record<string, BundleEntry[]> = {}
  for (const entry of entries) {
    const type = entry.resource?.resourceType
    if (!type) continue
    if (!grouped[type]) grouped[type] = []
    grouped[type].push(entry)
  }
  return grouped
}

// --- Patient Section (editable name) ---

function PatientSection({ entries }: { entries: BundleEntry[] }) {
  const updatePatientName = useMedplumSyncStore((s) => s.updatePatientName)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patient = entries[0]?.resource as any
  const currentGiven = patient?.name?.[0]?.given?.join(" ") || ""
  const currentFamily = patient?.name?.[0]?.family || ""
  const isEmpty = !currentGiven && !currentFamily

  return (
    <AccordionItem value="Patient">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>Patient</span>
          {isEmpty ? (
            <Badge variant="destructive" className="text-[10px]">
              Name missing
            </Badge>
          ) : (
            <Badge variant="secondary">
              {currentGiven} {currentFamily}
            </Badge>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="patient-given">Given Name</Label>
            <Input
              id="patient-given"
              placeholder="Enter first name"
              defaultValue={currentGiven}
              onBlur={(e) =>
                updatePatientName(e.target.value, currentFamily)
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="patient-family">Family Name</Label>
            <Input
              id="patient-family"
              placeholder="Enter last name"
              defaultValue={currentFamily}
              onBlur={(e) =>
                updatePatientName(currentGiven, e.target.value)
              }
            />
          </div>
        </div>
        {patient?.gender && (
          <div className="mt-2 text-xs text-muted-foreground">
            Gender: {patient.gender}
          </div>
        )}
        {patient?.birthDate && (
          <div className="text-xs text-muted-foreground">
            Birth Date: {patient.birthDate}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

// --- Encounter Section ---

function EncounterSection({ entries }: { entries: BundleEntry[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const encounter = entries[0]?.resource as any
  return (
    <AccordionItem value="Encounter">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>Encounter</span>
          <Badge variant="secondary">{encounter?.status || "unknown"}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-1.5 text-sm">
          {encounter?.reasonCode?.[0]?.text && (
            <div>
              <span className="text-muted-foreground">Reason: </span>
              {encounter.reasonCode[0].text}
            </div>
          )}
          {encounter?.period?.start && (
            <div>
              <span className="text-muted-foreground">Period: </span>
              {new Date(encounter.period.start).toLocaleString()} —{" "}
              {encounter.period.end
                ? new Date(encounter.period.end).toLocaleString()
                : "ongoing"}
            </div>
          )}
          {encounter?.class?.display && (
            <div>
              <span className="text-muted-foreground">Class: </span>
              {encounter.class.display}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// --- Condition Section ---

function ConditionSection({ entries }: { entries: BundleEntry[] }) {
  return (
    <AccordionItem value="Condition">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>Conditions</span>
          <Badge variant="secondary">{entries.length}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-2">
          {entries.map((entry, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const c = entry.resource as any
            return (
              <div key={i} className="rounded-md border p-2.5 text-sm">
                <div className="font-medium">
                  {c?.code?.text || "Unknown"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c?.code?.coding?.[0]?.code && (
                    <span>ICD: {c.code.coding[0].code}</span>
                  )}
                  {c?.verificationStatus?.coding?.[0]?.code && (
                    <span> | {c.verificationStatus.coding[0].code}</span>
                  )}
                </div>
                {c?.note?.[0]?.text && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {c.note[0].text}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// --- Observation Section ---

function ObservationSection({ entries }: { entries: BundleEntry[] }) {
  return (
    <AccordionItem value="Observation">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>Observations</span>
          <Badge variant="secondary">{entries.length}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-2">
          {entries.map((entry, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obs = entry.resource as any
            const display = obs?.code?.coding?.[0]?.display || "Observation"
            const value = obs?.valueQuantity
              ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit || ""}`
              : obs?.component
                ? obs.component
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((c: any) =>
                      c.valueQuantity
                        ? `${c.code?.coding?.[0]?.display || ""}: ${c.valueQuantity.value} ${c.valueQuantity.unit || ""}`
                        : null
                    )
                    .filter(Boolean)
                    .join(", ")
                : ""
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border p-2.5 text-sm"
              >
                <span>{display}</span>
                <span className="font-mono text-xs">{value}</span>
              </div>
            )
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// --- ClinicalImpression Section ---

function ClinicalImpressionSection({ entries }: { entries: BundleEntry[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const impression = entries[0]?.resource as any
  return (
    <AccordionItem value="ClinicalImpression">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>Clinical Impression</span>
          <Badge variant="secondary">{impression?.status || "unknown"}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-2 text-sm">
          {impression?.summary && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Summary
              </div>
              <p>{impression.summary}</p>
            </div>
          )}
          {impression?.finding?.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Findings
              </div>
              <ul className="list-inside list-disc text-xs">
                {impression.finding.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (f: any, i: number) => (
                    <li key={i}>
                      {f.itemCodeableConcept?.text || "Finding"}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
          {impression?.note?.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Red Flags
              </div>
              <ul className="list-inside list-disc text-xs text-destructive">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {impression.note.map((n: any, i: number) => (
                  <li key={i}>{n.text}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

// --- Composition Section ---

function CompositionSection({ entries }: { entries: BundleEntry[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const composition = entries[0]?.resource as any
  const sections = composition?.section || []

  return (
    <AccordionItem value="Composition">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>Consultation Record</span>
          <Badge variant="secondary">{sections.length} sections</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {sections.map((section: any, i: number) => {
            const htmlContent = section.text?.div || ""
            // Strip outer div tags for cleaner display
            const cleanContent = htmlContent
              .replace(/<div[^>]*>/, "")
              .replace(/<\/div>$/, "")
            return (
              <div key={i} className="rounded-md border p-2.5">
                <div className="text-xs font-medium text-muted-foreground">
                  {section.title}
                </div>
                <div className="mt-1 text-sm">{cleanContent}</div>
              </div>
            )
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
