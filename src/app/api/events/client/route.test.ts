import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"

const {
  prismaMock,
  requireAuthMock,
  checkRateLimitMock,
  rateLimitResponseMock,
  loggerWarnMock,
  loggerErrorMock,
} = vi.hoisted(() => ({
  prismaMock: {
    session: {
      findFirst: vi.fn(),
    },
    clientEvent: {
      create: vi.fn(),
    },
  },
  requireAuthMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
  rateLimitResponseMock: vi.fn(),
  loggerWarnMock: vi.fn(),
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

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: loggerWarnMock,
    error: loggerErrorMock,
  },
}))

import { POST } from "@/app/api/events/client/route"

describe("POST /api/events/client", () => {
  beforeEach(() => {
    prismaMock.session.findFirst.mockReset()
    prismaMock.clientEvent.create.mockReset()
    requireAuthMock.mockReset()
    checkRateLimitMock.mockReset()
    rateLimitResponseMock.mockReset()
    loggerWarnMock.mockReset()
    loggerErrorMock.mockReset()

    requireAuthMock.mockResolvedValue({ id: "user-1" })
    checkRateLimitMock.mockReturnValue({ allowed: true })
    prismaMock.clientEvent.create.mockResolvedValue({})
  })

  it("stores the session id when the session already exists", async () => {
    prismaMock.session.findFirst.mockResolvedValue({ id: "session-1" })

    const response = await POST(
      new Request("http://localhost/api/events/client", {
        method: "POST",
        body: JSON.stringify({
          eventType: "workspace_opened",
          feature: "insights",
          sessionId: "ef8609e4-e31c-4c77-9f0f-4f1a9249983f",
          metadata: {},
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
    )

    expect(response.status).toBe(200)
    expect(prismaMock.clientEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        sessionId: "ef8609e4-e31c-4c77-9f0f-4f1a9249983f",
        eventType: "workspace_opened",
        feature: "insights",
        metadata: {},
      }),
    })
    expect(loggerWarnMock).not.toHaveBeenCalled()
  })

  it("falls back to a null session id when the session is not persisted yet", async () => {
    prismaMock.session.findFirst.mockResolvedValue(null)

    const response = await POST(
      new Request("http://localhost/api/events/client", {
        method: "POST",
        body: JSON.stringify({
          eventType: "workspace_opened",
          feature: "insights",
          sessionId: "ef8609e4-e31c-4c77-9f0f-4f1a9249983f",
          metadata: {
            tab: "insights",
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
    )

    expect(response.status).toBe(200)
    expect(prismaMock.clientEvent.create).toHaveBeenCalledTimes(1)
    expect(prismaMock.clientEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        sessionId: null,
        eventType: "workspace_opened",
        feature: "insights",
        metadata: {
          tab: "insights",
          droppedSessionId: "ef8609e4-e31c-4c77-9f0f-4f1a9249983f",
          sessionIdFallbackReason: "session_not_persisted",
        },
      }),
    })
    expect(loggerWarnMock).toHaveBeenCalledTimes(1)
  })

  it("returns the shared rate-limit response when throttled", async () => {
    const limitedResponse = NextResponse.json({ error: "rate limited" }, { status: 429 })
    checkRateLimitMock.mockReturnValue({ allowed: false })
    rateLimitResponseMock.mockReturnValue(limitedResponse)

    const response = await POST(
      new Request("http://localhost/api/events/client", {
        method: "POST",
        body: JSON.stringify({
          eventType: "workspace_opened",
          feature: "insights",
          metadata: {},
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
    )

    expect(response).toBe(limitedResponse)
    expect(prismaMock.clientEvent.create).not.toHaveBeenCalled()
  })
})
