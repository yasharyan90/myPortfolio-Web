import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowUp, ArrowUpRight, Download, FileText, GitCommitHorizontal, Terminal as TerminalIcon } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useRoute } from '../../hooks/useRoute'
import { useTerminal } from '../../hooks/useTerminal'
import { cn } from '../../lib/cn'
import { spring } from '../../lib/motion'
import { showSkill } from '../../lib/skillUsage'
import { SocialButton } from '../ui/SocialButton'
import { ThemeToggle } from '../ui/ThemeToggle'
import { Tooltip } from '../ui/Tooltip'
import { NAV_LINKS } from './Navbar'
import { portfolioProject, profile, socials } from '../../content/live'
import { useContent } from '../../content/ContentProvider'
import { resumeDownloadUrl, resumeFileName } from '../../content/resume'

const BUILT_WITH = [
  { label: 'React', skill: 'React.js' },
  { label: 'Tailwind CSS', skill: 'Tailwind CSS' },
  { label: 'Framer Motion', skill: 'Framer Motion' },
]

function relative(iso: string, now: number) {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h} h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Round "back to top" button whose ring fills with page scroll. */
function BackToTop() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 })
  const r = 20
  const c = 2 * Math.PI * r
  const dash = useTransform(progress, (v) => c * (1 - v))
  return (
    <Tooltip label="Back to top">
      <motion.button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.92 }}
        transition={spring}
        aria-label="Back to top"
        className="glass relative grid h-12 w-12 place-items-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
      >
        <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
          <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="2" className="text-black/[0.08] dark:text-white/10" />
          <motion.circle cx="24" cy="24" r={r} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeDasharray={c} style={{ strokeDashoffset: dash }} />
        </svg>
        <ArrowUp className="relative h-4 w-4" />
      </motion.button>
    </Tooltip>
  )
}

function FooterLink({ href, children, external }: { href: string; children: ReactNode; external?: boolean }) {
  const cls =
    'group inline-flex items-center gap-1.5 py-1 text-[14px] tracking-[-0.2px] text-ink-80 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus rounded-[4px]'
  const inner = (
    <>
      <span className="relative">
        {children}
        <span className="absolute -bottom-px left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" aria-hidden />
      </span>
      {external && <ArrowUpRight className="h-3 w-3 text-ink-48 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
    </>
  )
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  )
}

export function Footer() {
  useContent()
  const REPO = portfolioProject.links.find((l) => l.kind === 'github')?.href ?? 'https://github.com/yasharyan90'
  const { path } = useRoute()
  const { open: openTerminal } = useTerminal()
  const reduce = useReducedMotion()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const isDeploy = __COMMIT_SHA__ !== 'dev'
  const commitHref = isDeploy ? `${REPO}/commit/${__COMMIT_SHA__}` : REPO

  return (
    <footer className="relative bg-parchment pb-10 pt-14 print:hidden">
      <div className="container-apple">
        <div className="border-t border-hairline pt-10">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
            {/* brand */}
            <div>
              <Link href="/" className="group inline-flex items-center gap-3">
                <motion.img
                  src={profile.avatarSmall}
                  alt=""
                  width={36}
                  height={36}
                  whileHover={reduce ? undefined : { rotate: -8, scale: 1.08 }}
                  transition={spring}
                  className="h-9 w-9 rounded-[10px] object-cover ring-1 ring-black/10 dark:ring-white/15"
                />
                <span>
                  <span className="block font-display text-[17px] font-semibold tracking-[-0.3px] text-ink">{profile.name}</span>
                  <span className="block text-[13px] text-ink-48">{profile.role}</span>
                </span>
              </Link>
              <p className="mt-4 max-w-[320px] text-[14px] leading-[1.5] text-ink-48">{profile.availability}. Reply time is usually same-day.</p>
              <div className="mt-5 flex items-center gap-2">
                {socials.map((s) => (
                  <SocialButton key={s.id} social={s} variant="icon" />
                ))}
              </div>
            </div>

            {/* explore */}
            <nav aria-label="Sections">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">Explore</p>
              <ul className="mt-3 space-y-0.5">
                {NAV_LINKS.map((l) => (
                  <li key={l.id}>
                    <FooterLink href={`/#${l.id}`}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* elsewhere */}
            <nav aria-label="Profiles">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">Elsewhere</p>
              <ul className="mt-3 space-y-0.5">
                {socials
                  .filter((s) => s.id !== 'email')
                  .map((s) => (
                    <li key={s.id}>
                      <FooterLink href={s.href} external>
                        {s.label}
                      </FooterLink>
                    </li>
                  ))}
              </ul>
            </nav>

            {/* site */}
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">Site</p>
              <ul className="mt-3 space-y-0.5">
                <li>
                  <FooterLink href="/now">{path === '/now' ? 'Now (you are here)' : 'What I’m doing now'}</FooterLink>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openTerminal}
                    className="group inline-flex items-center gap-2 py-1 text-[14px] tracking-[-0.2px] text-ink-80 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus rounded-[4px]"
                  >
                    <TerminalIcon className="h-3.5 w-3.5" />
                    Open the terminal
                    <kbd className="rounded-[4px] border border-black/10 bg-white/60 px-1 font-mono text-[10.5px] text-ink-80 dark:border-white/15 dark:bg-white/10 dark:text-white/80">⌘K</kbd>
                  </button>
                </li>
                <li>
                  <Link
                    href={profile.resume}
                    className="group inline-flex items-center gap-2 py-1 text-[14px] tracking-[-0.2px] text-ink-80 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus rounded-[4px]"
                  >
                    <FileText className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
                    View résumé
                  </Link>
                </li>
                <li>
                  <a
                    href={resumeDownloadUrl(profile)}
                    download={resumeFileName(profile)}
                    className="group inline-flex items-center gap-2 py-1 text-[14px] tracking-[-0.2px] text-ink-80 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus rounded-[4px]"
                  >
                    <Download className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5" />
                    Download résumé PDF
                  </a>
                </li>
                <li>
                  <FooterLink href={REPO} external>
                    Source of this site
                  </FooterLink>
                </li>
              </ul>
              <div className="mt-4 flex items-center gap-3">
                <ThemeToggle />
                <span className="text-[12.5px] text-ink-48">Light / dark</span>
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div className="mt-10 flex flex-col gap-5 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-[12.5px] tracking-[-0.12px] text-ink-48">
              <span>© {new Date().getFullYear()} {profile.name}.</span>
              <span>Built with</span>
              {BUILT_WITH.map((b, i) => (
                <span key={b.skill} className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showSkill(b.skill)}
                    className="rounded-[3px] text-ink-80 underline decoration-primary/40 decoration-dotted underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
                  >
                    {b.label}
                  </button>
                  {i < BUILT_WITH.length - 1 && <span aria-hidden>{i === BUILT_WITH.length - 2 ? '&' : '·'}</span>}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Tooltip label={isDeploy && __COMMIT_MESSAGE__ ? __COMMIT_MESSAGE__ : 'Local development build'}>
                <a
                  href={commitHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/60 px-2.5 py-1 font-mono text-[11.5px] text-ink-80 transition-colors hover:border-primary/40 hover:text-primary',
                    'dark:border-white/10 dark:bg-white/[0.08] dark:text-white/80',
                  )}
                >
                  <GitCommitHorizontal className="h-3.5 w-3.5" />
                  {__COMMIT_SHA__}
                  <span className="text-ink-48">· built {relative(__BUILT_AT__, now)}</span>
                </a>
              </Tooltip>
              <BackToTop />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
