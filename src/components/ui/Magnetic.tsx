import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useRef, type MouseEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface Props {
  children: ReactNode
  /** 0–1: how far the element follows the cursor */
  strength?: number
  className?: string
}

/** Wraps a child so it gently pulls toward the cursor and springs back. */
export function Magnetic({ children, strength = 0.3, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.35 })
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.35 })

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={cn('inline-block', className)}
    >
      {children}
    </motion.div>
  )
}
