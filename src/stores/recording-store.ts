import { create } from "zustand"

export interface SimulationControls {
  pause: () => void
  resume: () => void
  stop: (options?: { skipFinalAnalysis?: boolean }) => void
}

interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  error: string | null
  isSimulating: boolean
  simulationControls: SimulationControls | null
  setRecording: (recording: boolean) => void
  setPaused: (paused: boolean) => void
  setDuration: (duration: number) => void
  setError: (error: string | null) => void
  setSimulating: (isSimulating: boolean) => void
  setSimulationControls: (controls: SimulationControls | null) => void
  reset: () => void
}

export const useRecordingStore = create<RecordingState>((set) => ({
  isRecording: false,
  isPaused: false,
  duration: 0,
  error: null,
  isSimulating: false,
  simulationControls: null,

  setRecording: (isRecording) =>
    set({ isRecording, isPaused: false, error: null }),

  setPaused: (isPaused) => set({ isPaused }),

  setDuration: (duration) => set({ duration }),

  setError: (error) => set({ error, isRecording: false, isPaused: false }),

  setSimulating: (isSimulating) => set({ isSimulating }),

  setSimulationControls: (simulationControls) => set({ simulationControls }),

  reset: () =>
    set({
      isRecording: false,
      isPaused: false,
      duration: 0,
      error: null,
      isSimulating: false,
      simulationControls: null,
    }),
}))
