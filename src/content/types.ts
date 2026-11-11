import type { IconType } from 'react-icons'
import type { Certification } from '../data/certifications'
import type { Education } from '../data/education'
import type { Project, ProjectLink } from '../data/projects'
import type { Skill, SkillGroup } from '../data/skills'
import type { Social } from '../data/socials'

export type { Certification, Education, Project, ProjectLink, Skill, SkillGroup, Social }

/* ── the JSON documents stored per section ──────────────────────────────── */

export interface ProfileStat {
  label: string
  value: number
  suffix: string
  decimals?: number
}
export interface ProfileFact {
  label: string
  value: string
}
export interface ProfileDoc {
  name: string
  firstName: string
  role: string
  headline: string
  tagline: string
  summary: string
  seeking: string
  location: string
  email: string
  collegeEmail: string
  phone: string
  avatar: string
  avatarSmall: string
  resume: string
  resumePdf: string
  availability: string
  stats: ProfileStat[]
  facts: ProfileFact[]
}

export interface SkillsDoc {
  groups: SkillGroup[]
  competencies: string[]
}

export interface CertificationsDoc {
  items: Certification[]
  achievements: string[]
}

export interface NowFocus {
  label: string
  value: string
  detail: string
}
export interface NowDoc {
  updated: string
  timezone: string
  timezoneLabel: string
  location: {
    city: string
    region: string
    coords: { lat: number; lon: number }
    note: string
    campus: string
  }
  focus: NowFocus[]
  /** project ids actively in progress, newest first */
  workingOnIds: string[]
  /** this site itself, shown alongside the in-progress projects */
  portfolioProject: Project
}

/** One photo: the original (or a 2400 px re-encode) plus a 640 px thumbnail, both in the media bucket. */
export interface GalleryImage {
  id: string
  src: string
  thumb: string
  width: number
  height: number
  caption?: string
  alt?: string
}
export interface GalleryDoc {
  items: GalleryImage[]
}

export interface ContentDoc {
  profile: ProfileDoc
  skills: SkillsDoc
  projects: Project[]
  education: Education[]
  certifications: CertificationsDoc
  socials: Social[]
  now: NowDoc
  gallery: GalleryDoc
}

export type Section = keyof ContentDoc
export const SECTIONS: Section[] = ['profile', 'skills', 'projects', 'education', 'certifications', 'socials', 'now', 'gallery']

export const SECTION_LABELS: Record<Section, { title: string; blurb: string }> = {
  profile: { title: 'Profile & contact', blurb: 'Name, role, headline, summary, availability, contact details, stats and quick facts.' },
  skills: { title: 'Skills', blurb: 'Skill groups, each item with an icon, brand colour and aliases, plus the core competencies.' },
  projects: { title: 'Projects', blurb: 'Every project card: cover, description, highlights, stack, links and metrics. Order is display order.' },
  education: { title: 'Education', blurb: 'Schools, degrees, periods, scores and coursework.' },
  certifications: { title: 'Certifications & achievements', blurb: 'Certificates with scores and verification links, and the achievement lines.' },
  socials: { title: 'Coding profiles & socials', blurb: 'Handles, links, brand colours and blurbs for GitHub, LeetCode, GFG, Codeforces, LinkedIn and email.' },
  now: { title: 'Now page', blurb: 'Where you are, what you are focused on, which projects are active.' },
  gallery: { title: 'Gallery', blurb: 'Photos behind the gallery icon on your portrait. Uploads get a fast thumbnail and a high-resolution version.' },
}

/* ── resolved content: icons turned into components ─────────────────────── */

export type ResolvedSkill = Omit<Skill, 'icon'> & { icon: IconType; iconName: string }
export type ResolvedSkillGroup = Omit<SkillGroup, 'items'> & { items: ResolvedSkill[] }
export type ResolvedSocial = Omit<Social, 'icon'> & { icon: IconType; iconName: string }

export interface ResolvedContent {
  doc: ContentDoc
  profile: ProfileDoc
  skillGroups: ResolvedSkillGroup[]
  competencies: string[]
  projects: Project[]
  education: Education[]
  certifications: Certification[]
  achievements: string[]
  socials: ResolvedSocial[]
  codingProfiles: ResolvedSocial[]
  contactProfiles: ResolvedSocial[]
  now: NowDoc
  workingOn: Project[]
  portfolioProject: Project
  gallery: GalleryImage[]
}

export interface SectionRow {
  section: Section
  draft: unknown | null
  published: unknown | null
  published_at: string | null
  updated_at: string | null
  updated_by?: string | null
}

export interface VersionRow {
  id: number
  section: Section
  snapshot: unknown
  published_at: string
  published_by: string | null
  note: string | null
}
