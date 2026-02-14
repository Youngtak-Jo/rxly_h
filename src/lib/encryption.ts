import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const TAG_LENGTH = 16
const ENCODING = "base64" as const

let _key: Buffer | null = null

function getKey(): Buffer {
  if (!_key) {
    const secret = process.env.PHI_ENCRYPTION_KEY
    if (!secret) {
      throw new Error("PHI_ENCRYPTION_KEY environment variable is not configured")
    }
    _key = scryptSync(secret, "rxly-phi-salt", 32)
  }
  return _key
}

export function encryptField(plaintext: string | null | undefined): string | null {
  if (!plaintext) return plaintext as null
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted.toString(ENCODING)}`
}

export function decryptField(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return ciphertext as null
  // If it doesn't look like our encrypted format, return as-is (supports legacy plaintext data)
  if (!ciphertext.includes(":")) return ciphertext
  const parts = ciphertext.split(":")
  if (parts.length !== 3) return ciphertext
  try {
    const iv = Buffer.from(parts[0], ENCODING)
    const tag = Buffer.from(parts[1], ENCODING)
    const encrypted = Buffer.from(parts[2], ENCODING)
    if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) return ciphertext
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
  } catch {
    // If decryption fails, assume it's plaintext (migration period)
    return ciphertext
  }
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
