import { z } from 'zod'
import type { ContentDoc, Section } from './types'

/** Shared bits */
const hex = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Use a hex colour like #0066cc')
const url = z.string().url('Must be a full URL, e.g. https://…')
const pathOrUrl = z.string().min(1).refine((v) => v.startsWith('/') || /^https?:\/\//.test(v) || v.startsWith('data:'), 'Use a site path (/x) or a full URL')
const nonEmpty = z.string().trim().min(1, 'Required')

export const profileSchema = z.object({
  name: nonEmpty,
  firstName: nonEmpty,
  role: nonEmpty,
  headline: nonEmpty,
  tagline: nonEmpty,
  summary: nonEmpty,
  seeking: nonEmpty,
  location: nonEmpty,
  email: z.string().email(),
  collegeEmail: z.string().email().or(z.literal('')),
  phone: nonEmpty,
  avatar: pathOrUrl,
  avatarSmall: pathOrUrl,
  resume: pathOrUrl,
  resumePdf: pathOrUrl,
  availability: nonEmpty,
  stats: z.array(z.object({ label: nonEmpty, value: z.number(), suffix: z.string(), decimals: z.number().int().min(0).max(3).optional() })),
  facts: z.array(z.object({ label: nonEmpty, value: nonEmpty })),
})

export const skillSchema = z.object({
  name: nonEmpty,
  icon: nonEmpty,
  color: hex.optional(),
  aliases: z.array(z.string().trim().min(1)).optional(),
})
export const skillsSchema = z.object({
  groups: z.array(z.object({ title: nonEmpty, description: z.string(), items: z.array(skillSchema) })),
  competencies: z.array(nonEmpty),
})

export const projectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, digits and dashes'),
  name: nonEmpty,
  subtitle: nonEmpty,
  kind: nonEmpty,
  accent: hex,
  monogram: z.string().max(3),
  cover: pathOrUrl.optional(),
  coverPosition: z.string().optional(),
  description: nonEmpty,
  highlights: z.array(nonEmpty),
  stack: z.array(nonEmpty),
  links: z.array(z.object({ label: nonEmpty, href: url, kind: z.enum(['github', 'live']) })),
  metrics: z.array(z.object({ label: nonEmpty, value: nonEmpty })),
})
export const projectsSchema = z.array(projectSchema).superRefine((list, ctx) => {
  const seen = new Set<string>()
  list.forEach((p, i) => {
    if (seen.has(p.id)) ctx.addIssue({ code: 'custom', path: [i, 'id'], message: `duplicate id "${p.id}"` })
    seen.add(p.id)
  })
})

export const educationSchema = z.array(
  z.object({
    school: nonEmpty,
    degree: nonEmpty,
    detail: z.string().optional(),
    period: nonEmpty,
    location: nonEmpty,
    score: z.string().optional(),
    coursework: z.array(nonEmpty).optional(),
  }),
)

export const certificationsSchema = z.object({
  items: z.array(
    z.object({
      title: nonEmpty,
      issuer: nonEmpty,
      platform: nonEmpty,
      badge: z.string().optional(),
      topics: z.array(nonEmpty),
      credentialUrl: pathOrUrl.optional(),
    }),
  ),
  achievements: z.array(nonEmpty),
})

export const socialsSchema = z.array(
  z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    label: nonEmpty,
    handle: nonEmpty,
    href: z.string().min(1).refine((v) => /^https?:\/\//.test(v) || v.startsWith('mailto:'), 'Use https://… or mailto:…'),
    color: hex,
    colorOnDark: hex.optional(),
    icon: nonEmpty,
    blurb: z.string(),
    cta: nonEmpty,
  }),
)

export const nowSchema = z.object({
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  timezone: nonEmpty,
  timezoneLabel: nonEmpty,
  location: z.object({
    city: nonEmpty,
    region: nonEmpty,
    coords: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }),
    note: z.string(),
    campus: z.string(),
  }),
  focus: z.array(z.object({ label: nonEmpty, value: nonEmpty, detail: z.string() })),
  workingOnIds: z.array(nonEmpty),
  portfolioProject: projectSchema,
})

export const gallerySchema = z.object({
  items: z.array(
    z.object({
      id: nonEmpty,
      src: pathOrUrl,
      thumb: pathOrUrl,
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      caption: z.string().max(300).optional(),
      alt: z.string().max(300).optional(),
    }),
  ),
})

export const SECTION_SCHEMAS: { [K in Section]: z.ZodType<ContentDoc[K]> } = {
  profile: profileSchema as z.ZodType<ContentDoc['profile']>,
  skills: skillsSchema as z.ZodType<ContentDoc['skills']>,
  projects: projectsSchema as z.ZodType<ContentDoc['projects']>,
  education: educationSchema as z.ZodType<ContentDoc['education']>,
  certifications: certificationsSchema as z.ZodType<ContentDoc['certifications']>,
  socials: socialsSchema as z.ZodType<ContentDoc['socials']>,
  now: nowSchema as z.ZodType<ContentDoc['now']>,
  gallery: gallerySchema as z.ZodType<ContentDoc['gallery']>,
}

export function validateSection<K extends Section>(section: K, value: unknown): { ok: true; data: ContentDoc[K] } | { ok: false; issues: string[] } {
  const r = SECTION_SCHEMAS[section].safeParse(value)
  if (r.success) return { ok: true, data: r.data }
  return { ok: false, issues: r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) }
}
