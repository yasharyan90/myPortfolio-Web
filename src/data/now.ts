import type { Project } from './projects'
import { projects } from './projects'
import { profile } from './profile'

/**
 * The /now page — what I'm doing at this point in my life (nownownow.com convention).
 * Update `updated` whenever you change anything here.
 */
export const now = {
  updated: '2026-08-30',
  timezone: 'Asia/Kolkata',
  timezoneLabel: 'IST',

  location: {
    city: 'Prayagraj',
    region: 'Uttar Pradesh, India',
    note: 'Home for the semester break — back on campus at VIT Bhopal for the next term.',
    campus: 'VIT Bhopal · B.Tech CS (Cloud Computing & Automation) · Class of 2028',
  },

  focus: [
    { label: 'Learning', value: "Striver's A2Z DSA sheet — graphs and DP", detail: '500+ problems solved so far' },
    { label: 'Deepening', value: 'TypeScript and Go for real-time backends', detail: 'WebSockets, Redis Pub/Sub, RBAC' },
    { label: 'Open to', value: profile.availability, detail: 'Reply time is usually same-day' },
  ],

  /** ids from projects.ts that are actively in progress right now, newest first */
  workingOnIds: ['colcode', 'lumiere'],
}

/** This site itself — shown alongside the in-progress projects, in the same card template. */
export const portfolioProject: Project = {
  id: 'portfolio',
  name: 'This portfolio',
  subtitle: 'Apple-style liquid-glass personal site',
  kind: 'Personal project · Live',
  accent: '#0a84ff',
  monogram: 'YA',
  description:
    'The site you are reading — a React 19 single-page app with liquid-glass surfaces, a 100-command terminal and a contribution heatmap that reads GitHub in real time.',
  highlights: [
    '⌘K opens a zsh-style terminal with 100 commands sourced from the same data that renders the page.',
    'Live GitHub heatmap served by a Vercel function that reads github.com directly, timezone-correct to the day.',
    'Light/dark themes driven by design tokens, Framer Motion transitions, reduced-motion aware.',
  ],
  stack: ['React 19', 'TypeScript', 'Tailwind CSS 4', 'Framer Motion', 'Vite', 'Vercel Functions'],
  links: [{ label: 'Source on GitHub', href: 'https://github.com/yasharyan90/myPortfolio-Web', kind: 'github' }],
  metrics: [
    { label: 'Commands', value: '100' },
    { label: 'Heatmap', value: 'Live' },
    { label: 'Themes', value: '2' },
  ],
}

export const workingOn: Project[] = [
  ...now.workingOnIds.map((id) => projects.find((p) => p.id === id)).filter((p): p is Project => !!p),
  portfolioProject,
]
