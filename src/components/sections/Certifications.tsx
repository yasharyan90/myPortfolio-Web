import { AnimatePresence, LayoutGroup, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, Award, BadgeCheck, GraduationCap, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { achievements, certifications, type Certification } from '../../data/certifications'
import { Link } from '../../hooks/useRoute'
import { cn } from '../../lib/cn'
import { appleEase, fadeUp, spring, stagger, viewport } from '../../lib/motion'
import { showProject } from '../../lib/skillUsage'
import { Chip } from '../ui/Chip'
import { CountUp } from '../ui/CountUp'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'

/* ── derived from the data ─────────────────────────────────────────────── */

const ALL = 'All'
const PLATFORM_COLOR: Record<string, string> = { NPTEL: '#e4572e', Coursera: '#0056d2' }

function scoreOf(c: Certification): number | null {
  const m = c.badge?.match(/(\d{1,3}(?:\.\d+)?)\s*%/)
  return m ? Number(m[1]) : null
}
function tierOf(c: Certification): string | null {
  const t = c.badge?.replace(/·?\s*\d{1,3}(?:\.\d+)?\s*%/, '').replace(/·/g, '').trim()
  return t || null
}

const platforms = [ALL, ...Array.from(new Set(certifications.map((c) => c.platform)))]
const issuers = new Set(certifications.map((c) => c.issuer)).size
const scored = certifications.map(scoreOf).filter((n): n is number => n != null)
const avgScore = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null

/** Where an achievement line leads, picked from its wording. */
function achievementTarget(text: string): { href?: string; project?: string } {
  if (/UHIP/i.test(text)) return { project: 'uhip' }
  if (/Striver/i.test(text)) return { href: '/now' }
  if (/DSA|LeetCode/i.test(text)) return { href: '/#coding' }
  return {}
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function ScoreRing({ score, color }: { score: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const r = 22
  const c = 2 * Math.PI * r
  const decimals = Number.isInteger(score) ? 0 : 2
  return (
    <div ref={ref} className="relative h-[56px] w-[56px] shrink-0" title={`${score}% final score`}>
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-black/[0.06] dark:text-white/10" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: inView ? c * (1 - score / 100) : c }}
          transition={{ duration: 1.4, ease: appleEase, delay: 0.2 }}
        />
      </svg>
      <span className={cn('absolute inset-0 grid place-items-center font-display font-semibold tabular-nums text-ink', decimals ? 'text-[10.5px]' : 'text-[12.5px]')}>
        {inView ? <CountUp value={score} suffix="%" decimals={decimals} /> : '0%'}
      </span>
    </div>
  )
}

/** Card that tilts a few degrees toward the cursor, with a moving sheen. */
function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [6, -6]), spring)
  const ry = useSpring(useTransform(px, [0, 1], [-6, 6]), spring)
  const sheenX = useTransform(px, [0, 1], ['-40%', '140%'])
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduce) return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const reset = () => {
    px.set(0.5)
    py.set(0.5)
  }
  return (
    <motion.div
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={reset}
      whileHover={{ y: -4 }}
      transition={spring}
      className={cn('group relative h-full', className)}
    >
      <GlassPanel className="relative flex h-full flex-col overflow-hidden rounded-[18px] p-6">
        <motion.span
          aria-hidden
          style={{ left: sheenX }}
          className="pointer-events-none absolute top-0 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:via-white/10"
        />
        {children}
      </GlassPanel>
    </motion.div>
  )
}

