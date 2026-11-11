import { achievements, certifications } from '../data/certifications'
import { education } from '../data/education'
import { now, portfolioProject } from '../data/now'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { competencies, skillGroups } from '../data/skills'
import { socials } from '../data/socials'
import type { ContentDoc } from './types'

/**
 * The content that ships inside the bundle. It is what the site paints first, what it falls back
 * to when Supabase is unreachable, and what seeds an empty database.
 */
export const snapshot: ContentDoc = {
  profile,
  skills: { groups: skillGroups, competencies },
  projects,
  education,
  certifications: { items: certifications, achievements },
  socials,
  now: {
    updated: now.updated,
    timezone: now.timezone,
    timezoneLabel: now.timezoneLabel,
    location: now.location,
    focus: now.focus,
    workingOnIds: now.workingOnIds,
    portfolioProject,
  },
}
