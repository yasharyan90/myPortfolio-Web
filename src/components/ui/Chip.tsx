import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useEffectiveTone } from '../../hooks/useTheme'
import { cn } from '../../lib/cn'
import { spring } from '../../lib/motion'
import type { Tone } from './GlassPanel'

interface Props {
  children: ReactNode
  tone?: Tone
  className?: string
  animated?: boolean
}

const chipVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
}

export function Chip({ children, tone = 'light', className, animated = true }: Props) {
  const effective = useEffectiveTone(tone)
  return (
    <motion.span
      variants={animated ? chipVariants : undefined}
      whileHover={{ y: -2, scale: 1.04 }}
      transition={spring}
      className={cn(
        'inline-flex cursor-default items-center rounded-full border px-3 py-1.5 text-[13px] tracking-[-0.2px] select-none',
        effective === 'light'
          ? 'border-black/[0.06] bg-white/70 text-ink-80 hover:border-primary/40 hover:bg-white'
          : 'border-white/10 bg-white/[0.07] text-white/85 hover:border-sky/50 hover:bg-white/[0.12]',
        className,
      )}
    >
      {children}
    </motion.span>
  )
}
