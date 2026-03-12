import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  ExportLinkAccessMode,
  ExportLinkChannel,
  type ExportLink,
} from "@prisma/client"
import {
  getActivePublicDocumentShareForUser,
  replacePublicDocumentShareForUser,
} from "./export-share"

const { encryptFieldMock, prismaMock, txMock } = vi.hoisted(() => {
  const prismaMock = {
    sessionDocument: {
      findFirst: vi.fn(),
    },
    exportLink: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  }

  const txMock = {
    exportLink: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  }

  const encryptFieldMock = vi.fn((value: string) => `encrypted:${value}`)

  return {
    prismaMock,
    txMock,
    encryptFieldMock,
  }
})

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

vi.mock("@/lib/encryption", () => ({
  encryptField: encryptFieldMock,
}))

function createShareLink(overrides: Partial<ExportLink> = {}): ExportLink {
  return {
    id: "share-1",
    userId: "user-1",
    sessionId: "session-1",
    sessionDocumentId: "doc-1",
    title: "Shared document",
    content: "encrypted:html",
    accessMode: ExportLinkAccessMode.PUBLIC_LINK,
    channel: ExportLinkChannel.PATIENT_SHARE,
    expiresAt: null,
    revokedAt: null,
    lastAccessedAt: null,
    accessCount: 0,
    createdAt: new Date("2026-03-12T00:00:00.000Z"),
    ...overrides,
  }
}

describe("export share service", () => {
  beforeEach(() => {
    prismaMock.sessionDocument.findFirst.mockReset()
    prismaMock.exportLink.findFirst.mockReset()
    prismaMock.$transaction.mockReset()
    txMock.exportLink.updateMany.mockReset()
    txMock.exportLink.create.mockReset()
    encryptFieldMock.mockClear()
  })

  it("returns the existing active public share without creating duplicates", async () => {
    const existingShare = createShareLink()
    prismaMock.sessionDocument.findFirst.mockResolvedValue({
      id: "doc-1",
      sessionId: "session-1",
      title: "Asthma Handout",
    })
    prismaMock.exportLink.findFirst.mockResolvedValue(existingShare)

    const result = await getActivePublicDocumentShareForUser({
      userId: "user-1",
      sessionId: "session-1",
      sessionDocumentId: "doc-1",
    })

    expect(result).toBe(existingShare)
    expect(prismaMock.exportLink.findFirst).toHaveBeenCalledWith({
      where: {
        sessionId: "session-1",
        sessionDocumentId: "doc-1",
        accessMode: ExportLinkAccessMode.PUBLIC_LINK,
        channel: ExportLinkChannel.PATIENT_SHARE,
        revokedAt: null,
      },
      orderBy: [{ createdAt: "desc" }],
    })
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it("replaces the prior patient share for the same session document", async () => {
    const createdShare = createShareLink({ id: "share-2" })
    prismaMock.sessionDocument.findFirst.mockResolvedValue({
      id: "doc-1",
      sessionId: "session-1",
      title: "Patient Handout",
    })
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof txMock) => Promise<ExportLink>) =>
        callback(txMock)
    )
    txMock.exportLink.create.mockResolvedValue(createdShare)

    const result = await replacePublicDocumentShareForUser({
      userId: "user-1",
      sessionId: "session-1",
      sessionDocumentId: "doc-1",
      title: "Updated Handout",
      standaloneHtml: "<main>hello</main>",
    })

    expect(result).toBe(createdShare)
    expect(encryptFieldMock).toHaveBeenCalledWith("<main>hello</main>")
    expect(txMock.exportLink.updateMany).toHaveBeenCalledWith({
      where: {
        sessionId: "session-1",
        sessionDocumentId: "doc-1",
        accessMode: ExportLinkAccessMode.PUBLIC_LINK,
        channel: ExportLinkChannel.PATIENT_SHARE,
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    })
    expect(txMock.exportLink.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        sessionId: "session-1",
        sessionDocumentId: "doc-1",
        title: "Updated Handout",
        content: "encrypted:<main>hello</main>",
        accessMode: ExportLinkAccessMode.PUBLIC_LINK,
        channel: ExportLinkChannel.PATIENT_SHARE,
        expiresAt: null,
      },
    })
  })

  it("rejects share lookup when the user does not own the session document", async () => {
    prismaMock.sessionDocument.findFirst.mockResolvedValue(null)

    await expect(
      getActivePublicDocumentShareForUser({
        userId: "user-1",
        sessionId: "session-1",
        sessionDocumentId: "doc-1",
      })
    ).rejects.toMatchObject({
      message: "Session document not found",
      status: 404,
    })

    expect(prismaMock.exportLink.findFirst).not.toHaveBeenCalled()
  })

  it("only targets patient-share links when replacing a public share", async () => {
    prismaMock.sessionDocument.findFirst.mockResolvedValue({
      id: "doc-1",
      sessionId: "session-1",
      title: "Patient Handout",
    })
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof txMock) => Promise<ExportLink>) =>
        callback(txMock)
    )
    txMock.exportLink.create.mockResolvedValue(createShareLink({ id: "share-3" }))

    await replacePublicDocumentShareForUser({
      userId: "user-1",
      sessionId: "session-1",
      sessionDocumentId: "doc-1",
      title: "Patient Handout",
      standaloneHtml: "<main>hello</main>",
    })

    expect(txMock.exportLink.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          channel: ExportLinkChannel.PATIENT_SHARE,
          accessMode: ExportLinkAccessMode.PUBLIC_LINK,
        }),
      })
    )
  })
})
