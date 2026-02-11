import { create } from "zustand"

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  error: string | null
  setRecording: (recording: boolean) => void
  setPaused: (paused: boolean) => void
  setDuration: (duration: number) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  isPaused: false,
  duration: 0,
  error: null,

  setRecording: (isRecording) =>
    set({ isRecording, isPaused: false, error: null }),

  setPaused: (isPaused) => set({ isPaused }),

  setDuration: (duration) => set({ duration }),

  setError: (error) => set({ error, isRecording: false, isPaused: false }),

  reset: () =>
    set({
      isRecording: false,
      isPaused: false,
      duration: 0,
      error: null,
    }),
}))
