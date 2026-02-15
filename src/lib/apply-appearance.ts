import type { FontSize, UiDensity, BorderRadius } from "@/stores/settings-store"

const FONT_SIZE_CLASSES = [
  "font-size-small",
  "font-size-large",
  "font-size-extra-large",
] as const

const DENSITY_CLASSES = ["density-compact", "density-comfortable"] as const

const RADIUS_CLASSES = ["radius-none", "radius-small", "radius-large"] as const

export function applyFontSize(fontSize: FontSize) {
  const html = document.documentElement
  html.classList.remove(...FONT_SIZE_CLASSES)
  if (fontSize !== "default") {
    html.classList.add(`font-size-${fontSize}`)
  }
}

export function applyUiDensity(uiDensity: UiDensity) {
  const html = document.documentElement
  html.classList.remove(...DENSITY_CLASSES)
  if (uiDensity !== "default") {
    html.classList.add(`density-${uiDensity}`)
  }
}

export function applyBorderRadius(borderRadius: BorderRadius) {
  const html = document.documentElement
  html.classList.remove(...RADIUS_CLASSES)
  if (borderRadius !== "default") {
    html.classList.add(`radius-${borderRadius}`)
  }
}

export function applyAllAppearanceSettings(appearance: {
  fontSize: FontSize
  uiDensity: UiDensity
  borderRadius: BorderRadius
}) {
  applyFontSize(appearance.fontSize)
  applyUiDensity(appearance.uiDensity)
  applyBorderRadius(appearance.borderRadius)
}

const A11Y_CLASSES = [
  "a11y-reduced-motion",
  "a11y-high-contrast",
  "a11y-enhanced-focus",
  "a11y-text-spacing",
  "a11y-large-targets",
] as const

export function applyAccessibilitySettings(a11y: {
  reducedMotion: boolean
  highContrast: boolean
  enhancedFocusIndicators: boolean
  textSpacing: boolean
  largeClickTargets: boolean
}) {
  const html = document.documentElement
  html.classList.remove(...A11Y_CLASSES)
  if (a11y.reducedMotion) html.classList.add("a11y-reduced-motion")
  if (a11y.highContrast) html.classList.add("a11y-high-contrast")
  if (a11y.enhancedFocusIndicators) html.classList.add("a11y-enhanced-focus")
  if (a11y.textSpacing) html.classList.add("a11y-text-spacing")
  if (a11y.largeClickTargets) html.classList.add("a11y-large-targets")
}
