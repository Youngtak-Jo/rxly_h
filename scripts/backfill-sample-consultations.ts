import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { ensureSampleConsultationsForUser } from "@/lib/sample-consultations/server"

async function main() {
  const [sessionUsers, bootstrapUsers] = await Promise.all([
    prisma.session.findMany({
      select: {
        userId: true,
      },
      distinct: ["userId"],
    }),
    prisma.userBootstrapState.findMany({
      select: {
        userId: true,
      },
    }),
  ])

  const userIds = [...new Set([...sessionUsers, ...bootstrapUsers].map((row) => row.userId))]

  console.log(`Found ${userIds.length} existing user(s) to evaluate for sample consultation backfill.`)

  let seededCount = 0
  let skippedCount = 0

  for (const userId of userIds) {
    const before = await prisma.userBootstrapState.findUnique({
      where: { userId },
      select: {
        sampleSessionsSeededAt: true,
      },
    })

    await ensureSampleConsultationsForUser(userId)

    const after = await prisma.userBootstrapState.findUnique({
      where: { userId },
      select: {
        sampleSessionsSeededAt: true,
      },
    })

    if (!before?.sampleSessionsSeededAt && after?.sampleSessionsSeededAt) {
      seededCount += 1
      console.log(`Seeded example consultations for user ${userId}`)
    } else {
      skippedCount += 1
    }
  }

  console.log(`Backfill complete. Seeded: ${seededCount}, skipped: ${skippedCount}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
