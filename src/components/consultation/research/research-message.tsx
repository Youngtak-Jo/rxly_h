"use client"

import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ResearchMessage } from "@/stores/research-store"
import { citationBadge } from "@/lib/citation-utils"

// Convert [[LABEL]](url) citation patterns to standard markdown links
// before passing to ReactMarkdown, so it handles all DOM operations natively.
const CITATION_PRE_RE = /\[\[([^\]]+)\]\]\(([^)]+)\)/g

function preprocessCitations(text: string): string {
  return text.replace(CITATION_PRE_RE, "[$1]($2)")
}

// Detect if a link was originally a citation badge based on its label
const BADGE_LABELS = new Set([
  "PUBMED",
  "EPMC",
  "ICD-11",
  "FDA",
  "TRIALS",
  "DAILYMED",
])

interface ResearchMessageProps {
  message: ResearchMessage
  isStreaming?: boolean
}

export function ResearchMessageBubble({
  message,
  isStreaming,
}: ResearchMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  const processed = useMemo(
    () => preprocessCitations(message.content),
    [message.content]
  )

  return (
    <div>
      {message.content ? (
        <div className="prose dark:prose-invert max-w-none text-sm prose-p:leading-7 prose-p:my-3.5 prose-h2:text-[17px] prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border prose-h3:text-[15px] prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-ul:my-3.5 prose-ol:my-3.5 prose-li:my-1.5 prose-li:leading-7 prose-pre:my-4 prose-pre:rounded-lg prose-blockquote:my-4 prose-blockquote:leading-7 prose-blockquote:border-l-primary prose-hr:my-8 prose-table:my-4 prose-th:py-2.5 prose-th:px-3 prose-td:py-2 prose-td:px-3 prose-strong:font-semibold prose-code:before:content-none prose-code:after:content-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const label =
                  typeof children === "string"
                    ? children
                    : Array.isArray(children)
                      ? children
                          .filter((c): c is string => typeof c === "string")
                          .join("")
                      : ""
                if (BADGE_LABELS.has(label)) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={citationBadge}
                    >
                      {label}
                    </a>
                  )
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {children}
                  </a>
                )
              },
            }}
          >
            {processed}
          </ReactMarkdown>
        </div>
      ) : isStreaming ? (
        <div className="flex items-center gap-1.5 py-2">
          <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">
            Searching medical databases...
          </span>
        </div>
      ) : null}
      {isStreaming && message.content && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse ml-0.5 align-baseline" />
      )}
    </div>
  )
}
