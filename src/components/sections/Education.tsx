import { AnimatePresence, motion, useInView, useMotionValueEvent, useScroll, useSpring } from 'framer-motion'
import { ChevronDown, MapPin } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { appleEase, fadeUp, spring, stagger, viewport } from '../../lib/motion'
import { Background } from '../layout/Background'
import { Chip } from '../ui/Chip'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'
import { education, type Education as Entry } from '../../content/live'
import { useContent } from '../../content/ContentProvider'

/* ── derive what we can from the data strings ───────────────────────────── */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

interface Span {
  startYear: number
  endYear?: number
  expected: boolean
  /** JS Date for the end when a month is given, e.g. "Sept 2028" */
  end?: Date
  start?: Date
}

function parseSpan(period: string): Span {
  const years = period.match(/\d{4}/g)?.map(Number) ?? []
  const expected = /expected/i.test(period)
  const monthOf = (s: string) => {
    const m = s.toLowerCase().match(/[a-z]{3,}/)?.[0].slice(0, 3)
    return m ? MONTHS.indexOf(m) : -1
  }
  const span: Span = { startYear: years[0], endYear: years.length > 1 ? years[years.length - 1] : undefined, expected }
  if (span.endYear) {
    const [startStr, endStr] = period.split(/—|–|-/)
    const sm = monthOf(startStr ?? '')
    const em = monthOf(endStr ?? '')
    // academic years start in late summer when no month is given
    span.start = new Date(span.startYear, sm >= 0 ? sm : 7, 1)
    span.end = new Date(span.endYear, em >= 0 ? em : 5, 1)
  }
  return span
}

