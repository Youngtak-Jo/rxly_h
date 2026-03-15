import "dotenv/config"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { SAMPLE_CONSULTATION_SOURCE_CONFIG } from "@/lib/sample-consultations/source-config"
import { generateSampleConsultationFixture } from "@/lib/sample-consultations/generate"
import { SAMPLE_PACK_VERSION } from "@/lib/sample-consultations/types"

async function main() {
  const startedAt = new Date().toISOString()
  const samples = []
  process.env.RXLY_SAMPLE_FIXTURE_VERBOSE = "1"

  console.log(
    `Generating sample consultation fixture pack v${SAMPLE_PACK_VERSION}...`
  )

  for (const source of SAMPLE_CONSULTATION_SOURCE_CONFIG) {
    console.log(`- ${source.sessionTitle}`)
    samples.push(await generateSampleConsultationFixture(source))
  }

  const outputPath = path.join(
    process.cwd(),
    "src/lib/sample-consultations/fixture.generated.ts"
  )
  const serializedPack = JSON.stringify(
    {
      generatedAt: startedAt,
      samples,
    },
    null,
    2
  )

  const fileContent = `import type { SampleConsultationFixturePack } from "@/lib/sample-consultations/types"
import { SAMPLE_PACK_VERSION } from "@/lib/sample-consultations/types"

const fixturePack = ${serializedPack} as const

export const SAMPLE_CONSULTATION_FIXTURE_PACK: SampleConsultationFixturePack = {
  version: SAMPLE_PACK_VERSION,
  generatedAt: fixturePack.generatedAt,
  samples: fixturePack.samples as unknown as SampleConsultationFixturePack["samples"],
}
`

  await writeFile(outputPath, fileContent)
  console.log(`Wrote ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
