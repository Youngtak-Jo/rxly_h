import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto"
import { logger } from "@/lib/logger"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 16
const ENCODING = "base64" as const

// Cache derived keys by salt to avoid repeated scrypt calls for reads
const _keyCache = new Map<string, Buffer>()
let _legacyKey: Buffer | null = null

function getSecret(): string {
  const secret = process.env.PHI_ENCRYPTION_KEY
  if (!secret) {
    throw new Error("PHI_ENCRYPTION_KEY environment variable is not configured")
  }
  return secret
}

/** Derive a key from the secret + salt using scrypt. Cached per salt. */
function deriveKey(salt: Buffer): Buffer {
  const saltHex = salt.toString("hex")
  let key = _keyCache.get(saltHex)
  if (!key) {
    key = scryptSync(getSecret(), salt, 32)
    _keyCache.set(saltHex, key)
  }
  return key
}

/** Get the legacy key (static salt "rxly-phi-salt") for reading old 3-part format. */
function getLegacyKey(): Buffer {
  if (!_legacyKey) {
    _legacyKey = scryptSync(getSecret(), "rxly-phi-salt", 32)
  }
  return _legacyKey
}

/**
 * Encrypt a plaintext string using AES-256-GCM with a per-record random salt.
 * Output format: salt:iv:tag:encrypted (all base64)
 */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (!plaintext) return plaintext as null
  const salt = randomBytes(SALT_LENGTH)
  const key = deriveKey(salt)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `${salt.toString(ENCODING)}:${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted.toString(ENCODING)}`
}

/**
 * Decrypt a ciphertext string. Supports:
 * - 4-part format (salt:iv:tag:encrypted) - new per-record salt
 * - 3-part format (iv:tag:encrypted) - legacy static salt
 * - Unencrypted plaintext (migration fallback with warning)
 */
export function decryptField(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return ciphertext as null

  // If it doesn't look like our encrypted format, return as-is (legacy plaintext)
  if (!ciphertext.includes(":")) {
    logger.warn("[ENCRYPTION] Unencrypted PHI field detected during decryption")
    return ciphertext
  }

  const parts = ciphertext.split(":")

  // New format: salt:iv:tag:encrypted (4 parts)
  if (parts.length === 4) {
    try {
      const salt = Buffer.from(parts[0], ENCODING)
      const iv = Buffer.from(parts[1], ENCODING)
      const tag = Buffer.from(parts[2], ENCODING)
      const encrypted = Buffer.from(parts[3], ENCODING)
      if (salt.length !== SALT_LENGTH || iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
        logger.warn("[ENCRYPTION] Invalid buffer lengths in 4-part ciphertext")
        return ciphertext
      }
      const key = deriveKey(salt)
      const decipher = createDecipheriv(ALGORITHM, key, iv)
      decipher.setAuthTag(tag)
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
    } catch (error) {
      logger.error("[ENCRYPTION] Failed to decrypt 4-part ciphertext:", {
        error: error instanceof Error ? error.message : String(error),
      })
      return ciphertext
    }
  }

  // Legacy format: iv:tag:encrypted (3 parts)
  if (parts.length === 3) {
    try {
      const iv = Buffer.from(parts[0], ENCODING)
      const tag = Buffer.from(parts[1], ENCODING)
      const encrypted = Buffer.from(parts[2], ENCODING)
      if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) return ciphertext
      const decipher = createDecipheriv(ALGORITHM, getLegacyKey(), iv)
      decipher.setAuthTag(tag)
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
    } catch (error) {
      logger.warn("[ENCRYPTION] Failed to decrypt legacy 3-part ciphertext:", {
        error: error instanceof Error ? error.message : String(error),
      })
      return ciphertext
    }
  }

  // Unknown format
  logger.warn("[ENCRYPTION] Unrecognized ciphertext format (parts=" + parts.length + ")")
  return ciphertext
}

export function encryptJson(obj: unknown): string | null {
  if (obj === null || obj === undefined) return null
  return encryptField(JSON.stringify(obj))
}

export function decryptJson<T = unknown>(ciphertext: string | null | undefined): T | null {
  if (!ciphertext) return null
  const decrypted = decryptField(ciphertext)
  if (!decrypted) return null
  try {
    return JSON.parse(decrypted) as T
  } catch {
    // If it's not valid JSON after decryption, try parsing the original
    // (handles legacy unencrypted JSON stored as string)
    try {
      return JSON.parse(ciphertext) as T
    } catch {
      return null
    }
  }
}
