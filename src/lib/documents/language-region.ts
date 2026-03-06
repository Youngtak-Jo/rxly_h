import type { UiLocale } from "@/i18n/config"
import {
  DOCUMENT_TEMPLATE_LANGUAGES,
  DOCUMENT_TEMPLATE_REGIONS,
  type DocumentTemplateLanguage,
  type DocumentTemplateRegion,
} from "@/types/document"

export const DEFAULT_DOCUMENT_LANGUAGE: DocumentTemplateLanguage = "en"
export const DEFAULT_DOCUMENT_REGION: DocumentTemplateRegion = "global"
export type UserRegion = Exclude<DocumentTemplateRegion, "global">
export const USER_REGIONS: UserRegion[] = ["kr", "us"]

export function normalizeDocumentLanguage(
  value: string | null | undefined
): DocumentTemplateLanguage | undefined {
  if (!value) return undefined

  const normalized = value.trim().toLowerCase()
  if (normalized.startsWith("ko")) return "ko"
  if (normalized.startsWith("en")) return "en"

  return undefined
}

export function normalizeDocumentRegion(
  value: string | null | undefined
): DocumentTemplateRegion | undefined {
  if (!value) return undefined

  const normalized = value.trim().toLowerCase()
  if (
    normalized === "global" ||
    normalized === "intl" ||
    normalized === "international" ||
    normalized === "worldwide"
  ) {
    return "global"
  }

  if (
    normalized === "kr" ||
    normalized === "ko-kr" ||
    normalized === "korea" ||
    normalized === "south korea"
  ) {
    return "kr"
  }

  if (
    normalized === "us" ||
    normalized === "usa" ||
    normalized === "en-us" ||
    normalized === "united states" ||
    normalized === "united states of america"
  ) {
    return "us"
  }

  return undefined
}

export function resolveDocumentLanguage(
  value: string | null | undefined,
  fallback: DocumentTemplateLanguage = DEFAULT_DOCUMENT_LANGUAGE
): DocumentTemplateLanguage {
  return normalizeDocumentLanguage(value) ?? fallback
}

export function resolveDocumentRegion(
  value: string | null | undefined,
  fallback: DocumentTemplateRegion = DEFAULT_DOCUMENT_REGION
): DocumentTemplateRegion {
  return normalizeDocumentRegion(value) ?? fallback
}

export function normalizeUserRegion(
  value: string | null | undefined
): UserRegion | undefined {
  const normalized = normalizeDocumentRegion(value)
  if (!normalized || normalized === "global") return undefined
  return normalized
}

export function getDefaultUserRegion(locale: UiLocale): UserRegion {
  return locale === "ko" ? "kr" : "us"
}

export function resolveUserRegion(
  value: string | null | undefined,
  locale: UiLocale
): UserRegion {
  return normalizeUserRegion(value) ?? getDefaultUserRegion(locale)
}

export function inferDocumentRegionFromText(
  value: string
): DocumentTemplateRegion | undefined {
  const normalized = value.toLowerCase()
  if (
    /(?:\bhira\b|\bedi\b|대한민국|한국|국내|건보|심평원|hira|korea)/i.test(value)
  ) {
    return "kr"
  }

  if (
    /\b(?:cms|medicare|medicaid|cpt|hcpcs|icd-10-cm|united states|u\.s\.|usa|us)\b/i.test(
      normalized
    )
  ) {
    return "us"
  }

  if (/\b(?:global|international|worldwide)\b/i.test(normalized)) {
    return "global"
  }

  return undefined
}

export function documentLanguageToUiLocale(
  language: DocumentTemplateLanguage
): UiLocale {
  return language
}

export function getDocumentLanguageOptions(): Array<{
  value: DocumentTemplateLanguage
  labelKey: `languages.${DocumentTemplateLanguage}`
}> {
  return DOCUMENT_TEMPLATE_LANGUAGES.map((value) => ({
    value,
    labelKey: `languages.${value}` as const,
  }))
}

export function getDocumentRegionOptions(): Array<{
  value: DocumentTemplateRegion
  labelKey: `regions.${DocumentTemplateRegion}`
}> {
  return DOCUMENT_TEMPLATE_REGIONS.map((value) => ({
    value,
    labelKey: `regions.${value}` as const,
  }))
}

export function getUserRegionOptions(): Array<{
  value: UserRegion
  labelKey: `regions.${UserRegion}`
}> {
  return USER_REGIONS.map((value) => ({
    value,
    labelKey: `regions.${value}` as const,
  }))
}
