import { motion, useInView } from 'framer-motion'
import { ArrowUpRight, Check, Copy } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { bySocialId, contactProfiles, type Social } from '../../data/socials'
import { cn } from '../../lib/cn'
import { monthYear, useCodeforces, useGitHubStats, useLeetCode, type Live } from '../../lib/liveStats'
import { fadeUp, spring, stagger, viewport } from '../../lib/motion'
import { Link } from '../../hooks/useRoute'
import { CountUp } from '../ui/CountUp'
import { GlassPanel } from '../ui/GlassPanel'
import { SectionHeading } from '../ui/SectionHeading'
import { SocialButton } from '../ui/SocialButton'

/* ── small parts ────────────────────────────────────────────────────────── */

function Skeleton({ className }: { className?: string }) {
  return <span className={cn('inline-block animate-pulse rounded-[6px] bg-black/[0.06] dark:bg-white/10', className)} aria-hidden />
}

function Stat({ value, label, suffix = '' }: { value: number | null | undefined; label: string; suffix?: string }) {
  return (
    <div>
      <p className="font-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink">
        {value == null ? <Skeleton className="h-7 w-14" /> : <CountUp value={value} suffix={suffix} />}
      </p>
      <p className="mt-1.5 text-[12.5px] tracking-[-0.1px] text-ink-48">{label}</p>
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-[1.45] text-ink-48">{children}</p>
}

/** Copies the handle; flips to a check for a moment. */
function HandleChip({ handle, brand }: { handle: string; brand: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(handle)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      title="Copy handle"
      className="group/handle inline-flex max-w-full items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 font-mono text-[12.5px] text-ink-80 transition-colors hover:bg-white dark:bg-white/10 dark:text-white/85 dark:hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: brand }} />
      <span className="truncate">{handle}</span>
      {copied ? <Check className="h-3 w-3 shrink-0 text-primary" /> : <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/handle:opacity-60" />}
    </button>
  )
}

/* ── live blocks ────────────────────────────────────────────────────────── */

const LC_COLORS = { easy: '#00b8a3', medium: '#ffb800', hard: '#ff375f' } as const

function LeetCodeBlock({ live, fallback }: { live: Live<import('../../lib/liveStats').LeetCodeStats>; fallback: string }) {
  if (live.status === 'error') return <Note>{fallback}</Note>
  const d = live.status === 'ready' ? live.data : null
  const rows = (['easy', 'medium', 'hard'] as const).map((k) => ({
    k,
    label: k[0].toUpperCase() + k.slice(1),
    count: d?.solved[k] ?? null,
    share: d && d.solved.all ? d.solved[k] / d.solved.all : 0,
    of: d?.total[k] ?? null,
  }))
  return (
    <div>
      <Stat value={d?.solved.all} label="problems solved" />
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.k} className="group/row" title={r.of != null ? `${r.count} of ${r.of} ${r.label.toLowerCase()} problems` : undefined}>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink-80">{r.label}</span>
              <span className="tabular-nums text-ink-48">{r.count == null ? <Skeleton className="h-3 w-6" /> : r.count}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/10">
              <motion.div
                className="h-full origin-left rounded-full transition-[filter] duration-300 group-hover/row:brightness-110"
                style={{ background: LC_COLORS[r.k] }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: r.share }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CodeforcesBlock({ live, fallback }: { live: Live<import('../../lib/liveStats').CodeforcesStats>; fallback: string }) {
  if (live.status === 'error') return <Note>{fallback}</Note>
  const d = live.status === 'ready' ? live.data : null
  if (!d) return <Stat value={undefined} label="rating" />
  if (d.rating != null) {
    return (
      <div>
        <Stat value={d.rating} label={`rating · ${d.rank ?? 'rated'}`} />
        {d.maxRating != null && (
          <Note>
            Peak {d.maxRating}
            {d.maxRank ? ` (${d.maxRank})` : ''} · member since {monthYear(d.registeredAt)}
          </Note>
        )}
      </div>
    )
  }
  return (
    <div>
      <p className="font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">Unrated so far</p>
      <p className="mt-1.5 text-[12.5px] text-ink-48">No rated contests yet · member since {monthYear(d.registeredAt)}</p>
      <Note>{fallback}</Note>
    </div>
  )
}

function GitHubBlock({ live, fallback }: { live: Live<import('../../lib/liveStats').GitHubStats>; fallback: string }) {
  if (live.status === 'error') return <Note>{fallback}</Note>
  const d = live.status === 'ready' ? live.data : null
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <Stat value={d?.publicRepos} label="public repos" />
        <Stat value={d?.contributions ?? (d ? 0 : undefined)} label="contributions · 365 days" />
      </div>
      <Link href="/#contributions" className="mt-4 inline-flex items-center gap-1 text-[13px] text-primary hover:underline">
        See the live heatmap <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
      {d && <p className="mt-2 text-[12px] text-ink-48">On GitHub since {monthYear(d.createdAt)}</p>}
    </div>
  )
}

/* ── platform card ──────────────────────────────────────────────────────── */

function PlatformCard({ social, children }: { social: Social; children: (inView: boolean) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '200px 0px' })
  const Icon = social.icon
  return (
    <motion.div ref={ref} variants={fadeUp} whileHover={{ y: -6 }} transition={spring} className="h-full">
      <GlassPanel className="group relative flex h-full flex-col rounded-[18px] p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[18px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: `radial-gradient(260px circle at 100% 0%, ${social.color}22, transparent 70%)`, boxShadow: `inset 0 0 0 1px ${social.color}44` }}
        />
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.08 }}
              transition={spring}
              className="grid h-11 w-11 place-items-center rounded-[14px] text-white ring-1 ring-white/10"
              style={{ backgroundColor: social.color, boxShadow: `0 10px 30px -10px ${social.color}99` }}
            >
              <Icon size={20} />
            </motion.span>
            <div>
              <h3 className="font-display text-[19px] font-semibold leading-tight tracking-[-0.01em] text-ink">{social.label}</h3>
              <p className="text-[12.5px] text-ink-48">Live from {social.label}</p>
            </div>
          </div>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${social.cta} on ${social.label}`}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-48 transition-all hover:bg-black/[0.05] hover:text-ink dark:hover:bg-white/10"
          >
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
        <div className="relative z-10 mt-6 flex-1">{children(inView)}</div>
        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-between gap-3">
          <HandleChip handle={social.handle} brand={social.color} />
          <a href={social.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px]" style={{ color: social.color }}>
            {social.cta} <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </GlassPanel>
    </motion.div>
  )
}

/* ── section ────────────────────────────────────────────────────────────── */

const github = bySocialId('github')
const leetcode = bySocialId('leetcode')
const gfg = bySocialId('gfg')
const codeforces = bySocialId('codeforces')

const GH_LOGIN = github.handle.replace(/^@/, '')
const LC_USER = leetcode.handle
const CF_HANDLE = codeforces.handle

function LiveGitHub({ inView }: { inView: boolean }) {
  return <GitHubBlock live={useGitHubStats(GH_LOGIN, inView)} fallback={github.blurb} />
}
function LiveLeetCode({ inView }: { inView: boolean }) {
  return <LeetCodeBlock live={useLeetCode(LC_USER, inView)} fallback={leetcode.blurb} />
}
function LiveCodeforces({ inView }: { inView: boolean }) {
  return <CodeforcesBlock live={useCodeforces(CF_HANDLE, inView)} fallback={codeforces.blurb} />
}

export function Coding() {
  return (
    <section id="coding" className="section relative">
      <div className="container-apple">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <SectionHeading
            eyebrow="Profiles"
            title="Where I practice."
            subtitle="Every handle in one place — GitHub for what I build, LeetCode, GeeksforGeeks and Codeforces for how I think. Numbers below are fetched live."
          />
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewport}>
            <GlassPanel spotlight={false} className="rounded-[18px] px-7 py-5 text-center md:text-left">
              <p className="font-display text-[48px] font-semibold leading-none tracking-[-0.02em] text-primary">
                <CountUp value={500} suffix="+" />
              </p>
              <p className="mt-1.5 text-[14px] tracking-[-0.224px] text-ink-48">DSA problems solved, all platforms</p>
            </GlassPanel>
          </motion.div>
        </div>

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
        >
          <PlatformCard social={github}>{(inView) => <LiveGitHub inView={inView} />}</PlatformCard>
          <PlatformCard social={leetcode}>{(inView) => <LiveLeetCode inView={inView} />}</PlatformCard>
          <PlatformCard social={gfg}>
            {() => (
              <div>
                <p className="font-display text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">Striver's A2Z sheet</p>
                <p className="mt-1.5 text-[12.5px] text-ink-48">In progress, problem by problem</p>
                <p className="mt-3 text-[13px] leading-[1.45] text-ink-48">GeeksforGeeks has no public stats API, so the profile itself has the latest numbers.</p>
              </div>
            )}
          </PlatformCard>
          <PlatformCard social={codeforces}>{(inView) => <LiveCodeforces inView={inView} />}</PlatformCard>
        </motion.div>

        <motion.div
          variants={stagger(0.1, 0.3)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-6 grid gap-5 sm:grid-cols-2"
        >
          {contactProfiles.map((s) => (
            <SocialButton key={s.id} social={s} variant="card" />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
