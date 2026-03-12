import {
  DOCUMENT_EXPORT_HTML_STYLE,
  DOCUMENT_SANS_FONT_STACK,
} from "@/lib/documents/rich-text"

export interface ExportDocumentPayload {
  title: string
  filename: string
  standaloneHtml: string
}

interface BuildStandaloneExportHtmlArgs {
  bodyHtml: string
  footerLabel: string
  lang?: string
  metaLine: string
  title: string
}

const EXPORT_PAGE_STYLE = `
  :root {
    color-scheme: light;
    --rxly-export-bg: #eef2f6;
    --rxly-export-paper: #ffffff;
    --rxly-export-border: rgba(148, 163, 184, 0.2);
    --rxly-export-shadow: 0 30px 90px rgba(15, 23, 42, 0.08);
    --rxly-export-foreground: #111827;
    --rxly-export-muted: #667085;
    --rxly-export-page-padding-screen: 40px 20px 56px;
    --rxly-export-page-padding-print: 40px 20px 56px;
    --rxly-export-document-inner-padding: clamp(36px, 5vw, 60px) clamp(28px, 6vw, 72px) clamp(42px, 5vw, 64px);
  }

  * {
    box-sizing: border-box;
  }

  html {
    background: var(--rxly-export-bg);
  }

  body {
    margin: 0;
    background: var(--rxly-export-bg);
    color: var(--rxly-export-foreground);
    font-family: ${DOCUMENT_SANS_FONT_STACK};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  .rxly-export-page {
    width: min(100%, 940px);
    margin: 0 auto;
    padding: var(--rxly-export-page-padding-screen);
  }

  .rxly-export-document {
    background: var(--rxly-export-paper);
    border: 1px solid var(--rxly-export-border);
    border-radius: 28px;
    box-shadow: var(--rxly-export-shadow);
    overflow: clip;
  }

  .rxly-export-document__inner {
    padding: var(--rxly-export-document-inner-padding);
  }

  .rxly-export-header {
    margin-bottom: 2.2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.22);
  }

  .rxly-export-title {
    margin: 0;
    font-family: ${DOCUMENT_SANS_FONT_STACK};
    font-size: clamp(1.65rem, 2vw, 2.05rem);
    line-height: 1.1;
    letter-spacing: -0.04em;
    color: #0f172a;
  }

  .rxly-export-meta {
    margin: 0.58rem 0 0;
    font-family: ${DOCUMENT_SANS_FONT_STACK};
    font-size: 0.84rem;
    line-height: 1.55;
    color: var(--rxly-export-muted);
  }

  .rxly-export-content {
    min-width: 0;
  }

  .rxly-export-content > :first-child {
    margin-top: 0;
  }

  .rxly-export-footer {
    margin-top: 2.2rem;
    padding-top: 0.9rem;
    border-top: 1px solid rgba(148, 163, 184, 0.18);
    font-family: ${DOCUMENT_SANS_FONT_STACK};
    font-size: 0.72rem;
    line-height: 1.5;
    color: #98a2b3;
  }

  .rxly-export-message + .rxly-export-message {
    margin-top: 1rem;
  }

  .rxly-export-message {
    border: 1px solid rgba(226, 232, 240, 0.92);
    border-radius: 18px;
    background: #fcfdff;
    padding: 0.88rem 0.94rem;
  }

  .rxly-export-message--user {
    background: #fff8f1;
    border-color: rgba(251, 191, 36, 0.24);
  }

  .rxly-export-message__label {
    margin-bottom: 0.48rem;
    font-family: ${DOCUMENT_SANS_FONT_STACK};
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #9a3412;
  }

  .rxly-export-message--assistant .rxly-export-message__label {
    color: #0f766e;
  }

  .rxly-export-images {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-top: 0.84rem;
  }

  .rxly-export-images figure {
    margin: 0;
  }

  .rxly-export-images img {
    display: block;
    width: 100%;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.22);
  }

  .rxly-export-images figcaption {
    margin-top: 0.4rem;
    font-family: ${DOCUMENT_SANS_FONT_STACK};
    font-size: 0.74rem;
    line-height: 1.45;
    color: var(--rxly-export-muted);
  }

  ${DOCUMENT_EXPORT_HTML_STYLE}

  @page {
    size: A4;
    margin: 0;
  }

  @media print {
    html,
    body {
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0 !important;
    }

    .rxly-export-page {
      width: 100%;
      max-width: none;
      padding: var(--rxly-export-page-padding-print);
      margin: 0;
    }

    .rxly-export-document {
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    .rxly-export-document__inner {
      padding: var(--rxly-export-document-inner-padding);
    }

    .rxly-export-header,
    .rxly-export-message,
    .rxly-export-images,
    .rxly-export-content table,
    .rxly-export-content pre {
      break-inside: avoid;
    }
  }
`

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildStandaloneExportHtml({
  bodyHtml,
  footerLabel,
  lang,
  metaLine,
  title,
}: BuildStandaloneExportHtmlArgs): string {
  const htmlLang = lang?.trim() || "en"

  return `<!doctype html>
<html lang="${escapeHtml(htmlLang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>${EXPORT_PAGE_STYLE}</style>
  </head>
  <body>
    <main class="rxly-export-page">
      <article class="rxly-export-document">
        <div class="rxly-export-document__inner">
          <header class="rxly-export-header">
            <h1 class="rxly-export-title">${escapeHtml(title)}</h1>
            <p class="rxly-export-meta">${escapeHtml(metaLine)}</p>
          </header>
          <div class="rxly-export-content">${bodyHtml}</div>
          <footer class="rxly-export-footer">${escapeHtml(footerLabel)}</footer>
        </div>
      </article>
    </main>
  </body>
</html>`
}

export function extractStandaloneExportFragment(standaloneHtml: string): string {
  const bodyMatch = standaloneHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (!bodyMatch) {
    return standaloneHtml
  }

  const styles = Array.from(
    standaloneHtml.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi),
    (match) => match[0]
  ).join("\n")

  return `${styles}${bodyMatch[1]}`
}
