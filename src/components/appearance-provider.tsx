"use client"

import { useEffect } from "react"
import { useSettingsStore } from "@/stores/settings-store"
import { applyAllAppearanceSettings, applyAccessibilitySettings } from "@/lib/apply-appearance"

export function AppearanceProvider() {
  const { fontSize, uiDensity, borderRadius } = useSettingsStore(
    (s) => s.appearance
  )
  const accessibility = useSettingsStore((s) => s.accessibility)

  useEffect(() => {
    applyAllAppearanceSettings({ fontSize, uiDensity, borderRadius })
  }, [fontSize, uiDensity, borderRadius])

  useEffect(() => {
    applyAccessibilitySettings(accessibility)
  }, [accessibility])

  return null
}
