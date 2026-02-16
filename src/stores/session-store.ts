import { create } from "zustand"
import type { Session } from "@/types/session"

interface SessionState {
  activeSession: Session | null
  sessions: Session[]
  isLoading: boolean
  isSwitching: boolean
  hydratingSessionId: string | null
  hasLoadedSessionList: boolean
  setActiveSession: (session: Session | null) => void
  setSessions: (sessions: Session[]) => void
  addSession: (session: Session) => void
  updateSession: (id: string, partial: Partial<Session>) => void
  setLoading: (loading: boolean) => void
  setSwitching: (switching: boolean) => void
  setHydratingSessionId: (sessionId: string | null) => void
  setHasLoadedSessionList: (loaded: boolean) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  sessions: [],
  isLoading: false,
  isSwitching: false,
  hydratingSessionId: null,
  hasLoadedSessionList: false,

  setActiveSession: (session) => set({ activeSession: session }),

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),

  updateSession: (id, partial) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...partial } : s
      ),
      activeSession:
        state.activeSession?.id === id
          ? { ...state.activeSession, ...partial }
          : state.activeSession,
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setSwitching: (isSwitching) => set({ isSwitching }),
  setHydratingSessionId: (hydratingSessionId) => set({ hydratingSessionId }),
  setHasLoadedSessionList: (hasLoadedSessionList) => set({ hasLoadedSessionList }),
}))
