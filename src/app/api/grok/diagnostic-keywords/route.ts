import { generateText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import { DIAGNOSTIC_KEYWORDS_PROMPT } from "@/lib/prompts"

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json()

    if (!transcript?.trim()) {
      return new Response("No transcript provided", { status: 400 })
    }

    const { text } = await generateText({
      model: xai(DEFAULT_MODEL),
      system: DIAGNOSTIC_KEYWORDS_PROMPT,
      messages: [
        {
          role: "user",
          content: `Extract diagnostic keywords from this consultation transcript:\n\n${transcript}`,
        },
      ],
      temperature: 0.1,
      maxOutputTokens: 1000,
    })

    const cleaned = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
    const parsed = JSON.parse(cleaned)

    if (!Array.isArray(parsed)) {
      return new Response("Invalid response format", { status: 500 })
    }

    return Response.json(parsed)
  } catch (error) {
    console.error("Diagnostic keyword extraction error:", error)
    return new Response("Failed to extract keywords", { status: 500 })
  }
}