function parseScore(score?: string) {
  const m = score?.match(/([\d.]+)\s*\/\s*(\d+(?:\.\d+)?)/)
  if (!m) return null
  return { value: Number(m[1]), max: Number(m[2]), label: score!.replace(m[0], '').trim() || 'Score' }
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function ScoreRing({ value, max, label }: { value: number; max: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const r = 30
  const c = 2 * Math.PI * r
  const pct = Math.min(1, value / max)
  return (
    <div ref={ref} className="flex items-center gap-4">
      <div className="relative h-[76px] w-[76px] shrink-0">
        <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
          <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
          <motion.circle
            cx="38"
            cy="38"
            r={r}
            fill="none"
            stroke="var(--color-sky)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: inView ? c * (1 - pct) : c }}
            transition={{ duration: 1.6, ease: appleEase }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-[19px] font-semibold leading-none tracking-[-0.02em] text-white">
            <CountUp value={value} decimals={Number.isInteger(value) ? 0 : 1} />
          </span>
        </div>
      </div>
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-white/45">{label}</p>
        <p className="mt-1 font-display text-[22px] font-semibold leading-none tracking-[-0.01em] text-white">
          {value}
          <span className="text-[14px] font-normal text-white/50"> / {max}</span>
        </p>
        <p className="mt-1.5 text-[12.5px] text-white/50">{max}-point scale</p>
      </div>
    </div>
  )
}

function DegreeProgress({ span }: { span: Span }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  if (!span.start || !span.end) return null
  const now = Date.now()
  const total = span.end.getTime() - span.start.getTime()
  const pct = Math.min(1, Math.max(0, (now - span.start.getTime()) / total))
  const years = Math.max(1, Math.round(total / (365.25 * 864e5)))
  const year = Math.min(years, Math.floor(((now - span.start.getTime()) / (365.25 * 864e5)) + 1))
  const endLabel = span.end.toLocaleString('en-GB', { month: 'short', year: 'numeric' })
  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-white/45">Degree progress</p>
        <p className="text-[12.5px] tabular-nums text-white/50">
          Year {year} of {years} · {Math.round(pct * 100)}%
        </p>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 origin-left rounded-full bg-gradient-to-r from-sky/70 to-sky"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: inView ? pct : 0 }}
          transition={{ duration: 1.4, ease: appleEase, delay: 0.2 }}
        />
        <motion.span
          className="absolute top-1/2 -translate-y-1/2"
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: inView ? `${pct * 100}%` : '0%', opacity: inView ? 1 : 0 }}
          transition={{ duration: 1.4, ease: appleEase, delay: 0.2 }}
          style={{ x: '-50%' }}
          aria-hidden
        >
          <span className="block h-3.5 w-3.5 rounded-full bg-white shadow-[0_0_0_4px_rgba(41,151,255,0.25)]" />
          <span className="absolute inset-0 animate-ping rounded-full bg-white/50" />
        </motion.span>
        {/* year ticks */}
        {Array.from({ length: years - 1 }, (_, i) => (
          <span key={i} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-white/20" style={{ left: `${((i + 1) / years) * 100}%` }} aria-hidden />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11.5px] text-white/40">
        <span>{span.start.getFullYear()}</span>
        <span>{span.expected ? `Expected ${endLabel}` : endLabel}</span>
      </div>
    </div>
  )
}

interface ItemProps {
  entry: Entry
  index: number
  open: boolean
  reached: boolean
  onToggle: () => void
}

function Item({ entry, index, open, reached, onToggle }: ItemProps) {
  const span = parseSpan(entry.period)
  const score = parseScore(entry.score)
  const current = span.expected
  const panelId = `edu-panel-${index}`
  return (
    <motion.li variants={fadeUp} className="relative flex gap-5 md:gap-7">
      {/* year node on the spine */}
      <motion.div
        animate={reached ? { scale: 1 } : { scale: 0.9 }}
        transition={spring}
        className={cn(
          'relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-[13px] font-semibold tabular-nums transition-colors duration-500 md:h-16 md:w-16 md:text-[14px]',
          reached ? 'glass-dark text-sky ring-1 ring-sky/50' : 'bg-white/[0.04] text-white/40 ring-1 ring-white/10',
        )}
        aria-hidden
      >
        {span.startYear}
        {current && reached && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-sky ring-2 ring-tile-3" />}
      </motion.div>

      <GlassPanel tone="dark" className={cn('flex-1 rounded-[18px] transition-shadow duration-500', open && 'shadow-[0_0_0_1px_rgba(41,151,255,0.25)]')}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-start justify-between gap-4 p-6 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky md:p-7 rounded-[18px]"
        >
          <div className="min-w-0">
            <h3 className="font-display text-[21px] font-semibold leading-tight text-white md:text-[24px]">{entry.school}</h3>
            <p className="mt-1 text-[17px] text-white/85">{entry.degree}</p>
            <p className="mt-2 text-[14px] tracking-[-0.224px] text-muted-dark">{entry.period}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {entry.score && <span className="hidden rounded-full bg-sky/15 px-3 py-1 text-[13px] font-semibold text-sky sm:inline">{entry.score}</span>}
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring} className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-white/70">
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ height: { duration: 0.45, ease: appleEase }, opacity: { duration: 0.3 } }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 md:px-7 md:pb-7">
                <div className="h-px bg-white/10" />
                {entry.detail && <p className="mt-5 text-[15px] text-white/80">{entry.detail}</p>}
                <p className="mt-3 inline-flex items-center gap-2 text-[14px] text-muted-dark">
                  <MapPin className="h-3.5 w-3.5 text-sky" /> {entry.location}
                </p>

                {(score || span.end) && (
                  <div className="mt-6 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
                    {score && <ScoreRing value={score.value} max={score.max} label={score.label} />}
                    {span.end && <DegreeProgress span={span} />}
                  </div>
                )}

                {entry.coursework && (
                  <>
                    <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.06em] text-white/45">Coursework</p>
                    <motion.div variants={stagger(0.03)} initial="hidden" animate="show" className="mt-3 flex flex-wrap gap-2">
                      {entry.coursework.map((c) => (
                        <Chip key={c} tone="dark">
                          {c}
                        </Chip>
                      ))}
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassPanel>
    </motion.li>
  )
}

/* ── section ────────────────────────────────────────────────────────────── */

export function Education() {
  useContent()
  const [open, setOpen] = useState<number | null>(0)
  const listRef = useRef<HTMLOListElement>(null)
  const n = education.length

  // the spine fills as the reader moves down the list; nodes light up as the fill passes them
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 70%', 'end 60%'] })
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 })
  const [reached, setReached] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const r = Math.min(n, Math.floor(v * n + 0.35) + (v > 0.02 ? 1 : 0))
    setReached((prev) => (prev === r ? prev : r))
  })

  return (
    <section id="education" className="section relative overflow-hidden bg-tile-3 text-white">
      <Background tone="dark" mode="absolute" />
      <div className="container-apple relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading tone="dark" eyebrow="Education" title="Grounded in fundamentals." />
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport} className="text-[13px] text-white/45">
            Tap an entry to expand it
          </motion.p>
        </div>

        <motion.ol
          ref={listRef}
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="relative mt-12 space-y-6"
        >
          {/* spine + fill */}
          <div className="absolute bottom-6 left-[27px] top-6 w-px bg-white/15 md:left-[31px]" aria-hidden>
            <motion.div style={{ scaleY: fill }} className="absolute inset-0 origin-top bg-sky" />
          </div>
          {education.map((e, i) => (
            <Item key={e.school} entry={e} index={i} open={open === i} reached={i < reached} onToggle={() => setOpen((prev) => (prev === i ? null : i))} />
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
