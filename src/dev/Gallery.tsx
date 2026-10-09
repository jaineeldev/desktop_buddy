import { useMemo, useState, type CSSProperties } from 'react'
import { Buddy } from '../components/Buddy/Buddy'
import { BUDDY_STATES, type BuddyState } from '../components/Buddy/BuddyStates'
import { generateLook } from '../components/Buddy/blob/generate'
import { randomBuddyName } from '../components/Buddy/names'
import { DEFAULT_NAME } from '../stores/buddyStore'

/** Same wall every visit, so faces can be compared between changes. */
function seededNames(count: number): string[] {
  let s = 7
  const random = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0x100000000
  }
  return Array.from({ length: count }, () => randomBuddyName(random))
}

const page: CSSProperties = {
  position: 'fixed',
  inset: 0,
  overflow: 'auto',
  background: '#0b0b0c',
  color: '#e8e8ea',
  fontFamily: 'Inter, system-ui, sans-serif',
  padding: '40px 16px',
  boxSizing: 'border-box',
}

const chip = (active: boolean): CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 999,
  border: '1px solid #2a2a2e',
  background: active ? '#f2f2f3' : 'transparent',
  color: active ? '#0b0b0c' : '#b9b9be',
  fontSize: 13,
})

/** A dev page for browsing faces and moods. Open the renderer with ?gallery. */
export default function Gallery() {
  const [name, setName] = useState(DEFAULT_NAME)
  const [mood, setMood] = useState<BuddyState>('idle')
  const wall = useMemo(() => seededNames(72), [])
  const shape = useMemo(() => generateLook(name).shape, [name])

  return (
    <div style={page}>
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'grid', gap: 28, justifyItems: 'center' }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Buddy name"
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #2a2a2e',
            color: 'inherit',
            fontSize: 28,
            textAlign: 'center',
            outline: 'none',
            width: 260,
          }}
        />
        <Buddy name={name} mood={mood} size={240} />
        <div style={{ fontSize: 12, color: '#77777d' }}>{shape}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {BUDDY_STATES.map((state) => (
            <button key={state} style={chip(state === mood)} onClick={() => setMood(state)}>
              {state}
            </button>
          ))}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: 4,
            width: '100%',
            marginTop: 24,
          }}
        >
          {wall.map((n, i) => (
            <button
              key={`${n}-${i}`}
              title={n}
              onClick={() => setName(n)}
              style={{ background: 'none', border: 'none', padding: 0, display: 'grid', placeItems: 'center' }}
            >
              <Buddy name={n} mood={mood} size={72} gaze={false} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
