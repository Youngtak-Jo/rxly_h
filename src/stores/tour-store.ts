import { create } from "zustand"

interface TourState {
  isActive: boolean
  startTour: () => void
  endTour: () => void
}

export const useTourStore = create<TourState>((set) => ({
  isActive: false,
  startTour: () => set({ isActive: true }),
  endTour: () => set({ isActive: false }),
}))
