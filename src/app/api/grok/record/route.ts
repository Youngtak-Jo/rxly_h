import { streamText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import { RECORD_SYSTEM_PROMPT } from "@/lib/prompts"

export async function POST(req: Request) {
  try {
    const { transcript, doctorNotes, insights, sessionId, existingRecord } =
      await req.json()

    if (!transcript?.trim()) {
      return new Response("No transcript provided", { status: 400 })
    }

    const model = xai(DEFAULT_MODEL)

    const userContent = [
      `Transcript:\n${transcript}`,
      doctorNotes?.trim()
        ? `\nDoctor's notes (inline annotations during consultation):\n${doctorNotes}`
        : "",
      insights
        ? `\nCurrent insights:\n${JSON.stringify(insights, null, 2)}`
        : "",
      existingRecord
        ? `\nExisting record to update:\n${JSON.stringify(existingRecord, null, 2)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n")

    const result = streamText({
      model,
      system: RECORD_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.2,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Record generation error:", error)
    return new Response("Failed to generate record", { status: 500 })
  }
}
