import { ArrowUpRight } from 'lucide-react'
import { Component, cloneElement, useEffect, useRef, type ReactNode } from 'react'
import { SiGithub } from 'react-icons/si'
import { GitHubCalendar } from 'react-github-calendar'
import { bySocialId } from '../../data/socials'
import { useTheme } from '../../hooks/useTheme'
import { GlassPanel } from './GlassPanel'

/** GitHub's own contribution scales, so the graph reads exactly like the one on github.com */
const THEME = {
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  dark: ['#1f1f22', '#0e4429', '#006d32', '#26a641', '#39d353'],
}

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const tooltip = (a: { date: string; count: number }) => {
  const n = a.count
  return `${n === 0 ? 'No' : n} contribution${n === 1 ? '' : 's'} on ${dateFmt.format(new Date(a.date + 'T00:00:00'))}`
}

/** Swap in a fallback if the contributions API is unreachable (throwOnError makes the calendar throw). */
class CalendarBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Live contribution heatmap. `react-github-calendar` fetches the public contribution data for the
 * handle on every page load, so the graph is always current — no token, no build step.
 */
export function GitHubContributions() {
  const { isDark } = useTheme()
  const github = bySocialId('github')
  const username = github.href.split('/').filter(Boolean).pop() ?? ''
  const wrap = useRef<HTMLDivElement>(null)

  // On narrow screens the grid overflows; start scrolled to the newest weeks, not last September.
  useEffect(() => {
    const root = wrap.current
    if (!root) return
    const toEnd = () => {
      const sc = root.querySelector<HTMLElement>('.react-activity-calendar__scroll-container')
      if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = sc.scrollWidth
    }
    const mo = new MutationObserver(toEnd)
    mo.observe(root, { childList: true, subtree: true })
    toEnd()
    return () => mo.disconnect()
  }, [])

  return (
    <GlassPanel spotlight={false} className="rounded-[18px] px-5 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex items-center gap-2.5">
          <SiGithub size={18} className="text-ink" />
          <p className="font-display text-[17px] font-semibold tracking-[-0.374px] text-ink">GitHub activity</p>
          <span className="hidden items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/60 px-2.5 py-0.5 text-[12px] text-ink-48 dark:border-white/10 dark:bg-white/[0.08] sm:inline-flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#26a641] opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#26a641]" />
            </span>
            live
          </span>
        </div>
        <a
          href={github.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1 text-[14px] tracking-[-0.224px] text-primary transition-colors hover:text-primary-focus"
        >
          {github.handle}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </div>

      <div ref={wrap} className="gh-calendar mt-5 text-ink-48">
        <CalendarBoundary
          fallback={
            <p className="text-[14px] text-ink-48">
              Couldn't reach GitHub right now —{' '}
              <a href={github.href} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                see the graph on github.com
              </a>
              .
            </p>
          }
        >
          <GitHubCalendar
            username={username}
            colorScheme={isDark ? 'dark' : 'light'}
            theme={THEME}
            blockSize={13}
            blockMargin={4}
            blockRadius={3}
            fontSize={12}
            weekStart={1}
            labels={{ totalCount: '{{count}} contributions in the last year' }}
            renderBlock={(block, activity) => cloneElement(block, {}, <title>{tooltip(activity)}</title>)}
            throwOnError
          />
        </CalendarBoundary>
      </div>
    </GlassPanel>
  )
}
