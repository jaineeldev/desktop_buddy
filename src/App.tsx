import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Buddy } from './components/Buddy/Buddy'
import { randomBuddyName } from './components/Buddy/names'
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel'
import { useDesktopInteraction } from './hooks/useDesktopInteraction'
import { useBuddyStore } from './stores/buddyStore'
import './App.css'

function App() {
  const { name, look, size, opacity, followCursor, alwaysOnTop, mood, panelOpen } = useBuddyStore(
    useShallow((s) => ({
      name: s.name,
      look: s.look,
      size: s.size,
      opacity: s.opacity,
      followCursor: s.followCursor,
      alwaysOnTop: s.alwaysOnTop,
      mood: s.reaction ?? s.state,
      panelOpen: s.panelOpen,
    })),
  )

  const interaction = useDesktopInteraction({
    onClick: () => useBuddyStore.getState().pet(),
    onMenu: () => {
      const { panelOpen, openPanel, closePanel } = useBuddyStore.getState()
      if (panelOpen) closePanel()
      else void openPanel()
    },
  })

  useEffect(() => {
    const bridge = window.buddy
    if (!bridge) return
    const { setName, openPanel } = useBuddyStore.getState()
    const offFace = bridge.onNewFace(() => setName(randomBuddyName()))
    const offPanel = bridge.onOpenPanel(() => void openPanel())
    return () => {
      offFace()
      offPanel()
    }
  }, [])

  useEffect(() => {
    window.buddy?.setAlwaysOnTop(alwaysOnTop)
  }, [alwaysOnTop])

  return (
    <div className="stage">
      <div className="stage-buddy" style={{ opacity }} {...interaction}>
        <Buddy name={name} overrides={look} mood={mood} size={size} gaze={followCursor} />
      </div>
      <AnimatePresence>{panelOpen && <SettingsPanel key="settings" />}</AnimatePresence>
    </div>
  )
}

export default App
