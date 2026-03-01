"use client"

import { useLocale, useTimeZone, useTranslations } from "next-intl"
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
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatDateTime } from "@/i18n/format"

export function FhirBundleReview() {
  const t = useTranslations("FhirBundleReview")
  const editedBundle = useMedplumSyncStore((s) => s.editedBundle)
  const status = useMedplumSyncStore((s) => s.status)
  const createdResources = useMedplumSyncStore((s) => s.createdResources)
  const errorMessage = useMedplumSyncStore((s) => s.errorMessage)

  if (status === "success") {
    return (
      <div className="rounded-md border bg-muted/50 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-600">
          <IconCheck className="size-4" />
          {t("createdResources", { count: createdResources.length })}
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
  const t = useTranslations("FhirBundleReview")
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
          <span>{t("patient")}</span>
          {isEmpty ? (
            <Badge variant="destructive" className="text-[10px]">
              {t("nameMissing")}
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
            <Label htmlFor="patient-given">{t("givenName")}</Label>
            <Input
              id="patient-given"
              placeholder={t("placeholders.firstName")}
              defaultValue={currentGiven}
              onBlur={(e) =>
                updatePatientName(e.target.value, currentFamily)
              }
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="patient-family">{t("familyName")}</Label>
            <Input
              id="patient-family"
              placeholder={t("placeholders.lastName")}
              defaultValue={currentFamily}
              onBlur={(e) =>
                updatePatientName(currentGiven, e.target.value)
              }
            />
          </div>
        </div>
        {patient?.gender && (
          <div className="mt-2 text-xs text-muted-foreground">
            {t("gender")}: {patient.gender}
          </div>
        )}
        {patient?.birthDate && (
          <div className="text-xs text-muted-foreground">
            {t("birthDate")}: {patient.birthDate}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

// --- Encounter Section ---

function EncounterSection({ entries }: { entries: BundleEntry[] }) {
  const t = useTranslations("FhirBundleReview")
  const locale = useLocale() as UiLocale
  const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const encounter = entries[0]?.resource as any
  return (
    <AccordionItem value="Encounter">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>{t("encounter")}</span>
          <Badge variant="secondary">{encounter?.status || t("unknownStatus")}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-1.5 text-sm">
          {encounter?.reasonCode?.[0]?.text && (
            <div>
              <span className="text-muted-foreground">{t("reason")}: </span>
              {encounter.reasonCode[0].text}
            </div>
          )}
          {encounter?.period?.start && (
            <div>
              <span className="text-muted-foreground">{t("period")}: </span>
              {formatDateTime(encounter.period.start, locale, timeZone)} -{" "}
              {encounter.period.end
                ? formatDateTime(encounter.period.end, locale, timeZone)
                : t("ongoing")}
            </div>
          )}
          {encounter?.class?.display && (
            <div>
              <span className="text-muted-foreground">{t("class")}: </span>
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
  const t = useTranslations("FhirBundleReview")
  return (
    <AccordionItem value="Condition">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>{t("conditions")}</span>
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
                  {c?.code?.text || t("unknown")}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c?.code?.coding?.[0]?.code && (
                    <span>{t("verificationIcd")}: {c.code.coding[0].code}</span>
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
  const t = useTranslations("FhirBundleReview")
  return (
    <AccordionItem value="Observation">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>{t("observations")}</span>
          <Badge variant="secondary">{entries.length}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-2">
          {entries.map((entry, i) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const obs = entry.resource as any
            const display = obs?.code?.coding?.[0]?.display || t("observation")
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
  const t = useTranslations("FhirBundleReview")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const impression = entries[0]?.resource as any
  return (
    <AccordionItem value="ClinicalImpression">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>{t("clinicalImpression")}</span>
          <Badge variant="secondary">{impression?.status || t("unknownStatus")}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid gap-2 text-sm">
          {impression?.summary && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {t("summary")}
              </div>
              <p>{impression.summary}</p>
            </div>
          )}
          {impression?.finding?.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {t("findings")}
              </div>
              <ul className="list-inside list-disc text-xs">
                {impression.finding.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (f: any, i: number) => (
                    <li key={i}>
                      {f.itemCodeableConcept?.text || t("finding")}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}
          {impression?.note?.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {t("redFlags")}
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
  const t = useTranslations("FhirBundleReview")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const composition = entries[0]?.resource as any
  const sections = composition?.section || []

  return (
    <AccordionItem value="Composition">
      <AccordionTrigger>
        <div className="flex items-center gap-2">
          <span>{t("consultationRecord")}</span>
          <Badge variant="secondary">{t("sections", { count: sections.length })}</Badge>
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
