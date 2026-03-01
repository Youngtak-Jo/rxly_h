import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

const ROOT = process.cwd()
const MESSAGES_DIR = path.join(ROOT, "src", "messages")
const LOCALES = ["en", "ko"]

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

async function loadLocaleMessages(locale) {
  const localeDir = path.join(MESSAGES_DIR, locale)
  const entries = await readdir(localeDir, { withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort()

  const merged = {}

  for (const file of files) {
    const filePath = path.join(localeDir, file)
    const raw = await readFile(filePath, "utf8")
    const parsed = JSON.parse(raw)

    for (const [key, value] of Object.entries(parsed)) {
      if (key in merged) {
        throw new Error(`Duplicate top-level namespace "${key}" in ${locale}/${file}`)
      }
      merged[key] = value
    }
  }

  return merged
}

function compareShapes(baseValue, compareValue, currentPath, errors) {
  const baseIsObject = isPlainObject(baseValue)
  const compareIsObject = isPlainObject(compareValue)

  if (baseIsObject !== compareIsObject) {
    errors.push(`${currentPath}: value type mismatch`)
    return
  }

  if (!baseIsObject || !compareIsObject) {
    return
  }

  const baseKeys = Object.keys(baseValue).sort()
  const compareKeys = new Set(Object.keys(compareValue))

  for (const key of baseKeys) {
    const nextPath = currentPath ? `${currentPath}.${key}` : key
    if (!compareKeys.has(key)) {
      errors.push(`${nextPath}: missing in comparison locale`)
      continue
    }

    compareShapes(baseValue[key], compareValue[key], nextPath, errors)
    compareKeys.delete(key)
  }

  for (const key of [...compareKeys].sort()) {
    const nextPath = currentPath ? `${currentPath}.${key}` : key
    errors.push(`${nextPath}: extra key in comparison locale`)
  }
}

async function main() {
  const [baseLocale, compareLocale] = LOCALES
  const [baseMessages, compareMessages] = await Promise.all(
    LOCALES.map((locale) => loadLocaleMessages(locale))
  )

  const errors = []
  compareShapes(baseMessages, compareMessages, "", errors)

  if (errors.length > 0) {
    console.error(`i18n parity check failed between ${baseLocale} and ${compareLocale}:`)
    for (const error of errors) {
      console.error(`- ${error}`)
    }
    process.exitCode = 1
    return
  }

  console.log(`i18n parity check passed for ${baseLocale} and ${compareLocale}.`)
}

await main()
