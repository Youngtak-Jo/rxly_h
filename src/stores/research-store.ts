import { create } from "zustand"
import { v4 as uuid } from "uuid"

export interface ResearchCitation {
  source:
    | "pubmed"
    | "europe_pmc"
    | "icd11"
    | "openfda"
    | "clinical_trials"
    | "dailymed"
  title: string
  url: string
  snippet?: string
}

export interface ResearchMessage {
  id: string
  role: "user" | "assistant"
  content: string
  citations: ResearchCitation[]
  createdAt: string
}

interface ResearchState {
  messages: ResearchMessage[]
  isStreaming: boolean
  includeInsights: boolean
  abortController: AbortController | null

  addUserMessage: (content: string) => string
  addAssistantMessage: () => string
  updateAssistantMessage: (id: string, content: string) => void
  finalizeAssistantMessage: (
    id: string,
    content: string,
    citations: ResearchCitation[]
  ) => void
  setStreaming: (streaming: boolean) => void
  setIncludeInsights: (include: boolean) => void
  setAbortController: (controller: AbortController | null) => void
  clearMessages: () => void
  loadFromDB: (messages: ResearchMessage[]) => void
  reset: () => void
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  messages: [],
  isStreaming: false,
  includeInsights: true,
  abortController: null,

  addUserMessage: (content) => {
    const id = uuid()
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id,
          role: "user",
          content,
          citations: [],
          createdAt: new Date().toISOString(),
        },
      ],
    }))
    return id
  },

  addAssistantMessage: () => {
    const id = uuid()
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id,
          role: "assistant",
          content: "",
          citations: [],
          createdAt: new Date().toISOString(),
        },
      ],
    }))
    return id
  },

  updateAssistantMessage: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    })),

  finalizeAssistantMessage: (id, content, citations) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content, citations } : m
      ),
    })),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setIncludeInsights: (includeInsights) => set({ includeInsights }),

  setAbortController: (abortController) => set({ abortController }),

  clearMessages: () => set({ messages: [] }),

  loadFromDB: (messages) => set({ messages }),

  reset: () => {
    const { abortController } = get()
    if (abortController) abortController.abort()
    set({
      messages: [],
      isStreaming: false,
      includeInsights: true,
      abortController: null,
    })
  },
}))