function CertCard({ c }: { c: Certification }) {
  const score = scoreOf(c)
  const tier = tierOf(c)
  const color = PLATFORM_COLOR[c.platform] ?? 'var(--color-primary)'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={spring}
      className="h-full"
    >
      <TiltCard>
        <div className="relative z-10 flex items-start justify-between gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[11px]" style={{ background: `${color}1a`, color }}>
            <Award className="h-5 w-5" />
          </span>
          {score != null ? (
            <ScoreRing score={score} color={color} />
          ) : (
            <span className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[12px] font-semibold text-ink-80 dark:bg-white/10">Completed</span>
          )}
        </div>
        <h3 className="relative z-10 mt-5 font-display text-[19px] font-semibold leading-snug text-ink">{c.title}</h3>
        <p className="relative z-10 mt-1 flex items-center gap-1.5 text-[14px] tracking-[-0.224px] text-ink-48">
          <GraduationCap className="h-3.5 w-3.5" /> {c.issuer}
        </p>
        <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white" style={{ background: color }}>
            {c.platform}
          </span>
          {tier && <span className="rounded-full bg-ink px-2.5 py-1 text-[12px] font-semibold text-on-ink">{tier}</span>}
        </div>
        <motion.div variants={stagger(0.04)} initial="hidden" animate="show" className="relative z-10 flex flex-wrap gap-2 pt-5">
          {c.topics.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </motion.div>
        {c.credentialUrl && (
          <div className="relative z-10 mt-auto pt-5">
            <GlassButton
              href={c.credentialUrl}
              external
              variant="glass"
              size="sm"
              magnetic={false}
              icon={<BadgeCheck className="h-3.5 w-3.5" style={{ color }} />}
              iconRight={<ArrowUpRight className="h-3.5 w-3.5" />}
              ariaLabel={`View the ${c.title} certificate on ${c.platform}`}
              className="w-full justify-between"
            >
              View certificate
            </GlassButton>
          </div>
        )}
      </TiltCard>
    </motion.div>
  )
}

/* ── section ────────────────────────────────────────────────────────────── */

export function Certifications() {
  const [filter, setFilter] = useState(ALL)
  const shown = useMemo(() => (filter === ALL ? certifications : certifications.filter((c) => c.platform === filter)), [filter])

  const stats = [
    { value: certifications.length, label: 'certifications', suffix: '' },
    { value: issuers, label: 'institutions', suffix: '' },
    ...(avgScore != null ? [{ value: avgScore, label: 'avg. score', suffix: '%' }] : []),
  ]

  return (
    <section id="certifications" className="section relative">
      <div className="container-apple">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <SectionHeading eyebrow="Certifications & achievements" title="Verified along the way." />
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}>
            <GlassPanel spotlight={false} className="rounded-[18px]">
              <div className="grid grid-cols-3 divide-x divide-black/[0.06] dark:divide-white/10">
              {stats.map((s) => (
                <div key={s.label} className="px-5 py-4 text-center md:text-left">
                  <p className="font-display text-[28px] font-semibold leading-none tracking-[-0.01em] text-primary">
                    <CountUp value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-1.5 whitespace-nowrap text-[12.5px] tracking-[-0.2px] text-ink-48">{s.label}</p>
                </div>
              ))}
              </div>
            </GlassPanel>
          </motion.div>
        </div>

        {/* platform filter */}
        <LayoutGroup id="cert-tabs">
          <motion.div
            role="tablist"
            aria-label="Filter by platform"
            variants={stagger(0.04)}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            className="mt-10 flex flex-wrap gap-2"
          >
            {platforms.map((p) => {
              const active = p === filter
              const count = p === ALL ? certifications.length : certifications.filter((c) => c.platform === p).length
              return (
                <motion.button
                  key={p}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  variants={fadeUp}
                  onClick={() => setFilter(p)}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-[14px] tracking-[-0.224px] transition-colors duration-300',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
                    active ? 'text-on-ink' : 'text-ink-80 hover:text-ink',
                  )}
                >
                  {active && <motion.span layoutId="cert-tab-pill" transition={spring} className="absolute inset-0 rounded-full bg-ink" aria-hidden />}
                  <span className="relative z-10 flex items-center gap-1.5">
                    {p}
                    <span className={cn('text-[12px] tabular-nums', active ? 'text-on-ink/60' : 'text-ink-48')}>{count}</span>
                  </span>
                </motion.button>
              )
            })}
          </motion.div>
        </LayoutGroup>

        <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 [perspective:1200px]">
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((c) => (
              <CertCard key={c.title} c={c} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* achievements — each leads to its source */}
        <motion.div variants={stagger(0.1, 0.2)} initial="hidden" whileInView="show" viewport={viewport} className="mt-6 grid gap-3 md:grid-cols-3">
          {achievements.map((a) => {
            const t = achievementTarget(a)
            const cls =
              'group glass flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-[15px] text-ink-80 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus'
            const inner = (
              <>
                <Sparkles className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span className="flex-1">{a}</span>
                {(t.href || t.project) && (
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-48 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                )}
              </>
            )
            return (
              <motion.div key={a} variants={fadeUp}>
                {t.project ? (
                  <button type="button" onClick={() => showProject(t.project!)} className={cls}>
                    {inner}
                  </button>
                ) : t.href ? (
                  <Link href={t.href} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <div className={cls}>{inner}</div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
