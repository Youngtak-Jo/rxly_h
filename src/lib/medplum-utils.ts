import type { Resource } from "@medplum/fhirtypes"

export interface ClinicalDataInput {
  session: { title?: string; patientName?: string; startedAt?: string; endedAt?: string }
  record?: {
    patientName?: string
    chiefComplaint?: string
    hpiText?: string
    medications?: string
    rosText?: string
    pmh?: string
    socialHistory?: string
    familyHistory?: string
    vitals?: { bp?: string; hr?: string; temp?: string; rr?: string; spo2?: string }
    physicalExam?: string
    labsStudies?: string
    assessment?: string
    plan?: string
  }
  insights?: { summary?: string; keyFindings?: string[]; redFlags?: string[] }
  diagnoses?: { icdCode: string; diseaseName: string; confidence: string; evidence: string }[]
  transcript?: string
}

export function buildClinicalDataPrompt(data: ClinicalDataInput): string {
  const parts: string[] = []

  parts.push("=== SESSION INFO ===")
  parts.push(`Title: ${data.session.title || "Consultation"}`)
  parts.push(`Patient Name: ${data.record?.patientName || data.session.patientName || "Unknown"}`)
  if (data.session.startedAt) parts.push(`Start: ${data.session.startedAt}`)
  if (data.session.endedAt) parts.push(`End: ${data.session.endedAt}`)

  if (data.record) {
    parts.push("\n=== CONSULTATION RECORD ===")
    if (data.record.chiefComplaint) parts.push(`Chief Complaint: ${data.record.chiefComplaint}`)
    if (data.record.hpiText) parts.push(`HPI: ${data.record.hpiText}`)
    if (data.record.pmh) parts.push(`Past Medical History: ${data.record.pmh}`)
    if (data.record.medications) parts.push(`Medications: ${data.record.medications}`)
    if (data.record.rosText) parts.push(`Review of Systems: ${data.record.rosText}`)
    if (data.record.socialHistory) parts.push(`Social History: ${data.record.socialHistory}`)
    if (data.record.familyHistory) parts.push(`Family History: ${data.record.familyHistory}`)
    if (data.record.physicalExam) parts.push(`Physical Exam: ${data.record.physicalExam}`)
    if (data.record.labsStudies) parts.push(`Labs/Studies: ${data.record.labsStudies}`)
    if (data.record.assessment) parts.push(`Assessment: ${data.record.assessment}`)
    if (data.record.plan) parts.push(`Plan: ${data.record.plan}`)

    if (data.record.vitals) {
      const v = data.record.vitals
      parts.push("\n=== VITALS ===")
      if (v.bp) parts.push(`Blood Pressure: ${v.bp}`)
      if (v.hr) parts.push(`Heart Rate: ${v.hr}`)
      if (v.temp) parts.push(`Temperature: ${v.temp}`)
      if (v.rr) parts.push(`Respiratory Rate: ${v.rr}`)
      if (v.spo2) parts.push(`SpO2: ${v.spo2}`)
    }
  }

  if (data.insights) {
    parts.push("\n=== CLINICAL INSIGHTS ===")
    if (data.insights.summary) parts.push(`Summary: ${data.insights.summary}`)
    if (data.insights.keyFindings?.length) {
      parts.push(`Key Findings: ${JSON.stringify(data.insights.keyFindings)}`)
    }
    if (data.insights.redFlags?.length) {
      parts.push(`Red Flags: ${JSON.stringify(data.insights.redFlags)}`)
    }
  }

  if (data.diagnoses?.length) {
    parts.push("\n=== DIAGNOSES ===")
    data.diagnoses.forEach((dx, i) => {
      parts.push(`${i + 1}. [${dx.icdCode}] ${dx.diseaseName} (${dx.confidence}) - ${dx.evidence}`)
    })
  }

  if (data.transcript) {
    parts.push("\n=== TRANSCRIPT (last 2000 chars) ===")
    parts.push(data.transcript.slice(-2000))
  }

  return parts.join("\n")
}

export function resolveReferences(
  resource: Resource,
  uuidToId: Record<string, string>
): Resource {
  const json = JSON.stringify(resource)
  const resolved = json.replace(
    /urn:uuid:[a-zA-Z0-9-]+/g,
    (match) => uuidToId[match] || match
  )
  return JSON.parse(resolved)
}

export function getResourceDisplay(resource: Resource): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = resource as any
  switch (resource.resourceType) {
    case "Patient": {
      const names = r.name as { given?: string[]; family?: string }[] | undefined
      if (names?.[0]) {
        const given = names[0].given?.join(" ") || ""
        return `${given} ${names[0].family || ""}`.trim()
      }
      return "Patient"
    }
    case "Encounter":
      return r.reasonCode?.[0]?.text || "Encounter"
    case "Condition":
      return r.code?.text || "Condition"
    case "Observation":
      return r.code?.coding?.[0]?.display || "Observation"
    case "ClinicalImpression":
      return "Clinical Impression"
    case "Composition":
      return r.title || "Composition"
    default:
      return resource.resourceType
  }
}
