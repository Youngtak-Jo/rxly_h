import { generateText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import { SPEAKER_IDENTIFICATION_PROMPT } from "@/lib/prompts"

export async function POST(req: Request) {
  try {
    const { utterances } = await req.json()

    if (!utterances?.length) {
      return new Response("No utterances provided", { status: 400 })
    }

    // Format utterances with raw speaker IDs for analysis
    const formatted = utterances
      .map(
        (u: { speakerId: number; text: string }) =>
          `[speaker_${u.speakerId}]: ${u.text}`
      )
      .join("\n")

    const { text } = await generateText({
      model: xai(DEFAULT_MODEL),
      system: SPEAKER_IDENTIFICATION_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze these transcript utterances and identify the doctor and patient:\n\n${formatted}`,
        },
      ],
      temperature: 0.1,
    })

    const parsed = JSON.parse(text)

    return Response.json(parsed)
  } catch (error) {
    console.error("Speaker identification error:", error)
    return new Response("Failed to identify speakers", { status: 500 })
  }
}
