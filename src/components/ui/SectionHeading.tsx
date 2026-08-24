import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { fadeUp, stagger, viewport } from '../../lib/motion'
import type { Tone } from './GlassPanel'

interface Props {
  eyebrow: string
  title: string
  subtitle?: string
  tone?: Tone
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({ eyebrow, title, subtitle, tone = 'light', align = 'left', className }: Props) {
  return (
    <motion.div
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      className={cn('max-w-[720px]', align === 'center' && 'mx-auto text-center', className)}
    >
      <motion.p
        variants={fadeUp}
        className={cn('text-[14px] font-semibold tracking-[-0.224px]', tone === 'light' ? 'text-primary' : 'text-sky')}
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className={cn(
          'mt-2 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.01em] sm:text-[40px] md:text-[48px]',
          tone === 'light' ? 'text-ink' : 'text-white',
        )}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={fadeUp}
          className={cn('mt-4 text-[19px] font-light leading-[1.4] sm:text-[21px]', tone === 'light' ? 'text-ink-48' : 'text-muted-dark')}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}
