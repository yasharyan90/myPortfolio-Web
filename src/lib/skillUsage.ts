import { getContent, subscribeContent } from '../content/live'
import type { Project, ResolvedContent, ResolvedSkill } from '../content/types'

/** 'React 18' → 'react', 'Go (Fiber)' → 'go', 'Express.js' → 'express' */
export function normalizeTech(s: string) {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\.js\b/g, '')
    .replace(/\s+v?\d+(\.\d+)*$/, '')
    .replace(/[^a-z0-9+#/ -]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
function mentioned(text: string, term: string) {
  return new RegExp(`(^|[^a-z0-9])${escape(term)}([^a-z0-9]|$)`).test(text)
}

export interface SkillEntry {
  skill: ResolvedSkill
  group: string
  used: Project[]
}

interface Index {
  entries: SkillEntry[]
  byName: Map<string, SkillEntry>
}

/** Projects whose stack (or write-up) uses this skill. Prose matches need ≥ 3 chars so 'Go' never matches the verb. */
function build(c: ResolvedContent): Index {
  const prose = new Map(c.projects.map((p) => [p.id, `${p.description} ${p.highlights.join(' ')}`.toLowerCase()]))
  const stacks = new Map(c.projects.map((p) => [p.id, new Set(p.stack.map(normalizeTech))]))
  const usage = (skill: ResolvedSkill) => {
    const terms = [normalizeTech(skill.name), ...(skill.aliases ?? []).map(normalizeTech)].filter(Boolean)
    return c.projects.filter((p) => {
      if (terms.some((t) => stacks.get(p.id)!.has(t))) return true
      const text = prose.get(p.id)!
      return terms.some((t) => t.length >= 3 && mentioned(text, t))
    })
  }
  const entries = c.skillGroups.flatMap((g) => g.items.map((skill) => ({ skill, group: g.title, used: usage(skill) })))
  return { entries, byName: new Map(entries.map((e) => [e.skill.name, e])) }
}

let index = build(getContent())
subscribeContent((c) => {
  index = build(c)
})

/** Every skill, flattened with its group and project usage — current as of the latest content. */
export function getSkillEntries(): SkillEntry[] {
  return index.entries
}

export function findSkillByName(name: string) {
  return index.byName.get(name)
}

export function findSkillByTerm(term: string): SkillEntry | undefined {
  const t = normalizeTech(term)
  return index.entries.find((e) => normalizeTech(e.skill.name) === t) ?? index.entries.find((e) => (e.skill.aliases ?? []).some((a) => normalizeTech(a) === t))
}

/** Skills that share at least one project with `entry`, most shared first. */
export function pairedWith(entry: SkillEntry, limit = 4): SkillEntry[] {
  if (entry.used.length === 0) return []
  const ids = new Set(entry.used.map((p) => p.id))
  return index.entries
    .filter((e) => e.skill.name !== entry.skill.name)
    .map((e) => ({ e, shared: e.used.filter((p) => ids.has(p.id)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.e.used.length - a.e.used.length)
    .slice(0, limit)
    .map((x) => x.e)
}

/* ── cross-section jumps ────────────────────────────────────────────────── */

export const SHOW_PROJECT_EVENT = 'portfolio:show-project'
export const PENDING_PROJECT_KEY = 'pending-project'
export const SHOW_SKILL_EVENT = 'portfolio:show-skill'
export const PENDING_SKILL_KEY = 'pending-skill'

/** If the home page isn't mounted (we're on /now), remember the request, route home and let the section consume it on mount. */
function goHomeWith(key: string, value: string, hash: string) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
  window.history.pushState(null, '', `/#${hash}`)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function readPending(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}
export function clearPending(key: string) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/** Ask the Projects section to bring a card on stage (works in pinned and swipe modes, from any route). */
export function showProject(id: string) {
  if (!document.getElementById('projects')) return goHomeWith(PENDING_PROJECT_KEY, id, 'projects')
  window.dispatchEvent(new CustomEvent(SHOW_PROJECT_EVENT, { detail: id }))
}

/** Ask the Skills section to pin a skill and scroll to it (from any route). */
export function showSkill(name: string) {
  if (!document.getElementById('skills')) return goHomeWith(PENDING_SKILL_KEY, name, 'skills')
  window.dispatchEvent(new CustomEvent(SHOW_SKILL_EVENT, { detail: name }))
}
