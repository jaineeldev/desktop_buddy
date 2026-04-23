import { create } from 'zustand'
import type { BuddyState } from '../components/Buddy/BuddyStates'

interface BuddyStore {
  state: BuddyState
  setState: (state: BuddyState) => void
}

export const useBuddyStore = create<BuddyStore>()((set) => ({
  state: 'idle',
  setState: (state) => set({ state }),
}))
