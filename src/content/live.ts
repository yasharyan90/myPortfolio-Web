import { iconFor } from './icons'
import { snapshot } from './snapshot'
import type { ContentDoc, Project, ResolvedContent, ResolvedSkillGroup, ResolvedSocial } from './types'

export type { Certification, Education, GalleryImage, Project, ProjectLink, ResolvedSkill, ResolvedSkillGroup, ResolvedSocial } from './types'

/* ── resolve: JSON document → what components consume ───────────────────── */

const CODING_IDS = ['github', 'leetcode', 'gfg', 'codeforces']

export function resolveContent(doc: ContentDoc): ResolvedContent {
  const skillGroups: ResolvedSkillGroup[] = doc.skills.groups.map((g) => ({
    ...g,
    items: g.items.map((s) => ({ ...s, iconName: s.icon, icon: iconFor(s.icon) })),
  }))
  const socials: ResolvedSocial[] = doc.socials.map((s) => ({ ...s, iconName: s.icon, icon: iconFor(s.icon) }))
  const byId = new Map(doc.projects.map((p) => [p.id, p]))
  const workingOn: Project[] = [...doc.now.workingOnIds.map((id) => byId.get(id)).filter((p): p is Project => !!p), doc.now.portfolioProject]
  return {
    doc,
    profile: doc.profile,
    skillGroups,
    competencies: doc.skills.competencies,
    projects: doc.projects,
    education: doc.education,
    certifications: doc.certifications.items,
    achievements: doc.certifications.achievements,
    socials,
    codingProfiles: socials.filter((s) => CODING_IDS.includes(s.id)),
    contactProfiles: socials.filter((s) => !CODING_IDS.includes(s.id)),
    now: doc.now,
    workingOn,
    portfolioProject: doc.now.portfolioProject,
    gallery: doc.gallery?.items ?? [],
  }
}

/* ── live bindings ───────────────────────────────────────────────────────── */
/*
 * ES module exports are live: an importer that reads `profile` sees the latest assignment.
 * Non-React code (the terminal's commands) reads these at call time. React components call
 * useContent() so they re-render when the content changes.
 */

export let content: ResolvedContent = resolveContent(snapshot)
export let profile = content.profile
export let skillGroups = content.skillGroups
export let competencies = content.competencies
export let projects = content.projects
export let education = content.education
export let certifications = content.certifications
export let achievements = content.achievements
export let socials = content.socials
export let codingProfiles = content.codingProfiles
export let contactProfiles = content.contactProfiles
export let now = content.now
export let workingOn = content.workingOn
export let portfolioProject = content.portfolioProject
export let gallery = content.gallery

export const bySocialId = (id: string) => socials.find((s) => s.id === id) ?? socials[0]

type Listener = (c: ResolvedContent) => void
const listeners = new Set<Listener>()

export function getContent() {
  return content
}

/** Replace the live content (whole document) and notify subscribers. */
export function setLiveContent(doc: ContentDoc) {
  content = resolveContent(doc)
  profile = content.profile
  skillGroups = content.skillGroups
  competencies = content.competencies
  projects = content.projects
  education = content.education
  certifications = content.certifications
  achievements = content.achievements
  socials = content.socials
  codingProfiles = content.codingProfiles
  contactProfiles = content.contactProfiles
  now = content.now
  workingOn = content.workingOn
  portfolioProject = content.portfolioProject
  gallery = content.gallery
  listeners.forEach((l) => l(content))
}

export function subscribeContent(l: Listener) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** Merge published sections from the database over the snapshot (missing sections keep the snapshot). */
export function mergeSections(base: ContentDoc, rows: Partial<Record<keyof ContentDoc, unknown>>): ContentDoc {
  const next = { ...base }
  for (const key of Object.keys(rows) as (keyof ContentDoc)[]) {
    const v = rows[key]
    if (v && typeof v === 'object') (next as Record<string, unknown>)[key] = v
  }
  return next
}
