import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BuddyState } from '../components/Buddy/BuddyStates'
import type { LookOverrides } from '../components/Buddy/blob/generate'

/** Screen edges relative to the window's content area, so the panel can open on the side with room. */
export interface ScreenSpace {
  left: number
  top: number
  right: number
  bottom: number
}

/** Everything the settings panel edits. Saved between restarts. */
export interface BuddySettings {
  /** Decides the buddy's face: the same name always draws the same buddy. */
  name: string
  /** Traits pinned in the panel. Anything not pinned comes from the name. */
  look: LookOverrides
  /** Rendered size in px. */
  size: number
  opacity: number
  followCursor: boolean
  alwaysOnTop: boolean
}

interface BuddyStore extends BuddySettings {
  state: BuddyState
  /** A short-lived mood that plays over `state`, like the happy wiggle when petted. */
  reaction: BuddyState | null
  panelOpen: boolean
  screenSpace: ScreenSpace | null
  update: (settings: Partial<BuddySettings>) => void
  setName: (name: string) => void
  setState: (state: BuddyState) => void
  pet: () => void
  openPanel: () => Promise<void>
  closePanel: () => void
}

export const SIZE_RANGE = { min: 120, max: 280 } as const
export const OPACITY_RANGE = { min: 0.3, max: 1 } as const

const PET_MS = 1400
let petTimer = 0

export const useBuddyStore = create<BuddyStore>()(
  persist(
    (set) => ({
      name: 'buddy',
      look: {},
      size: 200,
      opacity: 1,
      followCursor: true,
      alwaysOnTop: true,
      state: 'idle',
      reaction: null,
      panelOpen: false,
      screenSpace: null,
      update: (settings) => set(settings),
      setName: (name) => set({ name }),
      setState: (state) => set({ state }),
      pet: () => {
        window.clearTimeout(petTimer)
        set({ reaction: 'happy' })
        petTimer = window.setTimeout(() => set({ reaction: null }), PET_MS)
      },
      openPanel: async () => {
        // Ask where the screen edges are first, so the panel opens on the right side straight away.
        const screenSpace = (await window.buddy?.getScreenSpace()) ?? null
        set({ panelOpen: true, screenSpace })
      },
      closePanel: () => set({ panelOpen: false }),
    }),
    {
      name: 'desktop-buddy/settings',
      version: 1,
      partialize: ({ name, look, size, opacity, followCursor, alwaysOnTop }): BuddySettings => ({
        name,
        look,
        size,
        opacity,
        followCursor,
        alwaysOnTop,
      }),
    },
  ),
)
