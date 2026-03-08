"use client"

import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import type { GenericDocumentSection } from "@/types/document"

function SectionView({
  section,
  itemLabel,
  depth = 0,
  variant = "builder",
}: {
  section: GenericDocumentSection
  itemLabel: string
  depth?: number
  variant?: "builder" | "catalog" | "catalogCard" | "session"
}) {
  const compact = variant === "catalogCard"

  if (section.kind === "field") {
    return (
      <div className={compact ? "space-y-0.5 py-1" : "space-y-1.5 py-2"}>
        <p
          className={cn(
            "font-medium uppercase text-muted-foreground",
            compact
              ? "text-[9px] tracking-[0.14em]"
              : "text-xs tracking-[0.18em]"
          )}
        >
          {section.label}
        </p>
        {Array.isArray(section.value) ? (
          <ul
            className={cn(
              "list-disc pl-5 text-foreground/90",
              compact
                ? "space-y-0.5 text-[10px] leading-[0.9rem]"
                : "space-y-1 text-sm leading-6"
            )}
          >
            {section.value.map((item, index) => (
              <li key={`${section.label}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p
            className={cn(
              "whitespace-pre-wrap text-foreground/90",
              compact ? "text-[10px] leading-[0.9rem]" : "text-sm leading-6"
            )}
          >
            {section.value}
          </p>
        )}
      </div>
    )
  }

  if (section.kind === "group") {
    return (
      <section className={compact ? "space-y-2 pt-2.5 first:pt-0" : "space-y-3 pt-5 first:pt-0"}>
        <div className={compact ? "border-b border-border/60 pb-1" : "border-b border-border/60 pb-2"}>
          <h3
            className={cn(
              "font-semibold text-foreground",
              compact ? "text-[11px]" : "text-sm"
            )}
          >
            {section.label}
          </h3>
        </div>
        <div className={depth > 0 ? "border-l border-border/50 pl-4" : ""}>
          <div className={compact ? "space-y-0" : "space-y-1"}>
            {section.children.map((child) => (
              <SectionView
                key={`${section.label}-${child.label}`}
                section={child}
                itemLabel={itemLabel}
                depth={depth + 1}
                variant={variant}
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  const repeatableItemLabel = section.itemLabel || itemLabel

  return (
    <section className={compact ? "space-y-2 pt-2.5 first:pt-0" : "space-y-3 pt-5 first:pt-0"}>
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b border-border/60",
          compact ? "pb-1" : "pb-2"
        )}
      >
        <h3
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-[11px]" : "text-sm"
          )}
        >
          {section.label}
        </h3>
        <span className={compact ? "text-[10px] text-muted-foreground" : "text-xs text-muted-foreground"}>
          {section.items.length}
        </span>
      </div>
      <div className={compact ? "space-y-1.5" : "space-y-3"}>
        {section.items.map((itemSections, index) => (
          <div
            key={`${section.label}-${index}`}
            className={compact ? "rounded-lg bg-muted/20 px-3 py-1.5" : "rounded-xl bg-muted/20 px-4 py-3"}
          >
            <p
              className={cn(
                "font-medium uppercase text-muted-foreground",
                compact
                  ? "text-[9px] tracking-[0.14em]"
                  : "text-xs tracking-[0.18em]"
              )}
            >
              {repeatableItemLabel} {index + 1}
            </p>
            <div className={compact ? "mt-1 space-y-0" : "mt-2 space-y-1"}>
              {itemSections.map((child) => (
                <SectionView
                  key={`${section.label}-${index}-${child.label}`}
                  section={child}
                  itemLabel={itemLabel}
                  depth={depth + 1}
                  variant={variant}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function GenericDocumentPreview({
  sections,
  variant = "builder",
}: {
  sections: GenericDocumentSection[]
  variant?: "builder" | "catalog" | "catalogCard" | "session"
}) {
  const t = useTranslations("DocumentBuilder")
  const itemLabel = t("preview.sampleItem")

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
        {t("preview.emptyRendered")}
      </div>
    )
  }

  return (
    <div
      className={
        variant === "catalog"
          ? "space-y-2"
          : variant === "catalogCard"
            ? "space-y-1"
          : variant === "session"
            ? "space-y-3"
            : "space-y-1"
      }
    >
      {sections.map((section) => (
        <SectionView
          key={`${section.kind}-${section.label}`}
          section={section}
          itemLabel={itemLabel}
          variant={variant}
        />
      ))}
    </div>
  )
}
