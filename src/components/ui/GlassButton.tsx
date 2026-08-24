import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { spring } from '../../lib/motion'
import { Magnetic } from './Magnetic'

type Variant = 'primary' | 'glass' | 'glassDark' | 'ink'
type Size = 'sm' | 'md' | 'lg'

interface Props {
  href?: string
  onClick?: () => void
  variant?: Variant
  size?: Size
  icon?: ReactNode
  iconRight?: ReactNode
  children: ReactNode
  className?: string
  download?: boolean
  external?: boolean
  magnetic?: boolean
  ariaLabel?: string
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-focus',
  glass: 'glass text-ink',
  glassDark: 'glass-dark text-white',
  ink: 'bg-ink text-white',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[14px] tracking-[-0.224px]',
  md: 'h-11 px-[22px] text-[17px] tracking-[-0.374px]',
  lg: 'h-[52px] px-7 text-[18px] font-light tracking-0',
}

/** Apple pill button with liquid-glass sheen, magnetic pull and press feedback. */
export function GlassButton({
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  className,
  download,
  external,
  magnetic = true,
  ariaLabel,
}: Props) {
  const cls = cn(
    'group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-text font-normal select-none',
    'transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
    sizes[size],
    variants[variant],
    className,
  )
  const inner = (
    <>
      <span aria-hidden className="shine" />
      {icon && <span className="relative z-10 grid place-items-center">{icon}</span>}
      <span className="relative z-10">{children}</span>
      {iconRight && (
        <span className="relative z-10 grid place-items-center transition-transform duration-300 group-hover:translate-x-0.5">
          {iconRight}
        </span>
      )}
    </>
  )
  const motionProps = { whileHover: { scale: 1.04 }, whileTap: { scale: 0.96 }, transition: spring }

  const el = href ? (
    <motion.a
      href={href}
      aria-label={ariaLabel}
      download={download}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={cls}
      {...motionProps}
    >
      {inner}
    </motion.a>
  ) : (
    <motion.button type="button" aria-label={ariaLabel} onClick={onClick} className={cls} {...motionProps}>
      {inner}
    </motion.button>
  )

  return magnetic ? <Magnetic strength={0.22}>{el}</Magnetic> : el
}
