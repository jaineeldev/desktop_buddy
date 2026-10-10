import { AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Buddy } from './components/Buddy/Buddy'
import { generateLook } from './components/Buddy/blob/generate'
import { randomBuddyName } from './components/Buddy/names'
import { Onboarding } from './components/Onboarding/Onboarding'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { useDesktopInteraction } from './hooks/useDesktopInteraction'
import { useReactions } from './hooks/useReactions'
import { useTrayIcon } from './hooks/useTrayIcon'
import { shownMood, useBuddyStore } from './stores/buddyStore'
import './App.css'

/** On launch the intro waits for the wake-up stretch; replayed from the tray, it starts almost at once. */
const INTRO_DELAY_AT_LAUNCH_MS = 1_700
const INTRO_DELAY_REPLAY_MS = 300

function App() {
  const { name, look, size, opacity, followCursor, alwaysOnTop, onboarded, mood, bounce, panelOpen } = useBuddyStore(
    useShallow((s) => ({
      name: s.name,
      look: s.look,
      size: s.size,
      opacity: s.opacity,
      followCursor: s.followCursor,
      alwaysOnTop: s.alwaysOnTop,
      onboarded: s.onboarded,
      mood: shownMood(s),
      bounce: s.bounce,
      panelOpen: s.panelOpen,
    })),
  )
  const launchedAt = useRef(Date.now())
  const [pressed, setPressed] = useState(false)
  const [hovered, setHovered] = useState(false)

  const reactions = useReactions()
  const interaction = useDesktopInteraction({
    onClick: reactions.pet,
    onMenu: () => {
      const { panelOpen, openPanel, closePanel } = useBuddyStore.getState()
      if (panelOpen) closePanel()
      else void openPanel()
    },
    onHoverChange: (on) => {
      setHovered(on)
      reactions.hover(on)
    },
    onPressChange: setPressed,
    onDragStart: reactions.grab,
    onDragEnd: reactions.drop,
  })

  useTrayIcon(
    useMemo(() => generateLook(name, look), [name, look]),
    name,
  )

  useEffect(() => {
    const bridge = window.buddy
    if (!bridge) return
    const { setName, openPanel, celebrate, update } = useBuddyStore.getState()
    const offFace = bridge.onNewFace(() => {
      setName(randomBuddyName())
      celebrate()
    })
    const offPanel = bridge.onOpenPanel(() => void openPanel())
    const offIntro = bridge.onReplayIntro(() => update({ onboarded: false, introStep: null }))
    return () => {
      offFace()
      offPanel()
      offIntro()
    }
  }, [])

  useEffect(() => {
    window.buddy?.setAlwaysOnTop(alwaysOnTop)
  }, [alwaysOnTop])

  const introDelay = Date.now() - launchedAt.current < 3_000 ? INTRO_DELAY_AT_LAUNCH_MS : INTRO_DELAY_REPLAY_MS

  return (
    <div className="stage">
      <div className="stage-buddy" style={{ opacity }} {...interaction}>
        <Buddy
          name={name}
          overrides={look}
          mood={mood}
          size={size}
          gaze={followCursor}
          bounce={bounce}
          pressed={pressed}
          hovered={hovered}
        />
      </div>
      {!onboarded && <Onboarding startDelay={introDelay} />}
      <AnimatePresence>{panelOpen && <SettingsPanel key="settings" />}</AnimatePresence>
    </div>
  )
}

export default App
