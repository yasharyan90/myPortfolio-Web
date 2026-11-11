import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import { Download, FileText, KeyRound, Menu, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { useActiveSection } from '../../hooks/useActiveSection'
import { Link, useRoute } from '../../hooks/useRoute'
import { useTerminal } from '../../hooks/useTerminal'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../lib/cn'
import { appleEase, spring } from '../../lib/motion'
import { GlassButton } from '../ui/GlassButton'
import { NowToggle } from '../ui/NowToggle'
import { TerminalToggle } from '../ui/TerminalToggle'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Tooltip } from '../ui/Tooltip'
import { profile } from '../../content/live'
import { useContent } from '../../content/ContentProvider'
import { resumeDownloadUrl, resumeFileName } from '../../content/resume'

export const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'coding', label: 'Coding' },
  { id: 'education', label: 'Education' },
  { id: 'contact', label: 'Contact' },
]

/** The same 40 %-from-top line useActiveSection uses to decide which section is current. */
const BAND = 0.4

export function Navbar() {
  useContent()
  const ids = useMemo(() => ['hero', ...NAV_LINKS.map((l) => l.id)], [])
  const { path, navigate } = useRoute()
  const sectionActive = useActiveSection(ids)
  const active = path === '/' ? sectionActive : ''
  const { isDark } = useTheme()
  const { isOpen: terminalOpen } = useTerminal()

  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<string | null>(null)

  // how far through the active section the reader is — fills a hairline inside the active pill
  const progress = useMotionValue(0)
  const fill = useSpring(progress, { stiffness: 200, damping: 30, mass: 0.4 })
  const measure = () => {
    if (!active) return progress.set(0)
    const el = document.getElementById(active)
    if (!el) return progress.set(0)
    const r = el.getBoundingClientRect()
    progress.set(Math.min(1, Math.max(0, (window.innerHeight * BAND - r.top) / r.height)))
  }
  useEffect(measure, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  // shrink after a little scroll; tuck away on scroll-down, return on scroll-up
  const { scrollY } = useScroll()
  const lastY = useRef(0)
  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 24)
    const dy = y - lastY.current
    if (y < 80) setHidden(false)
    else if (dy > 6) setHidden(true)
    else if (dy < -6) setHidden(false)
    lastY.current = y
    measure()
  })
  const tucked = hidden && !open && !terminalOpen

  const sectionLabel = NAV_LINKS.find((l) => l.id === active)?.label
  const compactLabel = scrolled && sectionLabel ? sectionLabel : null

  const onBrandClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (path !== '/') return
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: appleEase, delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 print:hidden"
      onFocusCapture={() => setHidden(false)}
    >
      <motion.div
        animate={{ y: tucked ? -88 : 0, opacity: tucked ? 0 : 1 }}
        transition={{ duration: 0.45, ease: appleEase }}
        className="relative flex justify-center"
        style={{ pointerEvents: tucked ? 'none' : 'auto' }}
      >
        <motion.nav
          layout
          transition={spring}
          className={cn(
            'glass flex w-full max-w-[1120px] items-center justify-between rounded-full pl-5 pr-2 transition-[height] duration-300',
            scrolled ? 'h-[52px]' : 'h-[60px]',
          )}
        >
          {/* brand — on small screens the name gives way to the current section once you scroll */}
          <Tooltip label={path === '/' && scrolled ? 'Back to top' : undefined}>
            <Link
              href="/"
              onClick={onBrandClick}
              className="group flex items-center gap-2.5 font-display text-[17px] font-semibold tracking-[-0.374px] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-focus rounded-full"
            >
              <motion.img
                src={profile.avatarSmall}
                alt=""
                width={28}
                height={28}
                whileHover={{ rotate: -8, scale: 1.08 }}
                transition={spring}
                className="h-7 w-7 rounded-[8px] object-cover ring-1 ring-black/10 dark:ring-white/15"
              />
              <span className="hidden md:inline">{profile.name}</span>
              <span className={cn('md:hidden', !compactLabel && 'hidden sm:inline')}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={compactLabel ?? 'name'}
                    initial={{ y: 10, opacity: 0, filter: 'blur(3px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -10, opacity: 0, filter: 'blur(3px)' }}
                    transition={{ duration: 0.28, ease: appleEase }}
                    className="inline-block"
                  >
                    {compactLabel ?? profile.name}
                  </motion.span>
                </AnimatePresence>
              </span>
            </Link>
          </Tooltip>

          {/* section links — hover highlight glides between items; the active pill carries a progress hairline */}
          <ul className="relative hidden items-center gap-1 md:flex" onMouseLeave={() => setHover(null)}>
            {NAV_LINKS.map((l) => {
              const isActive = active === l.id
              const isHover = hover === l.id && !isActive
              return (
                <li key={l.id} className="relative" onMouseEnter={() => setHover(l.id)}>
                  <Link
                    href={`/#${l.id}`}
                    onFocus={() => setHover(l.id)}
                    onBlur={() => setHover(null)}
                    aria-current={isActive ? 'location' : undefined}
                    className={cn(
                      'relative z-10 block rounded-full px-3.5 py-2 text-[13px] tracking-[-0.12px] transition-colors duration-300',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
                      isActive ? 'text-on-ink' : 'text-ink-80 hover:text-ink',
                    )}
                  >
                    {l.label}
                  </Link>
                  <AnimatePresence>
                    {isHover && (
                      <motion.span
                        layoutId="nav-hover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ layout: spring, opacity: { duration: 0.15 } }}
                        className="absolute inset-0 z-0 rounded-full bg-black/[0.06] dark:bg-white/[0.1]"
                        aria-hidden
                      />
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.span layoutId="nav-pill" transition={spring} className="absolute inset-0 z-0 overflow-hidden rounded-full bg-ink" aria-hidden>
                      <motion.span style={{ scaleX: fill }} className="absolute bottom-[4px] left-3.5 right-3.5 h-[2px] origin-left rounded-full bg-on-ink/35" />
                    </motion.span>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Tooltip label={path === '/now' ? 'Back home' : 'Now'}>
              <NowToggle />
            </Tooltip>
            <Tooltip
              label={
                <>
                  Terminal
                  <kbd className="ml-1.5 rounded-[4px] bg-on-ink/15 px-1 font-mono text-[10px] leading-[16px]">⌘K</kbd>
                </>
              }
            >
              <TerminalToggle />
            </Tooltip>
            <Tooltip label={isDark ? 'Light mode' : 'Dark mode'}>
              <ThemeToggle />
            </Tooltip>
            <div className="hidden sm:block">
              <span className="inline-flex items-center gap-1">
                <Tooltip label="View résumé">
                  <GlassButton onClick={() => navigate(profile.resume)} size="sm" icon={<FileText className="h-3.5 w-3.5" />} magnetic={false}>
                    Résumé
                  </GlassButton>
                </Tooltip>
                <Tooltip label="Download PDF">
                  <motion.a
                    href={resumeDownloadUrl(profile)}
                    download={resumeFileName(profile)}
                    aria-label="Download résumé PDF"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.9 }}
                    transition={spring}
                    className="grid h-9 w-9 place-items-center rounded-full border border-black/[0.06] bg-white/60 text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus dark:border-white/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.16]"
                  >
                    <Download className="h-4 w-4" />
                  </motion.a>
                </Tooltip>
              </span>
            </div>
            <Tooltip label={path === '/admin' ? 'Owner console' : 'Owner sign-in'}>
              <Link
                href="/admin"
                aria-label="Owner sign-in"
                aria-current={path === '/admin' ? 'page' : undefined}
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
                  path === '/admin'
                    ? 'border-transparent bg-ink text-on-ink'
                    : 'border-black/[0.06] bg-white/60 text-ink hover:bg-white dark:border-white/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.16]',
                )}
              >
                <KeyRound className="h-4 w-4" />
              </Link>
            </Tooltip>
            <motion.button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              whileTap={{ scale: 0.9 }}
              className="grid h-10 w-10 place-items-center rounded-full text-ink md:hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? 'x' : 'menu'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.22, ease: appleEase }}
                  className="grid place-items-center"
                >
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: appleEase }}
              className="glass absolute left-0 right-0 top-[68px] rounded-[18px] p-2 md:hidden"
            >
              {NAV_LINKS.map((l, i) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, ease: appleEase }}
                >
                  <Link
                    href={`/#${l.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-[11px] px-4 py-3 text-[17px] tracking-[-0.374px]',
                      active === l.id ? 'bg-ink text-on-ink' : 'text-ink hover:bg-white/60 dark:hover:bg-white/10',
                    )}
                  >
                    {l.label}
                    {active === l.id && <span className="text-[12px] text-on-ink/60">You're here</span>}
                  </Link>
                </motion.div>
              ))}
              <Link
                href="/now"
                onClick={() => setOpen(false)}
                className={cn(
                  'block rounded-[11px] px-4 py-3 text-[17px] tracking-[-0.374px]',
                  path === '/now' ? 'bg-ink text-on-ink' : 'text-ink hover:bg-white/60 dark:hover:bg-white/10',
                )}
              >
                Now
              </Link>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-[11px] px-4 py-3 text-[17px] tracking-[-0.374px]',
                  path === '/admin' ? 'bg-ink text-on-ink' : 'text-ink hover:bg-white/60 dark:hover:bg-white/10',
                )}
              >
                <KeyRound className="h-4 w-4" /> Owner sign-in
              </Link>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Link
                  href={profile.resume}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-[11px] bg-primary px-4 py-3 text-[16px] text-white"
                >
                  <FileText className="h-4 w-4" /> View résumé
                </Link>
                <a
                  href={resumeDownloadUrl(profile)}
                  download={resumeFileName(profile)}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-[11px] bg-ink px-4 py-3 text-[16px] text-on-ink"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.header>
  )
}
