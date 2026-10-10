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
  /** Whether the first-run intro has been finished or skipped. */
  onboarded: boolean
  /** The intro step you'd reached, so a restart picks up there instead of starting over. */
  introStep: string | null
  /** The app version that last ran, so the buddy can tell when it has just been updated. */
  lastVersion: string | null
}

interface BuddyStore extends BuddySettings {
  /** The mood picked in the panel (later, the one system stats suggest). */
  state: BuddyState
  /** A short-lived mood that plays over everything else, like happy when petted. */
  reaction: BuddyState | null
  /** A background mood from what's going on around it: bored or asleep when you're away, curious when hovered. Only shows over `idle`. */
  ambient: BuddyState | null
  /** Bumped to play a squash-and-stretch. */
  bounce: number
  /** Running counts of pets and drops, so the intro can wait for you to try each one. */
  pets: number
  drops: number
  panelOpen: boolean
  /** The version whose what's new card is open, if any. */
  whatsNew: string | null
  screenSpace: ScreenSpace | null
  update: (settings: Partial<BuddySettings>) => void
  setName: (name: string) => void
  setState: (state: BuddyState) => void
  /** Plays `mood` for `ms`, or until the next reaction when `ms` is Infinity. `null` ends the current one. */
  react: (mood: BuddyState | null, ms?: number) => void
  setAmbient: (mood: BuddyState | null) => void
  bump: () => void
  /** A surprised little pop, for when it gets a new look. */
  celebrate: () => void
  notePet: () => void
  noteDrop: () => void
  openPanel: () => Promise<void>
  closePanel: () => void
  openWhatsNew: (version: string) => Promise<void>
  closeWhatsNew: () => void
}

export const SIZE_RANGE = { min: 120, max: 280 } as const
export const OPACITY_RANGE = { min: 0.3, max: 1 } as const

/** A new buddy's name, and so its face: a bright cyan squircle with dot eyes, matching the app icon. */
export const DEFAULT_NAME = 'Sora'
/** The default name before version 2 of the saved settings. */
const OLD_DEFAULT_NAME = 'buddy'
/** Version 2's default, before it was capitalised. */
const LOWERCASE_DEFAULT_NAME = 'sora'

let reactionTimer = 0

/** What the buddy is actually showing: a reaction, else its ambient mood over idle, else its set mood. */
export function shownMood(s: Pick<BuddyStore, 'reaction' | 'ambient' | 'state'>): BuddyState {
  return s.reaction ?? (s.state === 'idle' ? s.ambient : null) ?? s.state
}

export const useBuddyStore = create<BuddyStore>()(
  persist(
    (set, get) => ({
      name: DEFAULT_NAME,
      look: {},
      size: 200,
      opacity: 1,
      followCursor: true,
      alwaysOnTop: true,
      onboarded: false,
      introStep: null,
      lastVersion: null,
      state: 'idle',
      reaction: null,
      ambient: null,
      bounce: 0,
      pets: 0,
      drops: 0,
      panelOpen: false,
      whatsNew: null,
      screenSpace: null,
      update: (settings) => set(settings),
      setName: (name) => set({ name }),
      setState: (state) => set({ state }),
      react: (mood, ms = 1400) => {
        window.clearTimeout(reactionTimer)
        set({ reaction: mood })
        if (mood && Number.isFinite(ms)) reactionTimer = window.setTimeout(() => set({ reaction: null }), ms)
      },
      setAmbient: (ambient) => set({ ambient }),
      bump: () => set((s) => ({ bounce: s.bounce + 1 })),
      celebrate: () => {
        get().react('surprised', 700)
        get().bump()
      },
      notePet: () => set((s) => ({ pets: s.pets + 1 })),
      noteDrop: () => set((s) => ({ drops: s.drops + 1 })),
      openPanel: async () => {
        // Ask where the screen edges are first, so the panel opens on the right side straight away.
        const screenSpace = (await window.buddy?.getScreenSpace()) ?? null
        // One card beside the buddy at a time.
        set({ panelOpen: true, whatsNew: null, screenSpace })
      },
      closePanel: () => set({ panelOpen: false }),
      openWhatsNew: async (version) => {
        const screenSpace = (await window.buddy?.getScreenSpace()) ?? null
        set({ whatsNew: version, panelOpen: false, screenSpace })
      },
      closeWhatsNew: () => set({ whatsNew: null }),
    }),
    {
      name: 'desktop-buddy/settings',
      version: 3,
      migrate: (saved, version) => {
        const settings = saved as BuddySettings
        // Version 2 changed the default buddy. Anyone who hadn't finished the intro still has the
        // old default rather than a name they chose, so they get the new one.
        if (version < 2 && settings.name === OLD_DEFAULT_NAME && !settings.onboarded) settings.name = DEFAULT_NAME
        // Version 3 capitalised it. Names don't care about case, so the face stays exactly the same.
        if (version < 3 && settings.name === LOWERCASE_DEFAULT_NAME) settings.name = DEFAULT_NAME
        return settings as BuddyStore
      },
      partialize: ({ name, look, size, opacity, followCursor, alwaysOnTop, onboarded, introStep, lastVersion }): BuddySettings => ({
        name,
        look,
        size,
        opacity,
        followCursor,
        alwaysOnTop,
        onboarded,
        introStep,
        lastVersion,
      }),
    },
  ),
)
