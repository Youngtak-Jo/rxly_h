import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { ConsultationSessionClient } from "./consultation-session-client"
import type { Session } from "@/types/session"

export default function ConsultationSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <ConsultationSessionPageContent params={params} />
}

async function ConsultationSessionPageContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const initialSessionRecord = await prisma.session.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: {
      id: true,
      title: true,
      patientName: true,
      mode: true,
      startedAt: true,
      endedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const initialSession: Session | null = initialSessionRecord
    ? {
        ...initialSessionRecord,
        startedAt: initialSessionRecord.startedAt.toISOString(),
        endedAt: initialSessionRecord.endedAt?.toISOString() ?? null,
        createdAt: initialSessionRecord.createdAt.toISOString(),
        updatedAt: initialSessionRecord.updatedAt.toISOString(),
      }
    : null

  return (
    <ConsultationSessionClient
      sessionId={id}
      initialSession={initialSession}
    />
  )
}
