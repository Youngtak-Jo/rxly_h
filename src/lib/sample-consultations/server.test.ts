import { beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_DOCUMENT_TEMPLATE_IDS } from "@/lib/documents/constants"
import { SAMPLE_CONSULTATION_FIXTURE_PACK } from "@/lib/sample-consultations/fixture.generated"
import { SAMPLE_PUBLIC_TEMPLATE_IDS } from "@/lib/sample-consultations/source-config"

const {
  prismaMock,
  txMock,
  ensureBuiltInDocumentTemplatesMock,
  legacyRecordToSessionDocumentContentMock,
  legacyPatientHandoutToSessionDocumentContentMock,
} = vi.hoisted(() => {
  const txMock = {
    userBootstrapState: {
      findUnique: vi.fn(),
      createMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    session: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    documentTemplate: {
      findMany: vi.fn(),
    },
    userInstalledDocument: {
      createMany: vi.fn(),
    },
    transcriptEntry: {
      createMany: vi.fn(),
    },
    insights: {
      create: vi.fn(),
    },
    checklistItem: {
      createMany: vi.fn(),
    },
    diagnosis: {
      createMany: vi.fn(),
    },
    consultationRecord: {
      create: vi.fn(),
    },
    patientHandout: {
      create: vi.fn(),
    },
    researchMessage: {
      createMany: vi.fn(),
    },
    sessionDocument: {
      createMany: vi.fn(),
    },
  }

  const prismaMock = {
    userBootstrapState: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  }

  return {
    prismaMock,
    txMock,
    ensureBuiltInDocumentTemplatesMock: vi.fn(),
    legacyRecordToSessionDocumentContentMock: vi.fn(() => ({ type: "doc" })),
    legacyPatientHandoutToSessionDocumentContentMock: vi.fn(() => ({ type: "doc" })),
  }
})

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

vi.mock("@/lib/documents/server", () => ({
  ensureBuiltInDocumentTemplates: ensureBuiltInDocumentTemplatesMock,
  legacyRecordToSessionDocumentContent: legacyRecordToSessionDocumentContentMock,
  legacyPatientHandoutToSessionDocumentContent:
    legacyPatientHandoutToSessionDocumentContentMock,
}))

import { ensureSampleConsultationsForUser } from "@/lib/sample-consultations/server"

describe("sample consultation seeding", () => {
  beforeEach(() => {
    ensureBuiltInDocumentTemplatesMock.mockReset()
    legacyRecordToSessionDocumentContentMock.mockClear()
    legacyPatientHandoutToSessionDocumentContentMock.mockClear()
    prismaMock.userBootstrapState.findUnique.mockReset()
    prismaMock.$transaction.mockReset()

    txMock.userBootstrapState.createMany.mockReset()
    txMock.userBootstrapState.findUnique.mockReset()
    txMock.userBootstrapState.updateMany.mockReset()
    txMock.userBootstrapState.update.mockReset()
    txMock.session.count.mockReset()
    txMock.session.create.mockReset()
    txMock.session.findMany.mockReset()
    txMock.documentTemplate.findMany.mockReset()
    txMock.userInstalledDocument.createMany.mockReset()
    txMock.transcriptEntry.createMany.mockReset()
    txMock.insights.create.mockReset()
    txMock.checklistItem.createMany.mockReset()
    txMock.diagnosis.createMany.mockReset()
    txMock.consultationRecord.create.mockReset()
    txMock.patientHandout.create.mockReset()
    txMock.researchMessage.createMany.mockReset()
    txMock.sessionDocument.createMany.mockReset()

    ensureBuiltInDocumentTemplatesMock.mockResolvedValue(undefined)
    prismaMock.userBootstrapState.findUnique.mockResolvedValue(null)
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof txMock) => Promise<void>) => callback(txMock)
    )
    txMock.userBootstrapState.createMany.mockResolvedValue({ count: 1 })
    txMock.userBootstrapState.findUnique.mockResolvedValue(null)
    txMock.userBootstrapState.updateMany.mockResolvedValue({ count: 1 })
    txMock.userBootstrapState.update.mockResolvedValue({})
    txMock.session.count.mockResolvedValue(0)
    txMock.session.create.mockResolvedValue({})
    txMock.session.findMany.mockResolvedValue([])
    txMock.documentTemplate.findMany.mockResolvedValue(
      [...DEFAULT_DOCUMENT_TEMPLATE_IDS, ...SAMPLE_PUBLIC_TEMPLATE_IDS].map((id) => ({
        id,
        latestPublishedVersionId: `version:${id}`,
      }))
    )
    txMock.userInstalledDocument.createMany.mockResolvedValue({ count: 5 })
    txMock.transcriptEntry.createMany.mockResolvedValue({ count: 1 })
    txMock.insights.create.mockResolvedValue({})
    txMock.checklistItem.createMany.mockResolvedValue({ count: 1 })
    txMock.diagnosis.createMany.mockResolvedValue({ count: 3 })
    txMock.consultationRecord.create.mockResolvedValue({})
    txMock.patientHandout.create.mockResolvedValue({})
    txMock.researchMessage.createMany.mockResolvedValue({ count: 6 })
    txMock.sessionDocument.createMany.mockResolvedValue({ count: 5 })
  })

  it("seeds example sessions exactly once for a new user", async () => {
    await ensureSampleConsultationsForUser("user-1")

    expect(ensureBuiltInDocumentTemplatesMock).toHaveBeenCalledTimes(1)
    expect(txMock.userBootstrapState.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user-1",
          samplePackVersion: -1,
          sampleSessionsSeededAt: null,
        },
      ],
      skipDuplicates: true,
    })
    expect(txMock.session.create).toHaveBeenCalledTimes(
      SAMPLE_CONSULTATION_FIXTURE_PACK.samples.length
    )
    expect(txMock.transcriptEntry.createMany).toHaveBeenCalledTimes(
      SAMPLE_CONSULTATION_FIXTURE_PACK.samples.length
    )
    expect(txMock.diagnosis.createMany).toHaveBeenCalledTimes(
      SAMPLE_CONSULTATION_FIXTURE_PACK.samples.length
    )
    expect(txMock.researchMessage.createMany).toHaveBeenCalledTimes(
      SAMPLE_CONSULTATION_FIXTURE_PACK.samples.length
    )
    expect(txMock.sessionDocument.createMany).toHaveBeenCalledTimes(
      SAMPLE_CONSULTATION_FIXTURE_PACK.samples.length
    )
    expect(txMock.sessionDocument.createMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ templateId: "record" }),
          expect.objectContaining({ templateId: "patient-handout" }),
          expect.objectContaining({ templateId: "after-visit-summary" }),
          expect.objectContaining({ templateId: "referral-request-letter" }),
          expect.objectContaining({ templateId: "longitudinal-care-plan" }),
        ]),
      })
    )
    expect(txMock.userBootstrapState.update).toHaveBeenLastCalledWith({
      where: { userId: "user-1" },
      data: {
        samplePackVersion: 1,
        sampleSessionsSeededAt: expect.any(Date),
      },
    })
  })

  it("backfills example sessions even when the user already has existing sessions", async () => {
    txMock.userBootstrapState.findUnique.mockResolvedValue({
      userId: "user-2",
      samplePackVersion: 1,
      sampleSessionsSeededAt: null,
      updatedAt: new Date("2026-03-12T00:00:00.000Z"),
    })

    await ensureSampleConsultationsForUser("user-2")

    expect(txMock.userBootstrapState.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: "user-2",
        sampleSessionsSeededAt: null,
      }),
      data: {
        samplePackVersion: -1,
      },
    })
    expect(txMock.session.create).toHaveBeenCalledTimes(
      SAMPLE_CONSULTATION_FIXTURE_PACK.samples.length
    )
    expect(txMock.userBootstrapState.update).toHaveBeenCalledWith({
      where: { userId: "user-2" },
      data: {
        samplePackVersion: 1,
        sampleSessionsSeededAt: expect.any(Date),
      },
    })
  })

  it("returns immediately when examples were already seeded", async () => {
    prismaMock.userBootstrapState.findUnique.mockResolvedValue({
      userId: "user-3",
      sampleSessionsSeededAt: new Date("2026-03-12T00:00:00.000Z"),
    })

    await ensureSampleConsultationsForUser("user-3")

    expect(ensureBuiltInDocumentTemplatesMock).not.toHaveBeenCalled()
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
    expect(txMock.session.count).not.toHaveBeenCalled()
    expect(txMock.session.create).not.toHaveBeenCalled()
    expect(txMock.userBootstrapState.update).not.toHaveBeenCalled()
  })

  it("skips duplicate sample titles during recovery and only creates the missing examples", async () => {
    txMock.userBootstrapState.findUnique.mockResolvedValue({
      userId: "user-4",
      samplePackVersion: 1,
      sampleSessionsSeededAt: null,
      updatedAt: new Date("2026-03-12T00:00:00.000Z"),
    })
    txMock.session.findMany.mockResolvedValue([
      { title: "Example · Chest Pain Evaluation" },
    ])

    await ensureSampleConsultationsForUser("user-4")

    expect(txMock.session.create).toHaveBeenCalledTimes(
      SAMPLE_CONSULTATION_FIXTURE_PACK.samples.length - 1
    )
  })
})
