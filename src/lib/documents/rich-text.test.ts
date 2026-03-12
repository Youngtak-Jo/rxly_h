import { describe, expect, it } from "vitest"
import { richTextDocumentToHtml, type RichTextDocument } from "./rich-text"

const sampleDocument: RichTextDocument = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Summary" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Centered export typography should stay readable." }],
    },
  ],
}

describe("rich text export variant", () => {
  it("keeps the default and export styles separated", () => {
    const defaultHtml = richTextDocumentToHtml(sampleDocument)
    const exportHtml = richTextDocumentToHtml(sampleDocument, { variant: "export" })

    expect(defaultHtml).toContain('<div class="rxly-document-root">')
    expect(defaultHtml).toContain("text-transform: uppercase;")

    expect(exportHtml).toContain(
      '<div class="rxly-document-root rxly-document-root--export">'
    )
    expect(exportHtml).toContain("font-size: 15px;")
    expect(exportHtml).toContain("line-height: 1.74;")
    expect(exportHtml).toContain(".rxly-document-root--export h2")
    expect(exportHtml).toContain("text-transform: none;")
  })
})
