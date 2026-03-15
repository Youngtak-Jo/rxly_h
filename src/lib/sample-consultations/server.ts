import { randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  ensureBuiltInDocumentTemplates,
  legacyPatientHandoutToSessionDocumentContent,
  legacyRecordToSessionDocumentContent,
} from "@/lib/documents/server"
import {
  BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
  BUILT_IN_RECORD_TEMPLATE_ID,
  DEFAULT_DOCUMENT_TEMPLATE_IDS,
  DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY,
} from "@/lib/documents/constants"
import { SAMPLE_CONSULTATION_FIXTURE_PACK } from "@/lib/sample-consultations/fixture.generated"
import { SAMPLE_PUBLIC_TEMPLATE_IDS } from "@/lib/sample-consultations/source-config"
import { buildSampleTranscriptEntries } from "@/lib/sample-consultations/transcript"
import { SAMPLE_PACK_VERSION } from "@/lib/sample-consultations/types"

const sampleConsultationBootstrapInFlight = new Map<string, Promise<void>>()
const SAMPLE_PACK_SEEDING_VERSION = -1
const SAMPLE_PACK_CLAIM_STALE_AFTER_MS = 10 * 60_000

function assertFixturePackIsReady() {
  if (SAMPLE_CONSULTATION_FIXTURE_PACK.version !== SAMPLE_PACK_VERSION) {
    throw new Error("Sample consultation fixture pack version mismatch")
  }
}

function buildTemplateIdSet(): string[] {
  return [...new Set([...DEFAULT_DOCUMENT_TEMPLATE_IDS, ...SAMPLE_PUBLIC_TEMPLATE_IDS])]
}

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

export async function ensureSampleConsultationsForUser(userId: string): Promise<void> {
  const existingBootstrap = sampleConsultationBootstrapInFlight.get(userId)
  if (existingBootstrap) {
    return existingBootstrap
  }

  const bootstrapPromise = ensureSampleConsultationsForUserInternal(userId).finally(() => {
    sampleConsultationBootstrapInFlight.delete(userId)
  })

  sampleConsultationBootstrapInFlight.set(userId, bootstrapPromise)
  return bootstrapPromise
}

