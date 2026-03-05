"use client"

import { useTranslations } from "next-intl"

import type { GenericDocumentSection } from "@/types/document"

function SectionView({
  section,
  itemLabel,
  depth = 0,
}: {
  section: GenericDocumentSection
  itemLabel: string
  depth?: number
}) {
  if (section.kind === "field") {
    return (
      <div className="space-y-1.5 py-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {section.label}
        </p>
        {Array.isArray(section.value) ? (
          <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-foreground/90">
            {section.value.map((item, index) => (
              <li key={`${section.label}-${index}`}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
            {section.value}
          </p>
        )}
      </div>
    )
  }

  if (section.kind === "group") {
    return (
      <section className="space-y-3 pt-5 first:pt-0">
        <div className="border-b border-border/60 pb-2">
          <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
        </div>
        <div className={depth > 0 ? "border-l border-border/50 pl-4" : ""}>
          <div className="space-y-1">
            {section.children.map((child) => (
              <SectionView
                key={`${section.label}-${child.label}`}
                section={child}
                itemLabel={itemLabel}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3 pt-5 first:pt-0">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
        <h3 className="text-sm font-semibold text-foreground">{section.label}</h3>
        <span className="text-xs text-muted-foreground">
          {section.items.length}
        </span>
      </div>
      <div className="space-y-3">
        {section.items.map((itemSections, index) => (
          <div
            key={`${section.label}-${index}`}
            className="rounded-xl bg-muted/20 px-4 py-3"
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {itemLabel} {index + 1}
            </p>
            <div className="mt-2 space-y-1">
              {itemSections.map((child) => (
                <SectionView
                  key={`${section.label}-${index}-${child.label}`}
                  section={child}
                  itemLabel={itemLabel}
                  depth={depth + 1}
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
  variant?: "builder" | "catalog" | "session"
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
        />
      ))}
    </div>
  )
}
