import { animate, motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion'
import { useEffect, useMemo, useRef, type CSSProperties } from 'react'
import { useGaze } from '../../hooks/useGaze'
import type { BuddyState } from './BuddyStates'
import { mixLab, oklch, toHex } from './blob/color'
import { generateLook, type BuddyLook, type EyeSpec, type LookOverrides } from './blob/generate'
import { eyePath } from './blob/geometry'
import { EXPRESSIONS, lerpPose, type EyePose, type Pose } from './expressions'
import './buddy.css'

/** Slightly underdamped, so a new mood lands with a small wobble. */
const MORPH = { type: 'spring', stiffness: 320, damping: 22 } as const
const POP_IN = { type: 'spring', stiffness: 420, damping: 18 } as const

interface BuddyProps {
  /** The same name always draws the same face. */
  name: string
  /** Pinned traits. Changing these updates the face in place. */
  overrides?: LookOverrides
  mood: BuddyState
  /** Rendered width and height in px. */
  size?: number
  /** Let the eyes follow the cursor. */
  gaze?: boolean
}

export function Buddy({ name, overrides, ...rest }: BuddyProps) {
  const look = useMemo(() => generateLook(name, overrides), [name, overrides])
  // A new name is a new creature, so it pops in fresh instead of morphing from the old one.
  return <Face key={name} name={name} look={look} {...rest} />
}

/** Animates between poses, starting from wherever the last morph had got to. */
function usePose(target: Pose): MotionValue<Pose> {
  const progress = useMotionValue(1)
  const from = useRef(target)
  const to = useRef(target)
  const pose = useTransform(() => lerpPose(from.current, to.current, progress.get()))

  useEffect(() => {
    if (to.current === target) return
    from.current = lerpPose(from.current, to.current, progress.get())
    to.current = target
    progress.jump(0)
    const controls = animate(progress, 1, MORPH)
    return () => controls.stop()
  }, [target, progress])

  return pose
}

/**
 * Wide poses are capped so the two eyes never run into each other. A visor's
 * halves overlap at rest; as a pose takes hold they pull apart into two eyes.
 */
function eyeOutline(eye: EyeSpec, p: EyePose, side: -1 | 1, gap: number, look: Pose): string {
  const apart = gap * 0.4
  const cap = Math.max(eye.hw, apart) * (1 - p.lock) + apart * p.lock
  const w = Math.min(Math.max(eye.hw * p.sx, 0.4), cap)
  const h = Math.max(eye.hh * p.sy, 0.35)
  // Squashed domes get their lower half back, so sleepy lids don't thin out to a hairline.
  const flat = eye.flat * Math.min(1, Math.max(0, (p.sy - 0.1) / 0.5))
  const rot = eye.lean * (1 - p.lock) - side * p.tilt
  const cx = eye.cx + (-side * p.inward + look.lookX) * eye.hh
  const cy = eye.cy + (-p.lift + look.lookY) * eye.hh
  return eyePath(cx, cy, w, h, eye.n, flat, p.bend, rot)
}

interface FaceProps extends Omit<BuddyProps, 'name' | 'overrides'> {
  name: string
  look: BuddyLook
}

function Face({ name, look, mood, size = 200, gaze = true }: FaceProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const expression = EXPRESSIONS[mood]
  const pose = usePose(expression.pose)
  const [left, right] = look.eyes
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const eyesAt = useGaze(svgRef, {
    center: { x: (left.cx + right.cx) / 2, y: (left.cy + right.cy) / 2 },
    enabled: gaze && !reducedMotion,
  })

  const gap = right.cx - left.cx
  const leftD = useTransform(() => {
    const p = pose.get()
    return eyeOutline(left, p.left, -1, gap, p)
  })
  const rightD = useTransform(() => {
    const p = pose.get()
    return eyeOutline(right, p.right, 1, gap, p)
  })

  // The eyes lead and the body follows a little, which reads as the head turning.
  const eyesX = useTransform(() => eyesAt.x.get() * pose.get().gaze)
  const eyesY = useTransform(() => eyesAt.y.get() * pose.get().gaze)
  const bodyX = useTransform(() => eyesAt.x.get() * pose.get().gaze * 0.2)
  const bodyY = useTransform(() => pose.get().bodyY + eyesAt.y.get() * pose.get().gaze * 0.15)
  const scaleX = useTransform(() => 1 + pose.get().squash)
  const scaleY = useTransform(() => 1 - pose.get().squash)
  const shake = useTransform(() => pose.get().shake)
  const fill = useTransform(() => {
    const { tint, tintHue } = pose.get()
    return toHex(tint < 0.002 ? look.body : mixLab(look.body, oklch(look.body[0], 0.2, tintHue), tint))
  })

  const ground = `50px ${look.ground}px`
  const timing = {
    '--b-rate': expression.rate,
    '--b-breathe-phase': `${look.motion.breathePhase}ms`,
    '--b-bob-phase': `${look.motion.bobPhase}ms`,
    '--b-blink': `${look.motion.blink}ms`,
    '--b-blink-phase': `${look.motion.blinkPhase}ms`,
  } as CSSProperties

  return (
    <motion.svg
      ref={svgRef}
      className={expression.blink ? 'buddy' : 'buddy buddy--still-eyes'}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`${name}, feeling ${mood}`}
      style={timing}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={POP_IN}
    >
      <motion.g className="b-shake" style={{ '--b-shake': shake } as never}>
        <g className="b-breathe" style={{ transformOrigin: ground }}>
          <g className="b-bob">
            {/* data-hit marks the painted buddy, so clicks on empty space can pass through to the desktop. */}
            <motion.g
              data-hit
              style={{ x: bodyX, y: bodyY, scaleX, scaleY, transformBox: 'view-box', originX: '50px', originY: `${look.ground}px` }}
            >
              <motion.g style={{ fill }}>
                {look.parts.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </motion.g>
              <motion.g fill={toHex(look.eye)} style={{ x: eyesX, y: eyesY }}>
                <g className="b-eye">
                  <motion.path d={leftD} />
                </g>
                <g className="b-eye">
                  <motion.path d={rightD} />
                </g>
              </motion.g>
            </motion.g>
          </g>
        </g>
      </motion.g>
    </motion.svg>
  )
}
