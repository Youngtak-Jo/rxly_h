import type { ReactNode } from "react"

// Inline citation regex — matches three pattern types:
// Group 1+2 = [[LABEL]](url) — inline citation (primary format)
// Group 3 = bare URL (fallback)
// Group 4 = bare ICD code like (BA00.0) (fallback)
export const CITATION_RE =
  /\[\[([^\]]+)\]\]\(([^)]+)\)|\(?(https?:\/\/[^\s)]+)\)?|\(([A-Z0-9]{2,5}(?:[./][A-Z0-9]{2,5})*)\)/g

export function urlToBadgeLabel(url: string): string {
  if (url.includes("icd.who.int")) return "ICD-11"
  if (url.includes("pubmed.ncbi.nlm.nih.gov")) return "PUBMED"
  if (url.includes("europepmc.org")) return "EPMC"
  return "LINK"
}

export const citationBadge =
  "inline-flex items-center text-[9px] font-medium uppercase px-1.5 py-0 rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors no-underline mx-0.5 align-baseline"

export function renderClinicalText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of text.matchAll(CITATION_RE)) {
    const matchStart = match.index!
    if (matchStart > lastIndex) {
      nodes.push(text.slice(lastIndex, matchStart))
    }

    if (match[1] && match[2]) {
      // [[LABEL]](url) — primary inline citation format
      nodes.push(
        <a
          key={key++}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className={citationBadge}
        >
          {match[1]}
        </a>
      )
    } else if (match[3]) {
      // Direct URL fallback
      nodes.push(
        <a
          key={key++}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className={citationBadge}
        >
          {urlToBadgeLabel(match[3])}
        </a>
      )
    } else if (match[4]) {
      // Bare ICD code fallback
      const code = match[4]
      const url = `https://icd.who.int/browse/2024-01/mms/en#${code.split(/[/.]/)[0]}`
      nodes.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={citationBadge}
        >
          {code}
        </a>
      )
    }

    lastIndex = matchStart + match[0].length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length > 0 ? nodes : [text]
}
