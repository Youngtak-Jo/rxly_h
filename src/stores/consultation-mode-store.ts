import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"

export type ConsultationMode = "doctor" | "ai-doctor"

export interface AiDoctorMessage {
  id: string
  role: "assistant" | "user"
  content: string
  imageUrls?: string[]
  createdAt: string
}

interface ConsultationModeState {
  mode: ConsultationMode
  aiDoctorMessages: AiDoctorMessage[]
  isAiResponding: boolean
  isMicActive: boolean
  consultationStarted: boolean

  setMode: (mode: ConsultationMode) => void
  addMessage: (role: "assistant" | "user", content: string, imageUrls?: string[]) => void
  setAiResponding: (responding: boolean) => void
  setMicActive: (active: boolean) => void
  setConsultationStarted: (started: boolean) => void
  reset: () => void
}

export const useConsultationModeStore = create<ConsultationModeState>(
  (set) => ({
    mode: "doctor",
    aiDoctorMessages: [],
    isAiResponding: false,
    isMicActive: false,
    consultationStarted: false,

    setMode: (mode) => set({ mode }),

    addMessage: (role, content, imageUrls?) =>
      set((state) => ({
        aiDoctorMessages: [
          ...state.aiDoctorMessages,
          {
            id: uuidv4(),
            role,
            content,
            ...(imageUrls && imageUrls.length > 0 ? { imageUrls } : {}),
            createdAt: new Date().toISOString(),
          },
        ],
      })),

    setAiResponding: (isAiResponding) => set({ isAiResponding }),
    setMicActive: (isMicActive) => set({ isMicActive }),
    setConsultationStarted: (consultationStarted) =>
      set({ consultationStarted }),

    reset: () =>
      set({
        mode: "doctor",
        aiDoctorMessages: [],
        isAiResponding: false,
        isMicActive: false,
        consultationStarted: false,
      }),
  })
)
