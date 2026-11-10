import { projects, type Project } from '../data/projects'
import { skillGroups, type Skill } from '../data/skills'

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

const prose = new Map<string, string>(projects.map((p) => [p.id, `${p.description} ${p.highlights.join(' ')}`.toLowerCase()]))
const stacks = new Map<string, Set<string>>(projects.map((p) => [p.id, new Set(p.stack.map(normalizeTech))]))

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
function mentioned(text: string, term: string) {
  return new RegExp(`(^|[^a-z0-9])${escape(term)}([^a-z0-9]|$)`).test(text)
}

/** Projects whose stack (or write-up) uses this skill. Prose matches need ≥ 3 chars so 'Go' never matches the verb. */
function compute(skill: Skill): Project[] {
  const name = normalizeTech(skill.name)
  const terms = [name, ...(skill.aliases ?? []).map(normalizeTech)].filter(Boolean)
  return projects.filter((p) => {
    const stack = stacks.get(p.id)!
    if (terms.some((t) => stack.has(t))) return true
    const text = prose.get(p.id)!
    return terms.some((t) => t.length >= 3 && mentioned(text, t))
  })
}

const cache = new Map<string, Project[]>()
export function usageOf(skill: Skill): Project[] {
  let hit = cache.get(skill.name)
  if (!hit) {
    hit = compute(skill)
    cache.set(skill.name, hit)
  }
  return hit
}

export interface SkillEntry {
  skill: Skill
  group: string
  used: Project[]
}

/** Every skill, flattened with its group and project usage. */
export const skillEntries: SkillEntry[] = skillGroups.flatMap((g) => g.items.map((skill) => ({ skill, group: g.title, used: usageOf(skill) })))

/** Skills that share at least one project with `entry`, most shared first. */
export function pairedWith(entry: SkillEntry, limit = 4): SkillEntry[] {
  if (entry.used.length === 0) return []
  const ids = new Set(entry.used.map((p) => p.id))
  return skillEntries
    .filter((e) => e.skill.name !== entry.skill.name)
    .map((e) => ({ e, shared: e.used.filter((p) => ids.has(p.id)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.e.used.length - a.e.used.length)
    .slice(0, limit)
    .map((x) => x.e)
}

export const SHOW_PROJECT_EVENT = 'portfolio:show-project'

/** Ask the Projects section to bring a card on stage (works in pinned and swipe modes). */
export function showProject(id: string) {
  window.dispatchEvent(new CustomEvent(SHOW_PROJECT_EVENT, { detail: id }))
}

export const SHOW_SKILL_EVENT = 'portfolio:show-skill'

/** Ask the Skills section to pin a skill and scroll to it (fired from auto-linked terms in About). */
export function showSkill(name: string) {
  window.dispatchEvent(new CustomEvent(SHOW_SKILL_EVENT, { detail: name }))
}

/** Longest-first list of every skill name + alias, for highlighting mentions in prose. */
export function findSkillByTerm(term: string): SkillEntry | undefined {
  const t = normalizeTech(term)
  return skillEntries.find((e) => normalizeTech(e.skill.name) === t) ?? skillEntries.find((e) => (e.skill.aliases ?? []).some((a) => normalizeTech(a) === t))
}
