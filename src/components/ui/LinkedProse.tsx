import { useMemo, type ReactNode } from 'react'
import { findSkillByTerm, getSkillEntries, showSkill } from '../../lib/skillUsage'
import { useContent } from '../../content/ContentProvider'
import { cn } from '../../lib/cn'
import { Tooltip } from './Tooltip'

/* ── prose with skill mentions turned into live links ───────────────────── */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

function buildTermRe() {
  // every skill name and alias, longest first, so "Redis Pub/Sub" wins over "Redis"
  const terms = Array.from(new Set(getSkillEntries().flatMap((e) => [e.skill.name, ...(e.skill.aliases ?? [])])))
    .filter((t) => t.length >= 3)
    .sort((a, b) => b.length - a.length)
  return new RegExp(`(?<![A-Za-z0-9])(${terms.map(escapeRe).join('|')})(?![A-Za-z0-9])`, 'gi')
}

export function LinkedProse({ text, className }: { text: string; className?: string }) {
  const { version } = useContent()
  const parts = useMemo(() => {
    const TERM_RE = buildTermRe()
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
              className={cn(
                'rounded-[3px] text-ink underline decoration-primary/40 decoration-dotted underline-offset-[5px] transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus',
                className,
              )}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, className, version])
  return <>{parts}</>
}
