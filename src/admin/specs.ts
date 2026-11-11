import type { Section } from '../content/types'

/**
 * Declarative form layouts. The renderer in fields.tsx turns these into inputs, list editors,
 * pickers and uploaders; the Zod schemas in content/schema.ts do the validation.
 */
export type FieldSpec =
  | { kind: 'text' | 'textarea' | 'number' | 'color' | 'icon' | 'date' | 'url' | 'image' | 'file'; key: string; label: string; help?: string; placeholder?: string; accept?: string; uploadPath?: string; /** upload under this exact name (replaces the previous file) */ fixedName?: string; optional?: boolean }
  | { kind: 'select'; key: string; label: string; options: string[]; help?: string }
  | { kind: 'strings'; key: string; label: string; help?: string; placeholder?: string }
  | { kind: 'list'; key: string; label: string; help?: string; fields: FieldSpec[]; itemLabel: (item: Record<string, unknown>, i: number) => string; newItem: () => Record<string, unknown>; collapsed?: boolean; /** what one item is called in buttons: "Add link", "Delete this link" */ noun?: string }
  | { kind: 'object'; key: string; label: string; fields: FieldSpec[] }

export interface SectionSpec {
  /** 'list': the document is an array of these fields; 'custom': a dedicated editor component */
  root: 'object' | 'list' | 'custom'
  fields: FieldSpec[]
  itemLabel?: (item: Record<string, unknown>, i: number) => string
  newItem?: () => Record<string, unknown>
  noun?: string
}

const projectFields: FieldSpec[] = [
  { kind: 'text', key: 'id', label: 'ID', help: 'lowercase, dashes; used in links and the terminal (e.g. bintrack)' },
  { kind: 'text', key: 'name', label: 'Name' },
  { kind: 'text', key: 'subtitle', label: 'Subtitle' },
  { kind: 'text', key: 'kind', label: 'Kind', placeholder: 'Personal project · Live on Vercel' },
  { kind: 'color', key: 'accent', label: 'Accent colour' },
  { kind: 'text', key: 'monogram', label: 'Monogram', help: 'up to 3 letters, shown when there is no cover' },
  { kind: 'image', key: 'cover', label: 'Cover screenshot', uploadPath: 'projects', optional: true },
  { kind: 'select', key: 'coverPosition', label: 'Cover crop', options: ['top', 'center', 'bottom', 'left top', 'right top'] },
  { kind: 'textarea', key: 'description', label: 'Description' },
  { kind: 'strings', key: 'highlights', label: 'Highlights', help: 'one bullet per line' },
  { kind: 'strings', key: 'stack', label: 'Stack', help: 'one technology per line; matched against skills for the cross-links' },
  {
    kind: 'list',
    key: 'links',
    label: 'Links',
    fields: [
      { kind: 'text', key: 'label', label: 'Label' },
      { kind: 'url', key: 'href', label: 'URL' },
      { kind: 'select', key: 'kind', label: 'Kind', options: ['live', 'github'] },
    ],
    itemLabel: (l) => String(l.label || l.href || 'link'),
    newItem: () => ({ label: 'Source on GitHub', href: 'https://github.com/', kind: 'github' }),
    noun: 'link',
  },
  {
    kind: 'list',
    key: 'metrics',
    label: 'Metrics',
    help: 'three small badges on the cover',
    fields: [
      { kind: 'text', key: 'label', label: 'Label' },
      { kind: 'text', key: 'value', label: 'Value' },
    ],
    itemLabel: (m) => `${m.value ?? ''} ${m.label ?? ''}`.trim() || 'metric',
    newItem: () => ({ label: '', value: '' }),
    noun: 'metric',
  },
]