async function ensureSampleConsultationsForUserInternal(
  userId: string
): Promise<void> {
  assertFixturePackIsReady()

  const bootstrapState = await prisma.userBootstrapState.findUnique({
    where: { userId },
    select: {
      userId: true,
      sampleSessionsSeededAt: true,
    },
  })
  if (bootstrapState?.sampleSessionsSeededAt) {
    return
  }

  await ensureBuiltInDocumentTemplates()

  const templateIds = buildTemplateIdSet()

  await prisma.$transaction(
    async (tx) => {
      const now = new Date()
      const staleClaimThreshold = new Date(
        now.getTime() - SAMPLE_PACK_CLAIM_STALE_AFTER_MS
      )
      const existingBootstrap = await tx.userBootstrapState.findUnique({
        where: { userId },
        select: {
          userId: true,
          samplePackVersion: true,
          sampleSessionsSeededAt: true,
          updatedAt: true,
        },
      })

      if (existingBootstrap?.sampleSessionsSeededAt) {
        return
      }

      if (!existingBootstrap) {
        const bootstrapCreateResult = await tx.userBootstrapState.createMany({
          data: [
            {
              userId,
              samplePackVersion: SAMPLE_PACK_SEEDING_VERSION,
              sampleSessionsSeededAt: null,
            },
          ],
          skipDuplicates: true,
        })

        if (bootstrapCreateResult.count === 0) {
          return
        }
      } else {
        const bootstrapClaimResult = await tx.userBootstrapState.updateMany({
          where: {
            userId,
            sampleSessionsSeededAt: null,
            OR: [
              {
                samplePackVersion: {
                  not: SAMPLE_PACK_SEEDING_VERSION,
                },
              },
              {
                updatedAt: {
                  lt: staleClaimThreshold,
                },
              },
            ],
          },
          data: {
            samplePackVersion: SAMPLE_PACK_SEEDING_VERSION,
          },
        })

        if (bootstrapClaimResult.count === 0) {
          return
        }
      }

      const existingSampleSessions = await tx.session.findMany({
        where: {
          userId,
          title: {
            in: SAMPLE_CONSULTATION_FIXTURE_PACK.samples.map(
              (sample) => sample.sessionTitle
            ),
          },
        },
        select: {
          title: true,
        },
      })
      const existingSampleSessionTitles = new Set(
        existingSampleSessions
          .map((session) => session.title)
          .filter((title): title is string => typeof title === "string")
      )

      const templates = await tx.documentTemplate.findMany({
        where: {
          id: {
            in: templateIds,
          },
        },
        select: {
          id: true,
          latestPublishedVersionId: true,
        },
      })

      const versionIdByTemplateId = new Map(
        templates
          .filter(
            (
              template
            ): template is typeof template & { latestPublishedVersionId: string } =>
              !!template.latestPublishedVersionId
          )
          .map((template) => [template.id, template.latestPublishedVersionId])
      )

      for (const templateId of templateIds) {
        if (!versionIdByTemplateId.has(templateId)) {
          throw new Error(`Missing published template version for ${templateId}`)
        }
      }

      await tx.userInstalledDocument.createMany({
        data: templateIds.map((templateId) => ({
          userId,
          templateId,
          installedVersionId: versionIdByTemplateId.get(templateId)!,
        })),
        skipDuplicates: true,
      })

      const seededAt = new Date().toISOString()

      for (const sample of SAMPLE_CONSULTATION_FIXTURE_PACK.samples) {
        if (existingSampleSessionTitles.has(sample.sessionTitle)) {
          continue
        }

        const sessionId = randomUUID()
        const transcript = buildSampleTranscriptEntries({
          scenarioId: sample.scenarioId,
          sessionId,
          startedAt: sample.startedAt,
        })
        const endedAt = new Date(
          new Date(sample.startedAt).getTime() + transcript.totalDurationMs
        ).toISOString()

        await tx.session.create({
          data: {
            id: sessionId,
            userId,
            title: sample.sessionTitle,
            patientName: sample.patientName,
            mode: "DOCTOR",
            startedAt: new Date(sample.startedAt),
            endedAt: new Date(endedAt),
          },
        })

        await tx.transcriptEntry.createMany({
          data: transcript.entries.map((entry) => ({
            id: entry.id,
            sessionId,
            speaker: entry.speaker,
            rawSpeakerId: entry.rawSpeakerId,
            text: entry.text,
            startTime: entry.startTime,
            endTime: entry.endTime,
            confidence: entry.confidence,
            isFinal: true,
            createdAt: new Date(entry.createdAt),
          })),
        })

        await tx.insights.create({
          data: {
            sessionId,
            summary: sample.insights.summary,
            keyFindings: toJsonValue(sample.insights.keyFindings),
            redFlags: toJsonValue(sample.insights.redFlags),
            diagnosticKeywords: toJsonValue(sample.insights.diagnosticKeywords),
            lastProcessedAt: new Date(sample.insights.metadata.generatedAt),
          },
        })

        await tx.checklistItem.createMany({
          data: sample.insights.checklistItems.map((item, index) => ({
            id: randomUUID(),
            sessionId,
            label: item.label,
            isChecked: item.isChecked,
            isAutoChecked: item.isAutoChecked,
            doctorNote: item.doctorNote,
            sortOrder: index,
            source: item.source,
          })),
        })

        await tx.diagnosis.createMany({
          data: sample.diagnoses.slice(0, 3).map((diagnosis, index) => ({
            id: randomUUID(),
            sessionId,
            icdCode: diagnosis.icdCode,
            icdUri: diagnosis.icdUri ?? null,
            diseaseName: diagnosis.diseaseName,
            confidence:
              diagnosis.confidence === "high"
                ? "HIGH"
                : diagnosis.confidence === "low"
                  ? "LOW"
                  : "MODERATE",
            evidence: diagnosis.evidence,
            citations: toJsonValue(diagnosis.citations),
            sortOrder: index,
          })),
        })

        const recordId = randomUUID()
        const recordDocumentJson = legacyRecordToSessionDocumentContent({
          ...sample.record,
          id: recordId,
          sessionId,
        })

        await tx.consultationRecord.create({
          data: {
            id: recordId,
            sessionId,
            date: new Date(sample.record.date),
            patientName: sample.record.patientName,
            chiefComplaint: sample.record.chiefComplaint,
            hpiText: sample.record.hpiText,
            medications: sample.record.medications,
            rosText: sample.record.rosText,
            pmh: sample.record.pmh,
            socialHistory: sample.record.socialHistory,
            familyHistory: sample.record.familyHistory,
            vitals: sample.record.vitals ? toJsonValue(sample.record.vitals) : undefined,
            physicalExam: sample.record.physicalExam,
            labsStudies: sample.record.labsStudies,
            assessment: sample.record.assessment,
            plan: sample.record.plan,
            documentJson: toJsonValue(recordDocumentJson),
          },
        })

        const handoutId = randomUUID()
        const handoutDocumentJson = legacyPatientHandoutToSessionDocumentContent({
          ...sample.patientHandout,
          id: handoutId,
          sessionId,
        })

        await tx.patientHandout.create({
          data: {
            id: handoutId,
            sessionId,
            language: sample.patientHandout.language,
            conditions: toJsonValue(sample.patientHandout.conditions),
            entries: toJsonValue(sample.patientHandout.entries),
            documentJson: toJsonValue(handoutDocumentJson),
            generatedAt: new Date(sample.patientHandout.generatedAt),
          },
        })

        await tx.researchMessage.createMany({
          data: sample.research.flatMap((exchange, index) => {
            const baseCreatedAt = new Date(sample.startedAt).getTime()
            const offsetMs = (index + 1) * 60_000
            return [
              {
                id: randomUUID(),
                sessionId,
                role: "user",
                content: exchange.question,
                citations: toJsonValue([]),
                imageUrls: toJsonValue([]),
                storagePaths: toJsonValue([]),
                createdAt: new Date(baseCreatedAt + offsetMs),
              },
              {
                id: randomUUID(),
                sessionId,
                role: "assistant",
                content: exchange.answer,
                citations: toJsonValue(exchange.citations),
                imageUrls: toJsonValue([]),
                storagePaths: toJsonValue([]),
                createdAt: new Date(baseCreatedAt + offsetMs + 15_000),
              },
            ]
          }),
        })

        await tx.sessionDocument.createMany({
          data: [
            {
              id: randomUUID(),
              sessionId,
              templateId: BUILT_IN_RECORD_TEMPLATE_ID,
              instanceKey: DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY,
              templateVersionId: versionIdByTemplateId.get(BUILT_IN_RECORD_TEMPLATE_ID)!,
              title: null,
              contentJson: toJsonValue(recordDocumentJson),
              generationInputsJson: Prisma.JsonNull,
              generatedAt: new Date(sample.record.metadata.generatedAt),
            },
            {
              id: randomUUID(),
              sessionId,
              templateId: BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
              instanceKey: DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY,
              templateVersionId: versionIdByTemplateId.get(
                BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID
              )!,
              title: null,
              contentJson: toJsonValue(handoutDocumentJson),
              generationInputsJson: toJsonValue({
                clinicalContextMode: null,
                confirmedDiagnoses: sample.patientHandout.conditions,
              }),
              generatedAt: new Date(sample.patientHandout.generatedAt),
            },
            ...sample.documents.map((document) => ({
              id: randomUUID(),
              sessionId,
              templateId: document.templateId,
              instanceKey: DEFAULT_SESSION_DOCUMENT_INSTANCE_KEY,
              templateVersionId: versionIdByTemplateId.get(document.templateId)!,
              title: document.title,
              contentJson: toJsonValue(document.contentJson),
              generationInputsJson:
                document.generationInputs === null
                  ? Prisma.JsonNull
                  : toJsonValue(document.generationInputs),
              generatedAt: new Date(document.metadata.generatedAt),
            })),
          ],
        })
      }

      await tx.userBootstrapState.update({
        where: { userId },
        data: {
          samplePackVersion: SAMPLE_PACK_VERSION,
          sampleSessionsSeededAt: new Date(seededAt),
        },
      })
    },
    { maxWait: 15_000, timeout: 60_000 }
  )
}
