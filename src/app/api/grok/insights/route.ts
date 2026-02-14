import { streamText } from "ai"
import { xai, DEFAULT_MODEL } from "@/lib/grok"
import { INSIGHTS_SYSTEM_PROMPT } from "@/lib/prompts"
import type { UserContent } from "ai"

export async function POST(req: Request) {
  try {
    const {
      transcript,
      doctorNotes,
      newImageUrls,
      previousImageFindings,
      mode,
      previousSummary,
      inlineComments,
      currentInsights,
    } = await req.json()

    const hasNewImages = newImageUrls && newImageUrls.length > 0
    const hasPreviousImages = previousImageFindings && previousImageFindings.length > 0
    const hasInlineComments = inlineComments && inlineComments.length > 0

    if (
      !transcript?.trim() &&
      !doctorNotes?.trim() &&
      !hasNewImages &&
      !hasInlineComments
    ) {
      return new Response("No transcript, notes, or images provided", {
        status: 400,
      })
    }

    const model = xai(DEFAULT_MODEL)

    // Format existing checklist with IDs so the AI can preserve item identity
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
        "\n\n--- DOCTOR-MODIFIED CHECKLIST ITEMS (preserve these items and their IDs in your full checklist output) ---"
      if (uncheckedItems.length > 0) {
        existingChecklistText += "\nPending:"
        uncheckedItems.forEach((item: { id: string; label: string }) => {
          existingChecklistText += `\n  [id:${item.id}] [ ] ${item.label}`
        })
      }
      if (checkedItems.length > 0) {
        existingChecklistText += "\nCompleted:"
        checkedItems.forEach((item: { id: string; label: string }) => {
          existingChecklistText += `\n  [id:${item.id}] [x] ${item.label}`
        })
      }
      existingChecklistText += "\n--- END CURRENT CHECKLIST ---"
    }

    // Build transcript section based on mode (full vs delta)
    let transcriptSection: string
    if (mode === "delta" && previousSummary) {
      transcriptSection = `Previous analysis summary: ${previousSummary}\n\nNew dialogue since last analysis:\n${transcript || "(No new speech)"}`
    } else {
      transcriptSection = `Full transcript:\n${transcript || "(No speech recorded yet)"}`
    }

    let textContent = `Current summary: ${currentInsights?.summary || "(none yet)"}\nCurrent key findings: ${JSON.stringify(currentInsights?.keyFindings || [])}\nCurrent red flags: ${JSON.stringify(currentInsights?.redFlags || [])}${existingChecklistText}\n\n${transcriptSection}`
    if (doctorNotes?.trim()) {
      textContent += `\n\nDoctor's notes (from chat):\n${doctorNotes}`
    }

    // Append inline comments from the doctor
    if (inlineComments && inlineComments.length > 0) {
      textContent += "\n\n--- DOCTOR'S INLINE COMMENTS ---"
      textContent += "\nThe doctor has annotated specific parts of the current insights. Address each comment:"
      for (const c of inlineComments) {
        textContent += `\n\n[Section: ${c.section}]`
        textContent += `\nSelected text: "${c.selectedText}"`
        textContent += `\nDoctor's comment: "${c.comment}"`
      }
      textContent += "\n\nIMPORTANT: Prioritize these comments — they are authoritative corrections or requests from the clinician. Modify the relevant sections accordingly."
      textContent += "\n--- END DOCTOR'S INLINE COMMENTS ---"
    }

    // Build multimodal content: text + images
    const content: UserContent = [{ type: "text", text: textContent }]

    // Append previously analyzed image findings as text (no vision tokens)
    if (hasPreviousImages) {
      let prevImageText = "\n\n--- PREVIOUSLY ANALYZED IMAGES (text summaries, do not re-analyze) ---"
      previousImageFindings.forEach(
        (img: { storagePath: string; findings: string }, i: number) => {
          prevImageText += `\nImage ${i + 1}:\n${img.findings}`
        }
      )
      prevImageText += "\n--- END PREVIOUSLY ANALYZED IMAGES ---"
      content[0] = { type: "text", text: textContent + prevImageText }
    }

    // Send only NEW images as actual multimodal content (vision tokens)
    if (hasNewImages) {
      const findingsSummary = (currentInsights?.keyFindings || []).join("; ") || "None yet"
      const flagsSummary = (currentInsights?.redFlags || []).join("; ") || "None"
      const currentText = (content[0] as { type: "text"; text: string }).text
      content[0] = {
        type: "text",
        text:
          currentText +
          `\n\n--- NEW MEDICAL IMAGES (${newImageUrls.length}) ---\nCRITICAL: Analyze each NEW image IN THE CONTEXT of this consultation. The patient's current clinical picture:\n- Current assessment: ${currentInsights?.summary || "Not yet established"}\n- Key findings so far: ${findingsSummary}\n- Red flags identified: ${flagsSummary}\n\nCorrelate what you see in the image(s) with the transcript discussion, doctor's notes, and findings above. Do NOT provide a generic assessment disconnected from the consultation context.\nIncorporate your contextual image analysis into the summary, key findings, red flags, and checklist.\n--- END NEW IMAGES ---`,
      }
      for (const url of newImageUrls) {
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
