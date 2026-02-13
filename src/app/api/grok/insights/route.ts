import { streamText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import { INSIGHTS_SYSTEM_PROMPT } from "@/lib/prompts"
import type { UserContent } from "ai"

export async function POST(req: Request) {
  try {
    const {
      transcript,
      doctorNotes,
      imageUrls,
      currentInsights,
    } = await req.json()

    if (
      !transcript?.trim() &&
      !doctorNotes?.trim() &&
      (!imageUrls || imageUrls.length === 0)
    ) {
      return new Response("No transcript, notes, or images provided", {
        status: 400,
      })
    }

    const model = xai(DEFAULT_MODEL)

    // Format existing checklist so the AI can see current state
    const checklistItems = currentInsights?.checklistItems || []
    const uncheckedItems = checklistItems.filter(
      (i: { isChecked: boolean }) => !i.isChecked
    )
    const checkedItems = checklistItems.filter(
      (i: { isChecked: boolean }) => i.isChecked
    )

    let existingChecklistText = ""
    if (checklistItems.length > 0) {
      existingChecklistText =
        "\n\n--- CURRENT CHECKLIST (output the full updated checklist in your response) ---"
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

    let textContent = `Current summary: ${currentInsights?.summary || "(none yet)"}\nCurrent key findings: ${JSON.stringify(currentInsights?.keyFindings || [])}\nCurrent red flags: ${JSON.stringify(currentInsights?.redFlags || [])}${existingChecklistText}\n\nFull transcript:\n${transcript || "(No speech recorded yet)"}`
    if (doctorNotes?.trim()) {
      textContent += `\n\nDoctor's notes (from chat):\n${doctorNotes}`
    }

    // Build multimodal content: text + images
    const content: UserContent = [{ type: "text", text: textContent }]

    if (imageUrls && imageUrls.length > 0) {
      const findingsSummary = (currentInsights?.keyFindings || []).join("; ") || "None yet"
      const flagsSummary = (currentInsights?.redFlags || []).join("; ") || "None"
      content[0] = {
        type: "text",
        text:
          textContent +
          `\n\n--- UPLOADED MEDICAL IMAGES ---\nThe doctor has uploaded ${imageUrls.length} medical image(s) during this consultation.\n\nCRITICAL: Analyze each image IN THE CONTEXT of this consultation. The patient's current clinical picture:\n- Current assessment: ${currentInsights?.summary || "Not yet established"}\n- Key findings so far: ${findingsSummary}\n- Red flags identified: ${flagsSummary}\n\nCorrelate what you see in the image(s) with the transcript discussion, doctor's notes, and findings above. Do NOT provide a generic assessment disconnected from the consultation context.\nIncorporate your contextual image analysis into the summary, key findings, red flags, and checklist.\n--- END IMAGE INSTRUCTIONS ---`,
      }
      for (const url of imageUrls) {
        content.push({ type: "image", image: new URL(url) })
      }
    }

    const result = streamText({
      model,
      system: INSIGHTS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content,
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
