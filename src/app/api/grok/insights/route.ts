import { streamText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import { INSIGHTS_SYSTEM_PROMPT } from "@/lib/prompts"

export async function POST(req: Request) {
  try {
    const { transcript, currentInsights, sessionId } = await req.json()

    if (!transcript?.trim()) {
      return new Response("No transcript provided", { status: 400 })
    }

    const model = xai(DEFAULT_MODEL)

    const result = streamText({
      model,
      system: INSIGHTS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Current insights state:\n${JSON.stringify(currentInsights, null, 2)}\n\nFull transcript:\n${transcript}`,
        },
      ],
      temperature: 0.3,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error("Insights generation error:", error)
    return new Response("Failed to generate insights", { status: 500 })
  }
}
