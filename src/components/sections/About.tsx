import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { profile } from '../../data/profile'
import { Link } from '../../hooks/useRoute'
import { fadeUp, spring, stagger, viewport } from '../../lib/motion'
import { findSkillByTerm, showSkill, skillEntries } from '../../lib/skillUsage'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'
import { Tooltip } from '../ui/Tooltip'

/* ── prose with skill mentions turned into live links ───────────────────── */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

/** Every skill name and alias, longest first, so "Redis Pub/Sub" wins over "Redis". */
const TERMS = Array.from(new Set(skillEntries.flatMap((e) => [e.skill.name, ...(e.skill.aliases ?? [])])))
  .filter((t) => t.length >= 3)
  .sort((a, b) => b.length - a.length)
const TERM_RE = new RegExp(`(?<![A-Za-z0-9])(${TERMS.map(escapeRe).join('|')})(?![A-Za-z0-9])`, 'gi')

function LinkedProse({ text }: { text: string }) {
  const parts = useMemo(() => {
    const out: ReactNode[] = []
    let last = 0
    for (const m of text.matchAll(TERM_RE)) {
      const term = m[1]
      const entry = findSkillByTerm(term)
      const start = m.index ?? 0
      if (start > last) out.push(text.slice(last, start))
      if (entry) {
        out.push(
          <Tooltip key={start} label={`${entry.skill.name} · ${entry.used.length ? `${entry.used.length} project${entry.used.length > 1 ? 's' : ''}` : entry.group}`}>
            <button
              type="button"
              onClick={() => showSkill(entry.skill.name)}
              className="rounded-[3px] text-ink underline decoration-primary/40 decoration-dotted underline-offset-[5px] transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
            >
              {term}
            </button>
          </Tooltip>,
        )
      } else {
        out.push(term)
      }
      last = start + term.length
    }
    if (last < text.length) out.push(text.slice(last))
    return out
  }, [text])
  return <>{parts}</>
}

/* ── a panel that tilts a few degrees toward the cursor ─────────────────── */

function TiltPanel({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [4, -4]), spring)
  const ry = useSpring(useTransform(px, [0, 1], [-4, 4]), spring)
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
    <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 1000 }} onMouseMove={onMove} onMouseLeave={reset} className={className}>
      {children}
    </motion.div>
  )
}

/* ── facts that lead somewhere ──────────────────────────────────────────── */

const FACT_LINKS: Record<string, { href: string; hint: string }> = {
  'Based in': { href: '/#contact', hint: 'See my local time' },
  Studying: { href: '/#education', hint: 'Open the timeline' },
  Focus: { href: '/#skills', hint: 'Browse the toolkit' },
  Currently: { href: '/now', hint: 'Read the /now page' },
}

export function About() {
  return (
    <section id="about" className="section relative">
      <div className="container-apple">
        <SectionHeading eyebrow="About" title={profile.headline} subtitle={`Seeking a ${profile.seeking}.`} />

        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-12 grid gap-5 md:grid-cols-[1.4fr_1fr]"
        >
          <motion.div variants={fadeUp} className="[perspective:1000px]">
            <TiltPanel className="h-full">
              <GlassPanel className="h-full rounded-[18px] p-7 md:p-9">
                <p className="text-[17px] leading-[1.6] text-ink-80 sm:text-[19px]">
                  <LinkedProse text={profile.summary} />
                </p>
                <p className="mt-5 text-[12.5px] text-ink-48">Dotted terms are live — tap one to open it in the Skills section.</p>
                <div className="mt-8 grid grid-cols-2 gap-4 lg:hidden">
                  {profile.stats.map((s) => (
                    <div key={s.label}>
                      <p className="font-display text-[26px] font-semibold leading-none text-ink">
                        <CountUp value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
                      </p>
                      <p className="mt-1 text-[13px] text-ink-48">{s.label}</p>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </TiltPanel>
          </motion.div>

          <motion.div variants={fadeUp}>
            <GlassPanel className="h-full rounded-[18px] p-3">
              <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
                {profile.facts.map((f) => {
                  const link = FACT_LINKS[f.label]
                  const inner = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">{f.label}</span>
                        <span className="mt-0.5 block text-[17px] text-ink">{f.value}</span>
                      </span>
                      {link && (
                        <span className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-ink-48 opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 md:translate-x-1 md:group-hover:translate-x-0">
                          <span className="hidden sm:inline">{link.hint}</span>
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                        </span>
                      )}
                    </>
                  )
                  return (
                    <li key={f.label}>
                      {link ? (
                        <Link
                          href={link.href}
                          className="group flex items-center gap-4 rounded-[12px] px-4 py-3.5 transition-colors hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-focus dark:hover:bg-white/[0.05]"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-4 px-4 py-3.5">{inner}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </GlassPanel>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
