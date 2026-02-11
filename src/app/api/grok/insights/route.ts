import { streamText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import { INSIGHTS_SYSTEM_PROMPT } from "@/lib/prompts"

export async function POST(req: Request) {
  try {
    const { transcript, doctorNotes, currentInsights, sessionId } =
      await req.json()

    if (!transcript?.trim()) {
      return new Response("No transcript provided", { status: 400 })
    }

    const model = xai(DEFAULT_MODEL)

    // Format existing checklist so the AI can see current state
    const checklistItems = currentInsights?.checklistItems || []
    const uncheckedItems = checklistItems.filter((i: { isChecked: boolean }) => !i.isChecked)
    const checkedItems = checklistItems.filter((i: { isChecked: boolean }) => i.isChecked)

    let existingChecklistText = ""
    if (checklistItems.length > 0) {
      existingChecklistText = "\n\n--- CURRENT CHECKLIST (output the full updated checklist in your response) ---"
      if (uncheckedItems.length > 0) {
        existingChecklistText += "\nPending:"
        uncheckedItems.forEach((item: { label: string }) => {
          existingChecklistText += `\n  [ ] ${item.label}`
        })
      }
      if (checkedItems.length > 0) {
        existingChecklistText += "\nCompleted:"
        checkedItems.forEach((item: { label: string }) => {
          existingChecklistText += `\n  [x] ${item.label}`
        })
      }
      existingChecklistText += "\n--- END CURRENT CHECKLIST ---"
    }

    let userContent = `Current summary: ${currentInsights?.summary || "(none yet)"}\nCurrent key findings: ${JSON.stringify(currentInsights?.keyFindings || [])}\nCurrent red flags: ${JSON.stringify(currentInsights?.redFlags || [])}${existingChecklistText}\n\nFull transcript:\n${transcript}`
    if (doctorNotes?.trim()) {
      userContent += `\n\nDoctor's notes (from chat):\n${doctorNotes}`
    }

    const result = streamText({
      model,
      system: INSIGHTS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userContent,
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
