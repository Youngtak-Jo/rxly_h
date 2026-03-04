export interface RecordingCaptureConfig {
  recorderMimeType: string
  storageMimeType: string
  extension: "mp4" | "webm" | "ogg"
}

interface RecordingProbeSuccess extends RecordingCaptureConfig {
  blobType: string
  fileSizeBytes: number
  metadataLoaded: boolean
}

interface RecordingProbeFailure {
  recorderMimeType: string
  reason: string
  blobType: string | null
  fileSizeBytes: number
  metadataLoaded: boolean
}

const RECORDING_CAPTURE_CACHE_KEY = "recording-capture-format-v1"
const RECORDING_PROBE_DURATION_MS = 220
const RECORDING_PROBE_TIMEOUT_MS = 2500
const RECORDING_LOAD_TIMEOUT_MS = 2000

const RECORDING_CAPTURE_CANDIDATES = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "video/mp4;codecs=mp4a.40.2",
  "video/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const

let memoryCaptureConfig: RecordingCaptureConfig | null | undefined
let probePromise: Promise<RecordingCaptureConfig | null> | null = null

function isBrowserRuntime() {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

function isValidCaptureConfig(
  value: unknown
): value is RecordingCaptureConfig {
  if (!value || typeof value !== "object") return false

  const candidate = value as Partial<RecordingCaptureConfig>
  return (
    typeof candidate.recorderMimeType === "string" &&
    typeof candidate.storageMimeType === "string" &&
    (candidate.extension === "mp4" ||
      candidate.extension === "webm" ||
      candidate.extension === "ogg")
  )
}

function readCachedCaptureConfig(): RecordingCaptureConfig | null {
  if (!isBrowserRuntime()) return null

  try {
    const raw = window.sessionStorage.getItem(RECORDING_CAPTURE_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!isValidCaptureConfig(parsed)) return null
    if (
      typeof MediaRecorder === "undefined" ||
      typeof MediaRecorder.isTypeSupported !== "function"
    ) {
      return null
    }
    if (!MediaRecorder.isTypeSupported(parsed.recorderMimeType)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeCachedCaptureConfig(config: RecordingCaptureConfig | null) {
  if (!isBrowserRuntime()) return

  try {
    if (!config) {
      window.sessionStorage.removeItem(RECORDING_CAPTURE_CACHE_KEY)
      return
    }

    window.sessionStorage.setItem(
      RECORDING_CAPTURE_CACHE_KEY,
      JSON.stringify(config)
    )
  } catch {
    // Ignore storage failures.
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function cleanupAudioElement(audio: HTMLAudioElement, objectUrl: string) {
  audio.pause()
  audio.removeAttribute("src")
  audio.load()
  URL.revokeObjectURL(objectUrl)
}

async function loadProbeBlob(blob: Blob) {
  if (!isBrowserRuntime()) {
    return { success: false, metadataLoaded: false }
  }

  return await new Promise<{ success: boolean; metadataLoaded: boolean }>(
    (resolve) => {
      const audio = document.createElement("audio")
      const objectUrl = URL.createObjectURL(blob)
      let settled = false
      let metadataLoaded = false

      const finish = (success: boolean) => {
        if (settled) return
        settled = true
        window.clearTimeout(timeoutId)
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
        audio.removeEventListener("canplay", handleCanPlay)
        audio.removeEventListener("error", handleError)
        cleanupAudioElement(audio, objectUrl)
        resolve({ success, metadataLoaded })
      }

      const handleLoadedMetadata = () => {
        metadataLoaded = true
        finish(true)
      }

      const handleCanPlay = () => {
        metadataLoaded = true
        finish(true)
      }

      const handleError = () => {
        finish(false)
      }

      const timeoutId = window.setTimeout(() => {
        finish(false)
      }, RECORDING_LOAD_TIMEOUT_MS)

      audio.preload = "metadata"
      audio.setAttribute("playsinline", "true")
      audio.src = objectUrl
      audio.addEventListener("loadedmetadata", handleLoadedMetadata)
      audio.addEventListener("canplay", handleCanPlay)
      audio.addEventListener("error", handleError)
      audio.load()
    }
  )
}

async function recordProbeBlob(recorderMimeType: string) {
  if (
    !isBrowserRuntime() ||
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return null
  }

  const AudioContextConstructor =
    window.AudioContext ||
    (window as typeof window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext

  if (!AudioContextConstructor) {
    return null
  }

  const audioContext = new AudioContextConstructor()
  const destination = audioContext.createMediaStreamDestination()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  const chunks: Blob[] = []

  oscillator.type = "sine"
  oscillator.frequency.value = 440
  gainNode.gain.value = 0.0001
  oscillator.connect(gainNode)
  gainNode.connect(destination)

  try {
    await audioContext.resume()
  } catch {
    // Some browsers may already be running.
  }

  return await new Promise<Blob | null>((resolve) => {
    let settled = false

    const cleanup = async () => {
      try {
        oscillator.disconnect()
      } catch {}
      try {
        gainNode.disconnect()
      } catch {}
      try {
        destination.stream.getTracks().forEach((track) => track.stop())
      } catch {}
      try {
        if (audioContext.state !== "closed") {
          await audioContext.close()
        }
      } catch {}
    }

    const finish = async (blob: Blob | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timeoutId)
      try {
        mediaRecorder.removeEventListener("dataavailable", handleDataAvailable)
        mediaRecorder.removeEventListener("stop", handleStop)
        mediaRecorder.removeEventListener("error", handleError)
      } catch {}
      await cleanup()
      resolve(blob)
    }

    const handleDataAvailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    const handleStop = () => {
      const blob = new Blob(chunks, {
        type: mediaRecorder.mimeType || recorderMimeType,
      })
      void finish(blob.size > 0 ? blob : null)
    }

    const handleError = () => {
      void finish(null)
    }

    const timeoutId = window.setTimeout(() => {
      try {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop()
          return
        }
      } catch {}
      void finish(null)
    }, RECORDING_PROBE_TIMEOUT_MS)

    let mediaRecorder: MediaRecorder

    try {
      mediaRecorder = new MediaRecorder(destination.stream, {
        mimeType: recorderMimeType,
      })
    } catch {
      void finish(null)
      return
    }

    mediaRecorder.addEventListener("dataavailable", handleDataAvailable)
    mediaRecorder.addEventListener("stop", handleStop)
    mediaRecorder.addEventListener("error", handleError)

    try {
      oscillator.start()
      mediaRecorder.start()
    } catch {
      void finish(null)
      return
    }

    void delay(RECORDING_PROBE_DURATION_MS).then(() => {
      try {
        oscillator.stop()
      } catch {}
      try {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop()
        }
      } catch {
        void finish(null)
      }
    })
  })
}

function validateExtension(
  extension: string | null
): extension is RecordingCaptureConfig["extension"] {
  return extension === "mp4" || extension === "webm" || extension === "ogg"
}

async function probeRecorderMimeType(
  recorderMimeType: string
): Promise<RecordingProbeSuccess | RecordingProbeFailure> {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function" ||
    !MediaRecorder.isTypeSupported(recorderMimeType)
  ) {
    return {
      recorderMimeType,
      reason: "unsupported-recorder-mime",
      blobType: null,
      fileSizeBytes: 0,
      metadataLoaded: false,
    }
  }

  const blob = await recordProbeBlob(recorderMimeType)
  if (!blob) {
    return {
      recorderMimeType,
      reason: "probe-record-failed",
      blobType: null,
      fileSizeBytes: 0,
      metadataLoaded: false,
    }
  }

  const blobType = blob.type || recorderMimeType
  const playbackResult = await loadProbeBlob(blob)
  if (!playbackResult.success) {
    return {
      recorderMimeType,
      reason: "probe-playback-failed",
      blobType,
      fileSizeBytes: blob.size,
      metadataLoaded: playbackResult.metadataLoaded,
    }
  }

  const storageMimeType = normalizeRecordingMimeType(blobType)
  const extension = getRecordingExtension(storageMimeType)
  if (!validateExtension(extension)) {
    return {
      recorderMimeType,
      reason: "unsupported-storage-mime",
      blobType,
      fileSizeBytes: blob.size,
      metadataLoaded: playbackResult.metadataLoaded,
    }
  }

  return {
    recorderMimeType,
    storageMimeType,
    extension,
    blobType,
    fileSizeBytes: blob.size,
    metadataLoaded: playbackResult.metadataLoaded,
  }
}

export function normalizeRecordingMimeType(
  mimeType: string | null | undefined
): string {
  const baseMimeType = mimeType?.split(";")[0]?.trim() || ""
  if (baseMimeType === "video/mp4") {
    return "audio/mp4"
  }
  return baseMimeType
}

export function getRecordingExtension(
  mimeType: string | null | undefined
): RecordingCaptureConfig["extension"] | null {
  const normalized = normalizeRecordingMimeType(mimeType)

  if (normalized === "audio/mp4") return "mp4"
  if (normalized === "audio/webm") return "webm"
  if (normalized === "audio/ogg") return "ogg"
  return null
}

export function clearRecordingCaptureConfigCache() {
  memoryCaptureConfig = undefined
  probePromise = null
  writeCachedCaptureConfig(null)
}

export function logRecordingDiagnostic(
  event:
    | "recording_probe_selected"
    | "recording_probe_failed"
    | "recording_segment_finalized"
    | "recording_playback_error",
  payload: Record<string, unknown>
) {
  if (process.env.NODE_ENV === "production") return
  console.debug(`[${event}]`, payload)
}

export async function probeRecordingCaptureConfig(
  sessionId?: string
): Promise<RecordingCaptureConfig | null> {
  if (!isBrowserRuntime()) {
    return null
  }

  if (memoryCaptureConfig !== undefined) {
    return memoryCaptureConfig
  }

  const cached = readCachedCaptureConfig()
  if (cached) {
    memoryCaptureConfig = cached
    return cached
  }

  if (probePromise) {
    return await probePromise
  }

  probePromise = (async () => {
    const failures: RecordingProbeFailure[] = []

    for (const candidate of RECORDING_CAPTURE_CANDIDATES) {
      const result = await probeRecorderMimeType(candidate)

      if ("storageMimeType" in result) {
        const config: RecordingCaptureConfig = {
          recorderMimeType: result.recorderMimeType,
          storageMimeType: result.storageMimeType,
          extension: result.extension,
        }

        memoryCaptureConfig = config
        writeCachedCaptureConfig(config)
        logRecordingDiagnostic("recording_probe_selected", {
          sessionId,
          chosenMime: result.storageMimeType,
          recorderMime: result.recorderMimeType,
          blobType: result.blobType,
          fileSizeBytes: result.fileSizeBytes,
          metadataLoaded: result.metadataLoaded,
        })
        return config
      }

      failures.push(result)
    }

    memoryCaptureConfig = null
    writeCachedCaptureConfig(null)
    logRecordingDiagnostic("recording_probe_failed", {
      sessionId,
      failures,
    })
    return null
  })()

  try {
    return await probePromise
  } finally {
    probePromise = null
  }
}
