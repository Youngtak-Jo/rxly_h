import { create } from "zustand"
import { toast } from "sonner"
import type { Bundle, BundleEntry } from "@medplum/fhirtypes"

export type MedplumSyncStatus =
  | "idle"
  | "preparing"
  | "ready"
  | "reviewing"
  | "syncing"
  | "success"
  | "error"

export interface CreatedResource {
  resourceType: string
  id: string
  display?: string
}

interface CachedBundle {
  bundle: Bundle
  editedBundle: Bundle
  createdAt: number
}

// Session-keyed localStorage cache
const CACHE_KEY = "rxly-medplum-bundles"
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

function loadCache(): Record<string, CachedBundle> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, CachedBundle>
    // Evict expired entries
    const now = Date.now()
    const valid: Record<string, CachedBundle> = {}
    for (const [key, entry] of Object.entries(parsed)) {
      if (now - entry.createdAt < CACHE_TTL) {
        valid[key] = entry
      }
    }
    return valid
  } catch {
    return {}
  }
}

function saveToCache(sessionId: string, bundle: Bundle, editedBundle: Bundle) {
  try {
    const cache = loadCache()
    cache[sessionId] = { bundle, editedBundle, createdAt: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage full or unavailable — ignore
  }
}

function getFromCache(sessionId: string): CachedBundle | null {
  const cache = loadCache()
  return cache[sessionId] ?? null
}

function removeFromCache(sessionId: string) {
  try {
    const cache = loadCache()
    delete cache[sessionId]
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore
  }
}

interface MedplumSyncState {
  status: MedplumSyncStatus
  sessionId: string | null
  bundle: Bundle | null
  editedBundle: Bundle | null
  createdResources: CreatedResource[]
  errorMessage: string
  dialogOpen: boolean

  startPrepare: (sessionId: string, payload: Record<string, unknown>) => Promise<void>
  restoreFromCache: (sessionId: string) => boolean
  openReviewDialog: () => void
  closeDialog: () => void
  updatePatientName: (given: string, family: string) => void
  confirmSync: () => Promise<void>
  reset: () => void
}

export const useMedplumSyncStore = create<MedplumSyncState>((set, get) => ({
  status: "idle",
  sessionId: null,
  bundle: null,
  editedBundle: null,
  createdResources: [],
  errorMessage: "",
  dialogOpen: false,

  startPrepare: async (sessionId, payload) => {
    set({ status: "preparing", sessionId, bundle: null, editedBundle: null, errorMessage: "", createdResources: [] })
    try {
      const res = await fetch("/api/medplum/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const { bundle } = await res.json()
      const editedBundle = structuredClone(bundle)
      // Cache for later
      saveToCache(sessionId, bundle, editedBundle)
      set({ status: "ready", bundle, editedBundle })
      toast.success("FHIR data ready for review")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to prepare FHIR data"
      set({ status: "error", errorMessage: message })
      toast.error(`EMR prepare failed: ${message}`)
    }
  },

  restoreFromCache: (sessionId) => {
    const cached = getFromCache(sessionId)
    if (cached) {
      set({
        status: "ready",
        sessionId,
        bundle: cached.bundle,
        editedBundle: cached.editedBundle,
        createdResources: [],
        errorMessage: "",
        dialogOpen: false,
      })
      return true
    }
    set({
      status: "idle",
      sessionId,
      bundle: null,
      editedBundle: null,
      createdResources: [],
      errorMessage: "",
      dialogOpen: false,
    })
    return false
  },

  openReviewDialog: () => {
    set({ status: "reviewing", dialogOpen: true })
  },

  closeDialog: () => {
    const { status, sessionId, editedBundle, bundle } = get()
    if (status === "reviewing") {
      // Save edits back to cache
      if (sessionId && editedBundle && bundle) {
        saveToCache(sessionId, bundle, editedBundle)
      }
      set({ dialogOpen: false, status: "ready" })
    } else {
      set({
        dialogOpen: false,
        status: "idle",
        bundle: null,
        editedBundle: null,
        createdResources: [],
        errorMessage: "",
      })
    }
  },

  updatePatientName: (given, family) => {
    const { editedBundle } = get()
    if (!editedBundle?.entry) return

    const updated = structuredClone(editedBundle)
    const patientEntry = updated.entry?.find(
      (e: BundleEntry) => e.resource?.resourceType === "Patient"
    )
    if (patientEntry?.resource) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const patient = patientEntry.resource as any
      if (!patient.name) patient.name = [{}]
      patient.name[0].given = given ? [given] : []
      patient.name[0].family = family || undefined
    }
    set({ editedBundle: updated })
  },

  confirmSync: async () => {
    const { editedBundle, sessionId } = get()
    if (!editedBundle) return
    set({ status: "syncing" })
    try {
      const res = await fetch("/api/medplum/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle: editedBundle }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      // Clear cache after successful sync
      if (sessionId) removeFromCache(sessionId)
      set({ status: "success", createdResources: data.resources || [] })
      toast.success(`EMR sync complete: ${data.resourceCount} resources created`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sync to EMR"
      set({ status: "error", errorMessage: message })
      toast.error(`EMR sync failed: ${message}`)
    }
  },

  reset: () =>
    set({
      status: "idle",
      sessionId: null,
      bundle: null,
      editedBundle: null,
      createdResources: [],
      errorMessage: "",
      dialogOpen: false,
    }),
}))
