import { motion, useMotionTemplate, useMotionValue, type HTMLMotionProps } from 'framer-motion'
import type { MouseEvent, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type Tone = 'light' | 'dark'

interface Props extends Omit<HTMLMotionProps<'div'>, 'children'> {
  tone?: Tone
  /** cursor-following highlight that makes the glass feel liquid */
  spotlight?: boolean
  className?: string
  children: ReactNode
}

export function GlassPanel({ tone = 'light', spotlight = true, className, children, ...rest }: Props) {
  const mx = useMotionValue(-9999)
  const my = useMotionValue(-9999)
  const tint = tone === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.16)'
  const glow = useMotionTemplate`radial-gradient(360px circle at ${mx}px ${my}px, ${tint}, transparent 70%)`

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(e.clientX - r.left)
    my.set(e.clientY - r.top)
  }
  const onLeave = () => {
    mx.set(-9999)
    my.set(-9999)
  }

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('relative overflow-hidden', tone === 'light' ? 'glass' : 'glass-dark', className)}
      {...rest}
    >
      {spotlight && (
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ background: glow }} />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
