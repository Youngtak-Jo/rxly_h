"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
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
  const t = useTranslations("ResearchMessageList")
  const processed = useMemo(
    () => preprocessCitations(message.content),
    [message.content]
  )

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.content && (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
          {message.imageUrls.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              {message.imageUrls.map((url, index) => (
                <Image
                  key={`${message.id}-${index}`}
                  src={url}
                  alt={`Research attachment ${index + 1}`}
                  width={88}
                  height={88}
                  className="h-20 w-20 rounded-xl border border-white/20 object-cover"
                  unoptimized
                />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {message.content ? (
        <div className="research-markdown">
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
            {t("searching")}
          </span>
        </div>
      ) : null}
      {isStreaming && message.content && (
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse ml-0.5 align-baseline" />
      )}
    </div>
  )
}
