import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { appleEase } from '../../lib/motion'

interface Props {
  /** nothing renders when omitted, so callers can pass a conditional label */
  label?: ReactNode
  children: ReactNode
  className?: string
}

/** Small ink-coloured label that drops in under the wrapped control on hover / focus. */
export function Tooltip({ label, children, className }: Props) {
  const [show, setShow] = useState(false)
  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocusCapture={() => setShow(true)}
      onBlurCapture={() => setShow(false)}
      onClickCapture={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && label && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: appleEase, delay: 0.06 }}
            style={{ x: '-50%' }}
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-2.5 flex items-center whitespace-nowrap rounded-[8px] bg-ink px-2.5 py-1.5 text-[12px] font-medium tracking-[-0.1px] text-on-ink shadow-product"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}
