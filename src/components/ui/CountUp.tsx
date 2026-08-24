import { animate, useInView, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { appleEase } from '../../lib/motion'

interface Props {
  value: number
  suffix?: string
  decimals?: number
  className?: string
}

export function CountUp({ value, suffix = '', decimals = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!inView || !el) return
    if (reduce) {
      el.textContent = value.toFixed(decimals)
      return
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: appleEase,
      onUpdate: (v) => {
        el.textContent = v.toFixed(decimals)
      },
    })
    return () => controls.stop()
  }, [inView, value, decimals, reduce])

  return (
    <span className={className}>
      <span ref={ref}>{(0).toFixed(decimals)}</span>
      {suffix}
    </span>
  )
}
