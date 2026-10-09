import { motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import './SpeechBubble.css'

/** Milliseconds per character while the text types out. */
export const TYPE_MS = 24

function useTypewriter(text: string): string {
  const instant = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [shown, setShown] = useState(instant ? text.length : 0)
  useEffect(() => {
    if (instant) {
      setShown(text.length)
      return
    }
    setShown(0)
    const timer = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) window.clearInterval(timer)
        return Math.min(n + 1, text.length)
      })
    }, TYPE_MS)
    return () => window.clearInterval(timer)
  }, [text, instant])
  return text.slice(0, shown)
}

interface SpeechBubbleProps {
  text: string
  /** Buttons, inputs and the like, shown once the text has finished typing. */
  children?: ReactNode
  /** Which way the tail points: down at a buddy below, or up at a buddy above. */
  tail?: 'down' | 'up'
  /** Fades the bubble away, then calls `onLeft`. */
  leaving?: boolean
  onLeft?: () => void
}

/** What the buddy says. Solid to the mouse, so its buttons work in the click-through window. */
export function SpeechBubble({ text, children, tail = 'down', leaving = false, onLeft }: SpeechBubbleProps) {
  const typed = useTypewriter(text)
  const done = typed.length === text.length
  return (
    <motion.div
      data-hit
      className={`bubble bubble--tail-${tail}`}
      initial={{ opacity: 0, scale: 0.9, y: tail === 'down' ? 6 : -6 }}
      animate={leaving ? { opacity: 0, scale: 0.94, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      onAnimationComplete={() => {
        if (leaving) onLeft?.()
      }}
    >
      {/* Keyed by the text: a new line remounts the contents with a small lift, while the bubble itself stays put. */}
      <motion.div key={text} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        {/* The full text holds the bubble's size while it types, so it doesn't grow letter by letter. */}
        <p className="bubble-text" aria-live="polite">
          <span className="bubble-sizer" aria-hidden="true">
            {text}
          </span>
          {/* Screen readers get the whole sentence once, not a letter at a time. */}
          <span className="bubble-typed" aria-hidden="true">
            {typed}
          </span>
          <span className="sr-only">{text}</span>
        </p>
        {done && children && (
          <motion.div className="bubble-extra" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
