import { describe, expect, it } from "vitest"
import { buildSampleTranscriptEntries } from "@/lib/sample-consultations/transcript"
import { SAMPLE_CONSULTATION_FIXTURE_PACK } from "@/lib/sample-consultations/fixture.generated"
import {
  SAMPLE_PUBLIC_TEMPLATE_IDS,
} from "@/lib/sample-consultations/source-config"
import { SAMPLE_PACK_VERSION } from "@/lib/sample-consultations/types"

describe("sample consultation fixture pack", () => {
  it("contains three fully populated example consultations", () => {
    expect(SAMPLE_CONSULTATION_FIXTURE_PACK.version).toBe(SAMPLE_PACK_VERSION)
    expect(SAMPLE_CONSULTATION_FIXTURE_PACK.generatedAt).not.toBe("")
    expect(SAMPLE_CONSULTATION_FIXTURE_PACK.samples).toHaveLength(3)

    for (const sample of SAMPLE_CONSULTATION_FIXTURE_PACK.samples) {
      const transcript = buildSampleTranscriptEntries({
        scenarioId: sample.scenarioId,
        sessionId: `test:${sample.key}`,
        startedAt: sample.startedAt,
      })

      expect(sample.sessionTitle.startsWith("Example ·")).toBe(true)
      expect(sample.patientName).not.toBe("")
      expect(transcript.entries.length).toBeGreaterThan(0)

      expect(sample.insights.summary).not.toBe("")
      expect(sample.insights.keyFindings.length).toBeGreaterThan(0)
      expect(sample.insights.checklistItems.length).toBeGreaterThan(0)
      expect(sample.insights.metadata.modelId).not.toBe("")
      expect(sample.insights.metadata.promptFamily).toBe("insights")

      expect(sample.diagnoses).toHaveLength(3)
      expect(sample.diagnoses.every((diagnosis) => diagnosis.icdCode.length > 0)).toBe(
        true
      )

      expect(sample.research).toHaveLength(3)
      expect(sample.research.every((exchange) => exchange.answer.length > 0)).toBe(true)
      expect(sample.research.every((exchange) => exchange.citations.length > 0)).toBe(
        true
      )

      expect(sample.record.chiefComplaint ?? sample.record.hpiText).toBeTruthy()
      expect(sample.record.metadata.promptFamily).toBe("record")

      expect(sample.patientHandout.conditions.length).toBeGreaterThan(0)
      expect(sample.patientHandout.entries.length).toBe(
        sample.patientHandout.conditions.length
      )
      expect(sample.patientHandout.metadata.promptFamily).toBe("patient-handout")

      expect(sample.documents).toHaveLength(3)
      expect(sample.documents.map((document) => document.templateId)).toEqual(
        SAMPLE_PUBLIC_TEMPLATE_IDS
      )
      expect(
        sample.documents.every((document) => document.metadata.promptFamily === "document")
      ).toBe(true)
    }
  })
})
