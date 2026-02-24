import { memo } from "react"
import type { TranscriptEntry, DiagnosticKeyword, Speaker } from "@/types/session"
import { cn } from "@/lib/utils"

function formatTime(createdAt: string) {
    const date = new Date(createdAt)
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
}

function speakerLabel(speaker: Speaker) {
    return speaker === "DOCTOR" ? "Dr" : speaker === "PATIENT" ? "Pt" : "?"
}

const HIGHLIGHT_COLORS: Record<
    DiagnosticKeyword["category"],
    { light: string; dark: string }
> = {
    symptom: {
        light: "bg-red-100 text-red-900",
        dark: "bg-red-500/30 text-red-100",
    },
    diagnosis: {
        light: "bg-blue-100 text-blue-900",
        dark: "bg-blue-500/30 text-blue-100",
    },
    medication: {
        light: "bg-green-100 text-green-900",
        dark: "bg-green-500/30 text-green-100",
    },
    finding: {
        light: "bg-amber-100 text-amber-900",
        dark: "bg-amber-500/30 text-amber-100",
    },
    vital: {
        light: "bg-purple-100 text-purple-900",
        dark: "bg-purple-500/30 text-purple-100",
    },
}

interface TextSegment {
    text: string
    keyword: DiagnosticKeyword | null
}

function highlightText(
    text: string,
    keywords: DiagnosticKeyword[]
): TextSegment[] {
    if (!text || keywords.length === 0) return [{ text: text ?? "", keyword: null }]

    const matches: { start: number; end: number; keyword: DiagnosticKeyword }[] =
        []

    for (const kw of keywords) {
        const lowerText = text.toLowerCase()
        const lowerPhrase = kw.phrase.toLowerCase()
        let searchFrom = 0

        while (searchFrom < lowerText.length) {
            const idx = lowerText.indexOf(lowerPhrase, searchFrom)
            if (idx === -1) break
            matches.push({ start: idx, end: idx + kw.phrase.length, keyword: kw })
            searchFrom = idx + 1
        }
    }

    if (matches.length === 0) return [{ text, keyword: null }]

    // Sort by start position, then prefer longer matches
    matches.sort(
        (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start)
    )

    // Remove overlapping matches (keep first/longest at each position)
    const resolved: typeof matches = []
    let lastEnd = 0
    for (const m of matches) {
        if (m.start >= lastEnd) {
            resolved.push(m)
            lastEnd = m.end
        }
    }

    // Build segments
    const segments: TextSegment[] = []
    let cursor = 0
    for (const m of resolved) {
        if (m.start > cursor) {
            segments.push({ text: text.slice(cursor, m.start), keyword: null })
        }
        segments.push({ text: text.slice(m.start, m.end), keyword: m.keyword })
        cursor = m.end
    }
    if (cursor < text.length) {
        segments.push({ text: text.slice(cursor), keyword: null })
    }

    return segments
}

export const TranscriptBubble = memo(function TranscriptBubble({
    entry,
    prevSpeaker,
    isIdentified,
    diagnosticKeywords,
    isFirst,
}: {
    entry: TranscriptEntry
    prevSpeaker: Speaker | null
    isIdentified: boolean
    diagnosticKeywords: DiagnosticKeyword[]
    isFirst: boolean
}) {
    const isSameSpeaker = prevSpeaker === entry.speaker
    const showMeta = !isSameSpeaker

    const align = !isIdentified
        ? "center"
        : entry.speaker === "PATIENT"
            ? "left"
            : entry.speaker === "DOCTOR"
                ? "right"
                : "center"

    return (
        <div
            className={cn(
                "flex",
                align === "left" && "justify-start",
                align === "right" && "justify-end",
                align === "center" && "justify-center",
                isSameSpeaker ? "mt-1" : isFirst ? "mt-0" : "mt-3"
            )}
        >
            <div
                className={cn(
                    "max-w-[90%] px-3 py-2",
                    // bubble shapes
                    align === "left" && "rounded-2xl rounded-tl-sm",
                    align === "right" && "rounded-2xl rounded-tr-sm",
                    align === "center" && "rounded-2xl",
                    // colors
                    align === "left" && "bg-muted",
                    align === "right" && "bg-primary/10 text-foreground backdrop-blur-sm border border-primary/15",
                    align === "center" && "bg-muted/50"
                )}
            >
                <p className="text-sm leading-relaxed">
                    {diagnosticKeywords.length > 0
                        ? highlightText(entry.text, diagnosticKeywords).map(
                            (seg, j) =>
                                seg.keyword ? (
                                    <mark
                                        key={j}
                                        className={cn(
                                            "rounded px-0.5 -mx-0.5",
                                            HIGHLIGHT_COLORS[seg.keyword.category].light
                                        )}
                                        title={seg.keyword.category}
                                    >
                                        {seg.text}
                                    </mark>
                                ) : (
                                    <span key={j}>{seg.text}</span>
                                )
                        )
                        : entry.text}
                </p>
                {showMeta && (
                    <div
                        className={cn(
                            "flex items-center gap-1.5 mt-1",
                            align === "right" ? "justify-end" : "justify-start"
                        )}
                    >
                        <span
                            className={cn(
                                "text-[10px] font-medium",
                                align === "right"
                                    ? "text-primary/70"
                                    : "text-muted-foreground"
                            )}
                        >
                            {speakerLabel(entry.speaker)}
                        </span>
                        <span
                            className={cn(
                                "text-[10px] font-mono",
                                align === "right"
                                    ? "text-muted-foreground/60"
                                    : "text-muted-foreground/60"
                            )}
                        >
                            {formatTime(entry.createdAt)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
})
