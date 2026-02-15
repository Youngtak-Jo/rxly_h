import { MedplumClient } from "@medplum/core"

let client: MedplumClient | null = null

export async function getMedplumClient(): Promise<MedplumClient> {
  if (!client) {
    client = new MedplumClient({
      baseUrl: process.env.MEDPLUM_BASE_URL || "https://api.medplum.com/",
    })
    await client.startClientLogin(
      process.env.MEDPLUM_CLIENT_ID!,
      process.env.MEDPLUM_CLIENT_SECRET!
    )
  }
  return client
}
