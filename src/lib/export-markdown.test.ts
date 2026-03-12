import { describe, expect, it } from "vitest"
import {
  preprocessExportMarkdown,
  renderMarkdownBlock,
  renderMarkdownInline,
} from "./export-markdown"

describe("export markdown rendering", () => {
  it("normalizes citation links before rendering", () => {
    expect(preprocessExportMarkdown("[[Guideline]](https://example.com)")).toBe(
      "[Guideline](https://example.com)"
    )
  })

  it("renders GFM blocks for export output", () => {
    const html = renderMarkdownBlock(`
## Summary

Plain text with [[Guideline]](https://example.com) and [docs](https://openai.com).

- [x] controller started
- rescue inhaler retained

| Test | Result |
| --- | --- |
| SpO2 | 97% |

> Improved after nebulizer.

\`\`\`
prednisone 40 mg x5 days
\`\`\`
`)

    expect(html).toContain("<h2>Summary</h2>")
    expect(html).toContain('<a href="https://example.com">Guideline</a>')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain("<table>")
    expect(html).toContain("<blockquote>")
    expect(html).toContain("<pre><code>prednisone 40 mg x5 days")
  })

  it("keeps plain text stable", () => {
    expect(renderMarkdownBlock("Follow-up in one week.")).toBe(
      "<p>Follow-up in one week.</p>"
    )
  })

  it("strips the outer paragraph for inline markdown", () => {
    const html = renderMarkdownInline(
      "Use `albuterol`, **daily adherence**, and [action plan](https://example.com)."
    )

    expect(html).toContain("<code>albuterol</code>")
    expect(html).toContain("<strong>daily adherence</strong>")
    expect(html).toContain('<a href="https://example.com">action plan</a>')
    expect(html.startsWith("<p>")).toBe(false)
  })
})