export const SPECS: Record<Section, SectionSpec> = {
  profile: {
    root: 'object',
    fields: [
      { kind: 'text', key: 'name', label: 'Full name' },
      { kind: 'text', key: 'firstName', label: 'First name' },
      { kind: 'text', key: 'role', label: 'Role' },
      { kind: 'text', key: 'headline', label: 'Headline', help: 'About section title' },
      { kind: 'textarea', key: 'tagline', label: 'Tagline', help: 'under your name in the hero' },
      { kind: 'textarea', key: 'summary', label: 'Summary', help: 'About section; skill names become links automatically' },
      { kind: 'text', key: 'seeking', label: 'Seeking' },
      { kind: 'text', key: 'availability', label: 'Availability badge' },
      { kind: 'text', key: 'location', label: 'Location' },
      { kind: 'text', key: 'email', label: 'Email' },
      { kind: 'text', key: 'collegeEmail', label: 'College email', optional: true },
      { kind: 'text', key: 'phone', label: 'Phone' },
      { kind: 'image', key: 'avatar', label: 'Portrait', uploadPath: 'profile' },
      { kind: 'image', key: 'avatarSmall', label: 'Small avatar', uploadPath: 'profile', help: 'navbar and footer' },
      { kind: 'file', key: 'resumePdf', label: 'Résumé PDF', accept: 'application/pdf', uploadPath: 'resume', fixedName: 'resume.pdf', help: 'every "Download PDF" button serves this file — the Résumé PDF panel does this in one step' },
      {
        kind: 'list',
        key: 'stats',
        label: 'Stats',
        help: 'the four count-up tiles',
        fields: [
          { kind: 'text', key: 'label', label: 'Label' },
          { kind: 'number', key: 'value', label: 'Value' },
          { kind: 'text', key: 'suffix', label: 'Suffix', placeholder: '+', optional: true },
          { kind: 'number', key: 'decimals', label: 'Decimals', optional: true },
        ],
        itemLabel: (s) => `${s.value ?? ''}${s.suffix ?? ''} ${s.label ?? ''}`.trim() || 'stat',
        newItem: () => ({ label: '', value: 0, suffix: '' }),
        noun: 'stat',
      },
      {
        kind: 'list',
        key: 'facts',
        label: 'Quick facts',
        fields: [
          { kind: 'text', key: 'label', label: 'Label' },
          { kind: 'text', key: 'value', label: 'Value' },
        ],
        itemLabel: (f) => String(f.label || 'fact'),
        newItem: () => ({ label: '', value: '' }),
        noun: 'fact',
      },
    ],
  },
  skills: {
    root: 'object',
    fields: [
      {
        kind: 'list',
        key: 'groups',
        label: 'Groups',
        fields: [
          { kind: 'text', key: 'title', label: 'Title' },
          { kind: 'text', key: 'description', label: 'Description' },
          {
            kind: 'list',
            key: 'items',
            label: 'Skills',
            fields: [
              { kind: 'text', key: 'name', label: 'Name' },
              { kind: 'icon', key: 'icon', label: 'Icon' },
              { kind: 'color', key: 'color', label: 'Brand colour', optional: true },
              { kind: 'strings', key: 'aliases', label: 'Aliases', help: 'other names it appears under in project stacks', placeholder: 'one per line' },
            ],
            itemLabel: (s) => String(s.name || 'skill'),
            newItem: () => ({ name: '', icon: 'TbCode', aliases: [] }),
            noun: 'skill',
            collapsed: true,
          },
        ],
        itemLabel: (g) => String(g.title || 'group'),
        newItem: () => ({ title: '', description: '', items: [] }),
        noun: 'group',
      },
      { kind: 'strings', key: 'competencies', label: 'Core competencies' },
    ],
  },
  projects: {
    root: 'list',
    fields: projectFields,
    itemLabel: (p) => String(p.name || p.id || 'project'),
    newItem: () => ({ id: '', name: '', subtitle: '', kind: 'Personal project', accent: '#0a84ff', monogram: '', description: '', highlights: [], stack: [], links: [], metrics: [] }),
    noun: 'project',
  },
  education: {
    root: 'list',
    fields: [
      { kind: 'text', key: 'school', label: 'School' },
      { kind: 'text', key: 'degree', label: 'Degree' },
      { kind: 'text', key: 'detail', label: 'Detail', optional: true },
      { kind: 'text', key: 'period', label: 'Period', help: 'e.g. "2024 — Sept 2028 (expected)" drives the progress bar' },
      { kind: 'text', key: 'location', label: 'Location' },
      { kind: 'text', key: 'score', label: 'Score', placeholder: 'CGPA 8.5 / 10', optional: true },
      { kind: 'strings', key: 'coursework', label: 'Coursework', help: 'one per line' },
    ],
    itemLabel: (e) => String(e.school || 'entry'),
    newItem: () => ({ school: '', degree: '', period: '', location: '' }),
    noun: 'education entry',
  },
  certifications: {
    root: 'object',
    fields: [
      {
        kind: 'list',
        key: 'items',
        label: 'Certifications',
        fields: [
          { kind: 'text', key: 'title', label: 'Title' },
          { kind: 'text', key: 'issuer', label: 'Issuer' },
          { kind: 'text', key: 'platform', label: 'Platform', placeholder: 'NPTEL / Coursera' },
          { kind: 'text', key: 'badge', label: 'Score / tier', placeholder: 'Elite + Silver · 78%', help: 'the percentage draws the ring; words become the tier chip', optional: true },
          { kind: 'strings', key: 'topics', label: 'Topics' },
          { kind: 'file', key: 'credentialUrl', label: 'Credential link or file', accept: 'application/pdf,image/*', uploadPath: 'certificates', help: 'paste the verification URL, or upload the certificate PDF / image', optional: true },
        ],
        itemLabel: (c) => String(c.title || 'certificate'),
        newItem: () => ({ title: '', issuer: '', platform: 'NPTEL', topics: [] }),
        noun: 'certificate',
      },
      { kind: 'strings', key: 'achievements', label: 'Achievements', help: 'one per line' },
    ],
  },
  socials: {
    root: 'list',
    fields: [
      { kind: 'text', key: 'id', label: 'ID', help: 'github, leetcode, gfg, codeforces, linkedin, email — the site looks these up by id' },
      { kind: 'text', key: 'label', label: 'Label' },
      { kind: 'text', key: 'handle', label: 'Handle' },
      { kind: 'text', key: 'href', label: 'Link', placeholder: 'https://… or mailto:…' },
      { kind: 'icon', key: 'icon', label: 'Icon' },
      { kind: 'color', key: 'color', label: 'Brand colour' },
      { kind: 'color', key: 'colorOnDark', label: 'Colour on dark tiles', optional: true },
      { kind: 'text', key: 'blurb', label: 'Blurb' },
      { kind: 'text', key: 'cta', label: 'Call to action' },
    ],
    itemLabel: (s) => String(s.label || s.id || 'profile'),
    newItem: () => ({ id: '', label: '', handle: '', href: 'https://', color: '#0066cc', icon: 'TbWorld', blurb: '', cta: 'Open' }),
    noun: 'profile',
  },
  now: {
    root: 'object',
    fields: [
      { kind: 'date', key: 'updated', label: 'Updated on', help: 'drives the freshness pill' },
      { kind: 'text', key: 'timezone', label: 'Time zone', placeholder: 'Asia/Kolkata' },
      { kind: 'text', key: 'timezoneLabel', label: 'Time zone label', placeholder: 'IST' },
      {
        kind: 'object',
        key: 'location',
        label: 'Location',
        fields: [
          { kind: 'text', key: 'city', label: 'City' },
          { kind: 'text', key: 'region', label: 'Region' },
          { kind: 'object', key: 'coords', label: 'Coordinates (weather)', fields: [{ kind: 'number', key: 'lat', label: 'Latitude' }, { kind: 'number', key: 'lon', label: 'Longitude' }] },
          { kind: 'textarea', key: 'note', label: 'Note' },
          { kind: 'text', key: 'campus', label: 'Campus line' },
        ],
      },
      {
        kind: 'list',
        key: 'focus',
        label: 'Focus',
        fields: [
          { kind: 'text', key: 'label', label: 'Label' },
          { kind: 'text', key: 'value', label: 'Value' },
          { kind: 'text', key: 'detail', label: 'Detail' },
        ],
        itemLabel: (f) => String(f.label || 'focus'),
        newItem: () => ({ label: '', value: '', detail: '' }),
        noun: 'focus item',
      },
      { kind: 'strings', key: 'workingOnIds', label: 'Working on (project ids)', help: 'newest first; must match ids in Projects' },
      { kind: 'object', key: 'portfolioProject', label: 'This portfolio (shown with the working-on cards)', fields: projectFields },
    ],
  },
  gallery: { root: 'custom', fields: [] },
}
