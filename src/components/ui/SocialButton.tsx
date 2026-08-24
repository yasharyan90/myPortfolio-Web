import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Social } from '../../data/socials'
import { cn } from '../../lib/cn'
import { fadeUp, spring } from '../../lib/motion'
import type { Tone } from './GlassPanel'
import { Magnetic } from './Magnetic'

interface Props {
  social: Social
  tone?: Tone
  variant?: 'pill' | 'card' | 'icon'
  className?: string
}

const hoverIcon = { rest: { rotate: 0, scale: 1 }, hover: { rotate: -8, scale: 1.12 } }
const hoverArrow = { rest: { x: 0, y: 0, opacity: 0.45 }, hover: { x: 3, y: -3, opacity: 1 } }
const hoverGlow = { rest: { opacity: 0 }, hover: { opacity: 1 } }

/**
 * Animated brand button for a profile link.
 *  - pill: label + icon (hero / contact rows)
 *  - icon: compact circular (navbar / footer)
 *  - card: large tile with handle + blurb (Coding section)
 */
export function SocialButton({ social, tone = 'light', variant = 'pill', className }: Props) {
  const Icon = social.icon
  const brand = tone === 'dark' ? (social.colorOnDark ?? social.color) : social.color
  const isExternal = !social.href.startsWith('mailto:')
  const style = { '--brand': brand } as CSSProperties
  const shared = {
    href: social.href,
    target: isExternal ? '_blank' : undefined,
    rel: isExternal ? 'noopener noreferrer' : undefined,
    'aria-label': `${social.label} — ${social.handle}`,
    initial: 'rest',
    whileHover: 'hover',
    whileTap: { scale: 0.96 },
    animate: 'rest',
    style,
  }
  const surface = tone === 'light' ? 'glass text-ink' : 'glass-dark text-white'

  if (variant === 'icon') {
    return (
      <Magnetic strength={0.35} className={className}>
        <motion.a
          {...shared}
          className={cn('group relative grid h-11 w-11 place-items-center overflow-hidden rounded-full', surface)}
          transition={spring}
        >
          <motion.span
            aria-hidden
            variants={hoverGlow}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle at 50% 50%, ${brand}30, transparent 70%)`, boxShadow: `inset 0 0 0 1px ${brand}66` }}
          />
          <motion.span variants={hoverIcon} transition={spring} className="relative z-10" style={{ color: brand }}>
            <Icon size={18} />
          </motion.span>
        </motion.a>
      </Magnetic>
    )
  }

  if (variant === 'pill') {
    return (
      <Magnetic strength={0.3} className={className}>
        <motion.a
          {...shared}
          className={cn('group relative flex h-11 items-center gap-2.5 overflow-hidden rounded-full pl-2.5 pr-4', surface)}
          transition={spring}
        >
          <span aria-hidden className="shine" />
          <motion.span
            aria-hidden
            variants={hoverGlow}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(140px circle at 12% 50%, ${brand}2e, transparent 70%)`, boxShadow: `inset 0 0 0 1px ${brand}66` }}
          />
          <motion.span
            variants={hoverIcon}
            transition={spring}
            className="relative z-10 grid h-7 w-7 place-items-center rounded-full"
            style={{ color: brand, background: tone === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.1)' }}
          >
            <Icon size={15} />
          </motion.span>
          <span className="relative z-10 text-[14px] font-normal tracking-[-0.224px]">{social.label}</span>
          <motion.span variants={hoverArrow} transition={spring} className="relative z-10">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </motion.span>
        </motion.a>
      </Magnetic>
    )
  }

  // card
  return (
    <Magnetic strength={0.1} className={cn('block w-full', className)}>
      <motion.a
        {...shared}
        variants={{ ...fadeUp, hover: { y: -6 } }}
        className={cn('group relative block h-full overflow-hidden rounded-[18px] p-6', surface)}
        transition={spring}
      >
        <span aria-hidden className="shine" />
        <motion.span
          aria-hidden
          variants={hoverGlow}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 rounded-[18px]"
          style={{
            background: `radial-gradient(260px circle at 100% 0%, ${brand}33, transparent 70%)`,
            boxShadow: `inset 0 0 0 1px ${brand}55`,
          }}
        />
        <div className="relative z-10 flex items-start justify-between">
          <motion.div
            variants={hoverIcon}
            transition={spring}
            className="grid h-14 w-14 place-items-center rounded-2xl text-white"
            style={{ backgroundColor: social.color, boxShadow: `0 10px 30px -10px ${social.color}99` }}
          >
            <Icon size={26} />
          </motion.div>
          <motion.span variants={hoverArrow} transition={spring} className="mt-1">
            <ArrowUpRight className="h-5 w-5" />
          </motion.span>
        </div>
        <h3 className="relative z-10 mt-6 font-display text-[21px] font-semibold leading-tight tracking-[0.2px]">{social.label}</h3>
        <p className={cn('relative z-10 mt-1 text-[14px] tracking-[-0.224px]', tone === 'light' ? 'text-ink-48' : 'text-muted-dark')}>
          {social.blurb}
        </p>
        <div className="relative z-10 mt-6 flex flex-col items-start gap-3">
          <span
            className={cn(
              'inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[12.5px]',
              tone === 'light' ? 'bg-white/70 text-ink-80' : 'bg-white/10 text-white/85',
            )}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: brand }} />
            <span className="truncate">{social.handle}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[13px] font-normal" style={{ color: brand }}>
            {social.cta}
            <motion.span variants={hoverArrow} transition={spring} className="inline-flex">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </motion.span>
          </span>
        </div>
      </motion.a>
    </Magnetic>
  )
}
