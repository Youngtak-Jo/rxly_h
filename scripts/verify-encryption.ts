
import { PrismaClient } from "@prisma/client"
import { encryptField, decryptField } from "@/lib/encryption"

const prisma = new PrismaClient()

async function verifyEncryption() {
    console.log("Starting verification...")

    const testSessionId = "test-session-" + Date.now()
    const testPatientName = "Test Patient " + Date.now()
    const testUserId = "user-" + Date.now()

    try {
        // 1. Create a session with PHI via the application's Prisma client (which has middleware)
        // We need to import the *extended* client from lib/prisma, but for this script we might verify logic directly or simulate middleware
        // Actually, to test the *middleware*, we should use the app's export if possible, but we can't easily import from src in a standalone script without ts-node setup matching next.js

        // Alternative: We will use the standalone encryption functions to verify they work with the key
        console.log("Checking encryption key presence:", !!process.env.PHI_ENCRYPTION_KEY)

        const original = "Sensitive Data 123"
        const encrypted = encryptField(original)
        console.log("Encrypted:", encrypted)

        if (encrypted === original) {
            console.error("FAIL: Data was not encrypted")
            process.exit(1)
        }

        if (!encrypted?.includes(":")) {
            console.error("FAIL: Encrypted format invalid")
            process.exit(1)
        }

        const decrypted = decryptField(encrypted)
        console.log("Decrypted:", decrypted)

        if (decrypted !== original) {
            console.error("FAIL: Decryption mismatch")
            process.exit(1)
        }

        console.log("Encryption/Decryption functions verified.")

    } catch (error) {
        console.error("Verification failed:", error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

verifyEncryption()
