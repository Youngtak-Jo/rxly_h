"use client"

import { memo } from "react"
import { useLocale, useTimeZone, useTranslations } from "next-intl"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatTime } from "@/i18n/format"
import type { TranscriptEntry, DiagnosticKeyword, Speaker } from "@/types/session"
import { cn } from "@/lib/utils"

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
    isSeekable = false,
    onSeek,
}: {
    entry: TranscriptEntry
    prevSpeaker: Speaker | null
    isIdentified: boolean
    diagnosticKeywords: DiagnosticKeyword[]
    isFirst: boolean
    isSeekable?: boolean
    onSeek?: () => void
}) {
    const t = useTranslations("TranscriptBubble")
    const tViewer = useTranslations("TranscriptViewer")
    const locale = useLocale() as UiLocale
    const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE
    const isSameSpeaker = prevSpeaker === entry.speaker
    const showMeta = !isSameSpeaker

    function speakerLabel(speaker: Speaker) {
        return speaker === "DOCTOR"
            ? t("speaker.doctor")
            : speaker === "PATIENT"
                ? t("speaker.patient")
                : t("speaker.unknown")
    }

    const align = !isIdentified
        ? "center"
        : entry.speaker === "PATIENT"
            ? "left"
            : entry.speaker === "DOCTOR"
                ? "right"
                : "center"

    const bubbleClassName = cn(
        "max-w-[90%] px-3 py-2 text-left transition-colors",
        isSeekable &&
            "cursor-pointer hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        align === "left" && "rounded-2xl rounded-tl-sm bg-muted",
        align === "right" &&
            "rounded-2xl rounded-tr-sm bg-primary/10 text-foreground backdrop-blur-sm border border-primary/15",
        align === "center" && "rounded-2xl bg-muted/50"
    )

    const content = (
        <>
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
                                    title={t(`keywordCategories.${seg.keyword.category}`)}
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
                    <span className="text-[10px] font-mono text-muted-foreground/60">
                        {formatTime(entry.createdAt, locale, timeZone)}
                    </span>
                </div>
            )}
        </>
    )

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
            {isSeekable ? (
                <button
                    type="button"
                    onClick={onSeek}
                    className={bubbleClassName}
                    aria-label={tViewer("recordingsSeekToAudio")}
                    title={tViewer("recordingsSeekToAudio")}
                >
                    {content}
                </button>
            ) : (
                <div className={bubbleClassName}>{content}</div>
            )}
        </div>
    )
})
