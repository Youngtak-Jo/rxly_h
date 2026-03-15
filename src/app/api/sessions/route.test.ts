import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"

const {
  prismaMock,
  requireAuthMock,
  checkRateLimitMock,
  rateLimitResponseMock,
  ensureSampleConsultationsForUserMock,
  logAuditMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  prismaMock: {
    session: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
  requireAuthMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  rateLimitResponseMock: vi.fn(),
  ensureSampleConsultationsForUserMock: vi.fn(),
  logAuditMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: requireAuthMock,
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
  rateLimitResponse: rateLimitResponseMock,
}))

vi.mock("@/lib/sample-consultations/server", () => ({
  ensureSampleConsultationsForUser: ensureSampleConsultationsForUserMock,
}))

vi.mock("@/lib/audit", () => ({
  logAudit: logAuditMock,
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: loggerErrorMock,
  },
}))

import { GET } from "@/app/api/sessions/route"

describe("GET /api/sessions", () => {
  beforeEach(() => {
    requireAuthMock.mockReset()
    checkRateLimitMock.mockReset()
    rateLimitResponseMock.mockReset()
    ensureSampleConsultationsForUserMock.mockReset()
    prismaMock.session.findMany.mockReset()
    logAuditMock.mockReset()
    loggerErrorMock.mockReset()

    requireAuthMock.mockResolvedValue({ id: "user-1" })
    checkRateLimitMock.mockReturnValue({ allowed: true })
    ensureSampleConsultationsForUserMock.mockResolvedValue(undefined)
    prismaMock.session.findMany.mockResolvedValue([
      {
        id: "example-session",
        userId: "user-1",
        title: "Example · Chest Pain Evaluation",
        patientName: null,
        mode: "DOCTOR",
        startedAt: "2026-03-12T11:00:00.000Z",
        endedAt: null,
        createdAt: "2026-03-12T11:00:00.000Z",
        updatedAt: "2026-03-12T11:00:00.000Z",
      },
      {
        id: "regular-session",
        userId: "user-1",
        title: "General Follow-up",
        patientName: null,
        mode: "DOCTOR",
        startedAt: "2026-03-12T10:00:00.000Z",
        endedAt: null,
        createdAt: "2026-03-12T10:00:00.000Z",
        updatedAt: "2026-03-12T10:00:00.000Z",
      },
    ])
  })

  it("bootstraps sample consultations before listing sessions", async () => {
    const response = await GET()

    expect(ensureSampleConsultationsForUserMock).toHaveBeenCalledWith("user-1")
    expect(
      ensureSampleConsultationsForUserMock.mock.invocationCallOrder[0]
    ).toBeLessThan(prismaMock.session.findMany.mock.invocationCallOrder[0]!)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      {
        id: "regular-session",
        userId: "user-1",
        title: "General Follow-up",
        patientName: null,
        mode: "DOCTOR",
        startedAt: "2026-03-12T10:00:00.000Z",
        endedAt: null,
        createdAt: "2026-03-12T10:00:00.000Z",
        updatedAt: "2026-03-12T10:00:00.000Z",
      },
      {
        id: "example-session",
        userId: "user-1",
        title: "Example · Chest Pain Evaluation",
        patientName: null,
        mode: "DOCTOR",
        startedAt: "2026-03-12T11:00:00.000Z",
        endedAt: null,
        createdAt: "2026-03-12T11:00:00.000Z",
        updatedAt: "2026-03-12T11:00:00.000Z",
      },
    ])
  })

  it("returns the rate limit response when data access is throttled", async () => {
    const limitedResponse = NextResponse.json({ error: "rate limited" }, { status: 429 })
    checkRateLimitMock.mockReturnValue({ allowed: false })
    rateLimitResponseMock.mockReturnValue(limitedResponse)

    const response = await GET()

    expect(response).toBe(limitedResponse)
    expect(ensureSampleConsultationsForUserMock).not.toHaveBeenCalled()
    expect(prismaMock.session.findMany).not.toHaveBeenCalled()
  })
})
