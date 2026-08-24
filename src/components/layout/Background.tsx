import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'
import type { Tone } from '../ui/GlassPanel'

interface Props {
  tone?: Tone
  /** fixed = page-wide backdrop; absolute = scoped to a section */
  mode?: 'fixed' | 'absolute'
  className?: string
}

const orbs = [
  { size: 520, x: '-10%', y: '-10%', dur: 26, light: 'rgba(0,102,204,0.16)', dark: 'rgba(41,151,255,0.22)' },
  { size: 420, x: '70%', y: '10%', dur: 32, light: 'rgba(41,151,255,0.14)', dark: 'rgba(0,102,204,0.28)' },
  { size: 380, x: '30%', y: '70%', dur: 38, light: 'rgba(210,210,215,0.55)', dark: 'rgba(255,255,255,0.06)' },
]

/** Soft drifting orbs — the depth that liquid glass refracts. */
export function Background({ tone = 'light', mode = 'fixed', className }: Props) {
  const reduce = useReducedMotion()
  return (
    <div
      aria-hidden
      className={cn(mode === 'fixed' ? 'fixed inset-0 -z-10' : 'absolute inset-0 -z-0 overflow-hidden', className)}
    >
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="orb"
          style={{ width: o.size, height: o.size, left: o.x, top: o.y, background: tone === 'light' ? o.light : o.dark }}
          animate={reduce ? undefined : { x: [0, 60, -40, 0], y: [0, -50, 30, 0], scale: [1, 1.12, 0.95, 1] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}
