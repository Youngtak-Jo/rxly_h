import { create } from "zustand"
import type { ConnectorState } from "@/types/insights"

interface ConnectorStoreState {
  connectors: ConnectorState
  toggleConnector: (key: keyof ConnectorState) => void
  setConnectors: (state: ConnectorState) => void
  reset: () => void
}

const DEFAULT_CONNECTORS: ConnectorState = {
  pubmed: true,
  icd11: true,
  europe_pmc: true,
}

export const useConnectorStore = create<ConnectorStoreState>((set) => ({
  connectors: { ...DEFAULT_CONNECTORS },

  toggleConnector: (key) =>
    set((state) => ({
      connectors: {
        ...state.connectors,
        [key]: !state.connectors[key],
      },
    })),

  setConnectors: (connectors) => set({ connectors }),

  reset: () => set({ connectors: { ...DEFAULT_CONNECTORS } }),
}))
