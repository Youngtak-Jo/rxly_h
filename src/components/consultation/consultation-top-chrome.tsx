"use client"

import type { CSSProperties, ComponentProps } from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

export const CONSULTATION_TOP_RAIL_HEIGHT = 44

export const TOP_RAIL_CLASS =
  "flex h-[var(--consultation-top-rail-height)] items-stretch overflow-hidden border-b border-border/80 bg-muted/55"

export const TOP_RAIL_SCROLL_CLASS =
  "flex h-full w-max min-w-full max-w-none flex-1 items-stretch justify-start gap-0 overflow-visible rounded-none border-0 bg-transparent p-0"

export const SEGMENT_BASE_CLASS =
  "group relative inline-flex h-[var(--consultation-top-rail-height)] flex-none shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-none border-0 px-3.5 text-sm font-medium shadow-none outline-none transition-[background-color,color,border-color,box-shadow] after:hidden focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"

export const SEGMENT_ACTIVE_CLASS =
  "bg-background text-foreground shadow-[inset_0_0_0_1px_var(--border)]"

export const SEGMENT_INACTIVE_CLASS =
  "bg-transparent text-muted-foreground hover:bg-background/55 hover:text-foreground"

export const SEGMENT_SEPARATOR_CLASS =
  "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border/70 first:before:hidden"

export const TOP_RAIL_ACTION_CLASS = SEGMENT_BASE_CLASS

type RailClassOptions = {
  active?: boolean
  className?: string
}

export function consultationSegmentClassName({
  active = false,
  className,
}: RailClassOptions = {}) {
  return cn(
    SEGMENT_BASE_CLASS,
    SEGMENT_SEPARATOR_CLASS,
    active ? SEGMENT_ACTIVE_CLASS : SEGMENT_INACTIVE_CLASS,
    className
  )
}

export function consultationRailActionClassName({
  active = false,
  className,
}: RailClassOptions = {}) {
  return cn(
    TOP_RAIL_ACTION_CLASS,
    SEGMENT_SEPARATOR_CLASS,
    active ? SEGMENT_ACTIVE_CLASS : SEGMENT_INACTIVE_CLASS,
    className
  )
}

export function ConsultationTopRail({
  className,
  style,
  ...props
}: ComponentProps<"div">) {
  const railStyle = {
    "--consultation-top-rail-height": `${CONSULTATION_TOP_RAIL_HEIGHT}px`,
    ...style,
  } as CSSProperties

  return (
    <div
      className={cn(TOP_RAIL_CLASS, className)}
      style={railStyle}
      {...props}
    />
  )
}

type ConsultationTopRailActionProps = ComponentProps<"button"> & {
  active?: boolean
  asChild?: boolean
}

export function ConsultationTopRailAction({
  active = false,
  asChild = false,
  className,
  type = "button",
  ...props
}: ConsultationTopRailActionProps) {
  const Comp = asChild ? Slot.Root : "button"
  const buttonProps = !asChild ? { type } : {}

  return (
    <Comp
      className={consultationRailActionClassName({ active, className })}
      {...buttonProps}
      {...props}
    />
  )
}
