import { achievements, certifications } from '../data/certifications'
import { education } from '../data/education'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { bySocialId, socials } from '../data/socials'
import { competencies, skillGroups } from '../data/skills'
import type { Command, CommandResult, Line, TermContext, TermPalette } from './types'

/* ── helpers ─────────────────────────────────────────────────────────── */

const L = (text: string, tone?: Line['tone'], href?: string): Line => ({ text, tone, href })
const dim = (t: string) => L(t, 'dim')
const green = (t: string) => L(t, 'green')
const cyan = (t: string) => L(t, 'cyan')
const yellow = (t: string) => L(t, 'yellow')
const red = (t: string) => L(t, 'red')
const bold = (t: string) => L(t, 'bold')
const link = (label: string, href: string) => L(label, 'cyan', href)
const blank = () => L('')

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
const pad = (s: string, n: number) => (s.length >= n ? s : s + ' '.repeat(n - s.length))

export const SECTIONS = ['hero', 'about', 'skills', 'projects', 'coding', 'education', 'certifications', 'contact'] as const
export const PALETTES: TermPalette[] = ['default', 'green', 'amber', 'matrix', 'dracula']

const SITE_URL = 'https://my-portfolio-web-murex.vercel.app'
const VERSION = '2.0.0'
const primaryStack = ['Go', 'React', 'TypeScript', 'PostgreSQL', 'Docker']

const skillNames = (title: string) => skillGroups.find((g) => g.title === title)?.items.map((i) => i.name) ?? []
const skillLines = (title: string): Line[] => [cyan(title), L('  ' + skillNames(title).join(' · '))]

function projectLines(p: (typeof projects)[number]): Line[] {
  const out: Line[] = [
    bold(`${p.name} — ${p.subtitle}`),
    dim(p.kind),
    blank(),
    L(p.description),
    blank(),
    ...p.highlights.map((h) => L(`  • ${h}`)),
    blank(),
    cyan('Stack   ' + p.stack.join(' · ')),
    green('Metrics ' + p.metrics.map((m) => `${m.label}: ${m.value}`).join('  |  ')),
  ]
  p.links.forEach((l) => out.push(link(`${pad(l.label, 18)} ${l.href}`, l.href)))
  if (!p.links.length) out.push(dim('(no public link — team project)'))
  return out
}

function findProject(q: string | undefined) {
  if (!q) return undefined
  const s = q.toLowerCase().replace(/[^a-z0-9]/g, '')
  return projects.find((p) => p.id.replace(/[^a-z0-9]/g, '') === s || p.name.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(s))
}

const VIRTUAL_FILES: Record<string, () => Line[]> = {
  'about.txt': () => [L(profile.summary)],
  'skills.txt': () => skillGroups.flatMap((g) => skillLines(g.title)),
  'projects/': () => projects.map((p) => green(`${pad(p.id, 12)} ${p.name} — ${p.subtitle}`)),
  'coding.txt': () => socials.filter((s) => s.id !== 'email' && s.id !== 'linkedin').map((s) => link(`${pad(s.label, 15)} ${s.href}`, s.href)),
  'education.txt': () => education.flatMap((e) => [green(e.school), L(`  ${e.degree} · ${e.period}`)]),
  'certifications.txt': () => certifications.map((c) => L(`• ${c.title} — ${c.issuer} (${c.platform})`)),
  'contact.txt': () => [L(`email  ${profile.email}`), L(`phone  ${profile.phone}`), L(`where  ${profile.location}`)],
  'resume.pdf': () => [yellow("resume.pdf is a binary file — run 'resume' to open it.")],
}
projects.forEach((p) => {
  VIRTUAL_FILES[`projects/${p.id}.md`] = () => projectLines(p)
})

/* ── registry ────────────────────────────────────────────────────────── */

export const COMMANDS: Record<string, Command> = {}

function reg(name: string, group: Command['group'], description: string, usage: string | null, run: Command['run']) {
  COMMANDS[name] = { name, group, description, usage: usage ?? name, run }
}

export const commandNames = () => Object.keys(COMMANDS).sort()

export function runCommand(raw: string, ctx: TermContext): CommandResult {
  const [name, ...args] = raw.trim().split(/\s+/)
  const cmd = COMMANDS[name.toLowerCase()]
  if (!cmd) {
    const near = commandNames().filter((n) => n.startsWith(name.slice(0, 2)) && name.length > 1).slice(0, 4)
    return [
      red(`zsh: command not found: ${name}`),
      near.length ? dim(`did you mean: ${near.join(', ')}?`) : dim("type 'help' to see everything you can run"),
    ]
  }
  return cmd.run(args, ctx)
}

/* ════════════════════════════════════════════════════════════════════════
   ABOUT ME
   ════════════════════════════════════════════════════════════════════════ */

reg('help', 'about', 'list every command, grouped', 'help [group]', (args) => {
  const groups: Array<[Command['group'], string]> = [
    ['about', 'About me'],
    ['navigate', 'Navigate the site'],
    ['shell', 'Shell'],
    ['fun', 'Just for fun'],
  ]
  const want = args[0]?.toLowerCase()
  const out: Line[] = []
  const all = Object.values(COMMANDS)
  out.push(dim(`${all.length} commands available. Tab completes, ↑/↓ recalls history, ⌘L clears.`), blank())
  groups
    .filter(([g]) => !want || g === want)
    .forEach(([g, title]) => {
      const names = all.filter((c) => c.group === g).map((c) => c.name).sort()
      out.push(cyan(`${title} (${names.length})`))
      for (let i = 0; i < names.length; i += 5) out.push(green('  ' + names.slice(i, i + 5).map((n) => pad(n, 15)).join('')))
      out.push(blank())
    })
  out.push(dim("'man <command>' explains any one of them."))
  return out
})

reg('whoami', 'about', 'who is running this shell', null, () => [green(profile.name), dim(`${profile.role} · VIT Bhopal`)])

reg('about', 'about', 'a short summary', null, () => [
  green(`${profile.name} — ${profile.role}`),
  L(profile.tagline),
  blank(),
  dim("'bio' for the long version · 'projects' for the work · 'contact' to reach me"),
])

reg('bio', 'about', 'the long version of about', null, () => [L(profile.summary), blank(), dim(`Seeking: ${profile.seeking}.`)])

reg('skills', 'about', 'every skill, grouped', null, () => skillGroups.flatMap((g) => [...skillLines(g.title), blank()]).slice(0, -1))

reg('techstack', 'about', 'primary stack in one line', null, () => [green(primaryStack.join('  ·  '))])

reg('languages', 'about', 'programming languages', null, () => skillLines('Languages'))
reg('backend', 'about', 'backend skills', null, () => skillLines('Backend'))
reg('frontend', 'about', 'frontend skills', null, () => skillLines('Frontend'))
reg('databases', 'about', 'databases I have shipped with', null, () => skillLines('Databases'))
reg('devops', 'about', 'cloud & devops skills', null, () => skillLines('Cloud & DevOps'))
reg('tools', 'about', 'tools & platforms', null, () => skillLines('Tools & Platforms'))

reg('competencies', 'about', 'core competencies', null, () => competencies.map((c) => green(`• ${c}`)))

reg('projects', 'about', "list projects — then 'project <name>'", null, () => [
  dim('Projects:'),
  blank(),
  ...projects.map((p) => green(`  ${pad(p.id, 12)} ${p.name} — ${p.subtitle}`)),
  blank(),
  dim("'project <id>' for details, or just type the id (lumiere, vit-live, aurum, uhip)"),
])

reg('project', 'about', 'details for one project', 'project <id>', (args) => {
  if (!args[0]) return [yellow('usage: project <id>'), dim('ids: ' + projects.map((p) => p.id).join(', '))]
  const p = findProject(args[0])
  if (!p) return [red(`project not found: ${args[0]}`), dim('ids: ' + projects.map((p) => p.id).join(', '))]
  return projectLines(p)
})

reg('lumiere', 'about', 'Lumière — movie streaming platform', null, () => projectLines(projects[0]))
reg('vit-live', 'about', 'VIT Live — real-time campus platform', null, () => projectLines(projects[1]))
reg('aurum', 'about', 'Aurum — luxury e-commerce store', null, () => projectLines(projects[2]))
reg('uhip', 'about', 'UHIP — health intelligence platform', null, () => projectLines(projects[3]))

reg('experience', 'about', 'hands-on experience', null, () => [
  dim('No 9-to-5 yet — this is what I have actually shipped:'),
  blank(),
  ...projects.map((p) => L(`  ${pad(p.name, 24)} ${p.kind}`)),
  blank(),
  green(`Currently seeking: ${profile.seeking}.`),
])

reg('education', 'about', 'education history', null, () =>
  education.flatMap((e) => [
    green(e.school),
    L(`  ${e.degree}${e.detail ? ' · ' + e.detail : ''}`),
    dim(`  ${e.period} · ${e.location}${e.score ? ' · ' + e.score : ''}`),
    blank(),
  ]),
)

reg('coursework', 'about', 'relevant coursework at VIT', null, () => (education[0].coursework ?? []).map((c) => L(`• ${c}`)))

reg('achievements', 'about', 'notable achievements', null, () => achievements.map((a) => green(`• ${a}`)))

reg('certifications', 'about', 'certifications earned', null, () =>
  certifications.flatMap((c) => [green(c.title), dim(`  ${c.issuer} · ${c.platform}${c.badge ? ' · ' + c.badge : ''}`), L(`  ${c.topics.join(' · ')}`)]),
)

reg('stats', 'about', 'the numbers', null, () =>
  profile.stats.map((s) => L(`${pad(String(s.value) + s.suffix, 10)} ${s.label}`, 'green')),
)

reg('facts', 'about', 'quick facts', null, () => profile.facts.map((f) => L(`${pad(f.label, 10)} ${f.value}`)))

reg('resume', 'about', 'open my résumé (PDF)', null, (_a, ctx) => {
  ctx.openUrl(profile.resume)
  return [cyan(`opening résumé → ${profile.resume}`)]
})
reg('cv', 'about', 'alias of resume', null, (a, ctx) => COMMANDS.resume.run(a, ctx))

reg('contact', 'about', 'how to reach me', null, () => [
  link(`email     ${profile.email}`, `mailto:${profile.email}`),
  link(`college   ${profile.collegeEmail}`, `mailto:${profile.collegeEmail}`),
  link(`phone     ${profile.phone}`, `tel:${profile.phone.replace(/\s+/g, '')}`),
  link(`linkedin  ${bySocialId('linkedin').href}`, bySocialId('linkedin').href),
  blank(),
  dim("'copy' puts my email on your clipboard · 'email' opens a draft"),
])

reg('email', 'about', 'open a mail draft to me', null, (_a, ctx) => {
  ctx.openUrl(`mailto:${profile.email}`)
  return [link(`mailto:${profile.email}`, `mailto:${profile.email}`)]
})

reg('socials', 'about', 'all my profiles', null, () => socials.map((s) => link(`${pad(s.label, 15)} ${s.handle}`, s.href)))

const openSocial = (id: string) => (_a: string[], ctx: TermContext) => {
  const s = bySocialId(id)
  ctx.openUrl(s.href)
  return [link(`opening ${s.label} → ${s.href}`, s.href), dim(s.blurb)]
}
reg('github', 'about', 'open my GitHub', null, openSocial('github'))
reg('linkedin', 'about', 'open my LinkedIn', null, openSocial('linkedin'))
reg('leetcode', 'about', 'open my LeetCode', null, openSocial('leetcode'))
reg('gfg', 'about', 'open my GeeksforGeeks', null, openSocial('gfg'))
reg('codeforces', 'about', 'open my Codeforces', null, openSocial('codeforces'))

reg('dsa', 'about', 'DSA progress', null, () => [
  green('500+ problems solved across LeetCode and GeeksforGeeks'),
  L("Working through Striver's A2Z DSA sheet end-to-end — arrays to graphs to DP."),
  ...socials.filter((s) => ['leetcode', 'gfg', 'codeforces'].includes(s.id)).map((s) => link(`  ${pad(s.label, 15)} ${s.handle}`, s.href)),
])

reg('status', 'about', 'current availability', null, () => [green(`● ${profile.availability}`), dim('Reply time is usually same-day.')])

reg('now', 'about', "what I'm doing right now", null, () => [
  L("Building real-time systems, grinding Striver's A2Z sheet, deepening TypeScript."),
  dim(`Studying: B.Tech CS (Cloud Computing & Automation) · VIT Bhopal · Class of 2028`),
])

reg('location', 'about', 'where I am based', null, () => [green(profile.location), dim('Campus: VIT Bhopal, Madhya Pradesh')])

reg('hire', 'about', 'why you should hire me', null, () => [
  bold('Hire me if you want someone who:'),
  L('  • ships production apps that process real payments (Aurum) and stream real video (Lumière)'),
  L('  • understands real-time systems — WebSockets + Redis Pub/Sub at sub-second delivery (VIT Live)'),
  L('  • can own the infra — Docker Compose across five services (UHIP, S Grade)'),
  L('  • has the fundamentals — 500+ DSA problems, CGPA 8.5'),
  blank(),
  link(`→ ${profile.email}`, `mailto:${profile.email}`),
])

/* ════════════════════════════════════════════════════════════════════════
   NAVIGATE
   ════════════════════════════════════════════════════════════════════════ */

reg('ls', 'navigate', 'list portfolio sections as files', 'ls [projects]', (args) => {
  if (args[0]?.replace('/', '') === 'projects') return projects.map((p) => green(`${p.id}.md`))
  return [green(Object.keys(VIRTUAL_FILES).filter((f) => !f.startsWith('projects/') || f === 'projects/').join('   '))]
})

reg('cd', 'navigate', 'scroll to a section and close the terminal', 'cd <section>', (args, ctx) => {
  const target = (args[0] ?? '').replace(/^#/, '').replace(/\/$/, '').toLowerCase()
  if (!target || target === '~' || target === '/') return [dim("you're already home. sections: " + SECTIONS.join(', '))]
  if (!ctx.scrollTo(target)) return [red(`cd: no such section: ${target}`), dim('sections: ' + SECTIONS.join(', '))]
  return [cyan(`→ #${target}`)]
})

reg('open', 'navigate', 'open a section, profile or url', 'open <section|profile|url>', (args, ctx) => {
  const t = (args[0] ?? '').toLowerCase()
  if (!t) return [yellow('usage: open <section|profile|url>')]
  if (/^https?:\/\//.test(t)) {
    ctx.openUrl(t)
    return [link(`opening ${t}`, t)]
  }
  if (t === 'resume' || t === 'cv') return COMMANDS.resume.run([], ctx)
  const s = socials.find((s) => s.id === t || s.label.toLowerCase() === t)
  if (s) return openSocial(s.id)([], ctx)
  const p = findProject(t)
  if (p && p.links[0]) {
    ctx.openUrl(p.links[0].href)
    return [link(`opening ${p.name} → ${p.links[0].href}`, p.links[0].href)]
  }
  if (ctx.scrollTo(t)) return [cyan(`→ #${t}`)]
  return [red(`open: nothing called '${t}'`)]
})

reg('pwd', 'navigate', 'print working directory', null, () => [green('/home/yash/portfolio')])

reg('cat', 'navigate', 'print a virtual file', 'cat <file>', (args) => {
  if (!args[0]) return [yellow('usage: cat <file>'), dim("try 'ls' first")]
  const f = VIRTUAL_FILES[args[0]] ?? VIRTUAL_FILES[args[0] + '.txt'] ?? VIRTUAL_FILES[`projects/${args[0].replace(/\.md$/, '')}.md`]
  if (!f) return [red(`cat: ${args[0]}: No such file or directory`)]
  return f()
})

reg('tree', 'navigate', 'directory tree of the portfolio', null, () => [
  green('.'),
  L('├── about.txt'),
  L('├── skills.txt'),
  L('├── projects/'),
  ...projects.map((p, i) => L(`│   ${i === projects.length - 1 ? '└──' : '├──'} ${p.id}.md`)),
  L('├── coding.txt'),
  L('├── education.txt'),
  L('├── certifications.txt'),
  L('├── contact.txt'),
  L('└── resume.pdf'),
  blank(),
  dim(`1 directory, ${7 + projects.length} files`),
])

reg('top', 'navigate', 'scroll back to the top', null, (_a, ctx) => {
  ctx.scrollTo('hero')
  return [cyan('→ top')]
})

reg('sections', 'navigate', 'list every section you can cd into', null, () => [green(SECTIONS.join('  ')), dim("'cd <section>' to jump there")])

reg('share', 'navigate', 'copy the link to this site', null, async (_a, ctx) => {
  const ok = await ctx.copy(SITE_URL)
  return [ok ? green(`copied ${SITE_URL}`) : link(SITE_URL, SITE_URL)]
})

reg('copy', 'navigate', 'copy my email to your clipboard', null, async (_a, ctx) => {
  const ok = await ctx.copy(profile.email)
  return [ok ? green(`copied ${profile.email}`) : yellow(`clipboard blocked — email is ${profile.email}`)]
})

/* ════════════════════════════════════════════════════════════════════════
   SHELL
   ════════════════════════════════════════════════════════════════════════ */

reg('clear', 'shell', 'clear the screen', null, (_a, ctx) => {
  ctx.clear()
  return null
})
reg('cls', 'shell', 'alias of clear', null, (_a, ctx) => {
  ctx.clear()
  return null
})

reg('history', 'shell', 'show command history', null, (_a, ctx) =>
  ctx.history.length ? ctx.history.map((h, i) => L(`  ${String(i + 1).padStart(3)}  ${h}`)) : [dim('no history yet')],
)

reg('echo', 'shell', 'print text back', 'echo <text>', (args) => [L(args.join(' '))])

reg('date', 'shell', "today's date", null, () => [green(new Date().toString())])

reg('uptime', 'shell', 'how long this session has been open', null, (_a, ctx) => {
  const s = Math.floor((Date.now() - ctx.bootedAt) / 1000)
  return [green(`up ${Math.floor(s / 60)}m ${s % 60}s, 1 user, ${ctx.sessionCount} command${ctx.sessionCount === 1 ? '' : 's'} run`)]
})

reg('man', 'shell', 'manual page for a command', 'man <command>', (args) => {
  const c = COMMANDS[args[0] ?? '']
  if (!c) return [red(`No manual entry for ${args[0] ?? ''}`)]
  return [bold('NAME'), L(`  ${c.name} — ${c.description}`), bold('SYNOPSIS'), green(`  ${c.usage}`), bold('GROUP'), dim(`  ${c.group}`)]
})

reg('alias', 'shell', 'show shortcuts', null, () => [dim('cls → clear   cv → resume   close → exit   ⌘K → open/close   ⌘L → clear   esc → close')])

reg('theme', 'shell', 'switch terminal palette', 'theme <name>', (args, ctx) => {
  const t = args[0] as TermPalette | undefined
  if (!t) return [dim(`palettes: ${PALETTES.join(', ')}`), dim(`current: ${ctx.palette}`)]
  if (!PALETTES.includes(t)) return [red(`unknown palette: ${t}`), dim(`palettes: ${PALETTES.join(', ')}`)]
  ctx.setPalette(t)
  return [green(`palette → ${t}`)]
})

reg('dark', 'shell', 'switch the site to dark mode', null, (_a, ctx) => {
  ctx.setTheme('dark')
  return [green('site → dark mode')]
})
reg('light', 'shell', 'switch the site to light mode', null, (_a, ctx) => {
  ctx.setTheme('light')
  return [green('site → light mode')]
})

reg('exit', 'shell', 'close the terminal', null, (_a, ctx) => {
  ctx.close()
  return null
})
reg('close', 'shell', 'alias of exit', null, (_a, ctx) => {
  ctx.close()
  return null
})

reg('reset', 'shell', 'reboot the terminal', null, (_a, ctx) => {
  ctx.reset()
  return null
})

reg('fullscreen', 'shell', 'toggle the window size', null, (_a, ctx) => {
  ctx.setFullscreen(!ctx.isFullscreen)
  return [green(ctx.isFullscreen ? 'window → normal' : 'window → fullscreen')]
})

reg('version', 'shell', 'terminal version', null, () => [green(`portfolio-os ${VERSION} · zsh emulation · ${Object.keys(COMMANDS).length} commands`)])

export const neofetch = (ctx: Pick<TermContext, 'isDark' | 'bootedAt' | 'palette'>, compact = false): Line[] => {
  const art = [
    '██╗   ██╗ █████╗ ',
    '╚██╗ ██╔╝██╔══██╗',
    ' ╚████╔╝ ███████║',
    '  ╚██╔╝  ██╔══██║',
    '   ██║   ██║  ██║',
    '   ╚═╝   ╚═╝  ╚═╝',
  ]
  const info = [
    `${profile.name.toLowerCase().replace(' ', '')}@portfolio`,
    '------------------',
    `OS       portfolio-os ${VERSION}`,
    `Role     ${profile.role}`,
    `Host     VIT Bhopal · Class of 2028`,
    `Stack    ${primaryStack.join(', ')}`,
    `DSA      500+ problems`,
    `Theme    ${ctx.isDark ? 'dark' : 'light'} · ${ctx.palette}`,
  ]
  if (compact) return info.map((b, i) => ({ text: b, tone: i === 0 ? 'green' : i === 1 ? 'dim' : 'default' }))
  const rows = Math.max(art.length, info.length)
  const out: Line[] = []
  for (let i = 0; i < rows; i++) {
    const a = art[i] ?? ' '.repeat(17)
    const b = info[i] ?? ''
    out.push({ text: `${a}   ${b}`, tone: i === 0 ? 'green' : i === 1 ? 'dim' : 'default' })
  }
  return out
}

reg('neofetch', 'shell', 'system summary card', null, (_a, ctx) => neofetch(ctx, window.innerWidth < 640))
reg('banner', 'shell', 'alias of neofetch', null, (_a, ctx) => neofetch(ctx, window.innerWidth < 640))

reg('sudo', 'shell', 'run as root', 'sudo <cmd>', (args) => [
  yellow(args.length ? `[sudo] password for guest: ` : 'usage: sudo <command>'),
  red('Sorry, try again. Nothing here needs root — everything is already open source.'),
])

reg('env', 'shell', 'environment variables', null, (_a, ctx) => [
  L(`USER=yash`),
  L(`HOME=/home/yash`),
  L(`SHELL=/bin/zsh`),
  L(`ROLE=${profile.role.replace(/\s+/g, '_')}`),
  L(`THEME=${ctx.isDark ? 'dark' : 'light'}`),
  L(`PALETTE=${ctx.palette}`),
  L(`SITE=${SITE_URL}`),
  L(`OPEN_TO_WORK=true`),
])

reg('ping', 'shell', 'ping a host', 'ping <host>', (args) => {
  const host = args[0] ?? 'yash'
  const ms = () => (8 + Math.random() * 14).toFixed(1)
  return [
    L(`PING ${host}: 56 data bytes`),
    ...[0, 1, 2].map((i) => L(`64 bytes from ${host}: icmp_seq=${i} ttl=56 time=${ms()} ms`)),
    green(`--- ${host} ping statistics --- 3 packets transmitted, 3 received, 0.0% packet loss`),
    dim('still here. still shipping.'),
  ]
})

reg('curl', 'shell', 'fetch a resource', 'curl <url>', (args) => {
  const u = args[0] ?? ''
  if (!u) return [yellow('usage: curl <url>')]
  if (u.includes('vercel.app') || u === SITE_URL || u === '/') {
    return [
      dim('HTTP/2 200'),
      dim('content-type: text/html; charset=utf-8'),
      dim('server: Vercel · x-vercel-cache: HIT'),
      blank(),
      L(`{ "name": "${profile.name}", "role": "${profile.role}", "status": "${profile.availability}" }`),
    ]
  }
  return [red(`curl: (6) Could not resolve host: ${u}`), dim('(this shell only reaches the portfolio)')]
})

reg('git', 'shell', 'git, sort of', 'git <log|status|remote>', (args) => {
  const sub = args[0] ?? 'status'
  if (sub === 'log')
    return [
      yellow('commit 2f3a1c9 (HEAD -> main, origin/main)'),
      L('  feat(terminal): 100-command liquid-glass terminal'),
      yellow('commit d9416e3'),
      L('  fix(contact): proper spacing in phone/email pill'),
      yellow('commit 94a654e'),
      L('  feat(skills): brand logos on every skill chip'),
    ]
  if (sub === 'remote') return [link(`origin  ${bySocialId('github').href}/myPortfolio-web (fetch)`, bySocialId('github').href)]
  return [L('On branch main'), L("Your branch is up to date with 'origin/main'."), blank(), green('nothing to commit, working tree clean')]
})

reg('npm', 'shell', 'package manager', 'npm <run|install|ls>', (args) => {
  const sub = args[0] ?? ''
  if (sub === 'ls') return ['react@19', 'framer-motion@13', 'tailwindcss@4', 'lucide-react@1', 'vite@8'].map((d) => L(`├── ${d}`))
  if (sub === 'run') return [cyan('> vite'), green('  ➜  Local:   http://localhost:5180/'), dim('  ready in 212 ms')]
  if (sub === 'install' || sub === 'i') return [green('added 0 packages, audited 212 packages in 1s'), dim('found 0 vulnerabilities — this portfolio ships lean')]
  return [dim('usage: npm <run|install|ls>')]
})

reg('docker', 'shell', 'container status', 'docker ps', () => [
  dim('CONTAINER ID   IMAGE                 STATUS         PORTS'),
  L('a1b2c3d4e5f6   vit-live/api:go       Up 41 days     :8080'),
  L('f6e5d4c3b2a1   postgres:16           Up 41 days     :5432'),
  L('0f9e8d7c6b5a   redis:7-alpine        Up 41 days     :6379'),
  L('9a8b7c6d5e4f   uhip/fastapi          Up 12 days     :8000'),
  L('4f3e2d1c0b9a   uhip/mongo            Up 12 days     :27017'),
])

reg('go', 'shell', 'go toolchain', 'go <version|run|test>', (args) => {
  const sub = args[0] ?? 'version'
  if (sub === 'run') return [green('⇨ http server started on :8080'), dim('fiber v2 · websocket hub online · redis pub/sub subscribed')]
  if (sub === 'test') return [green('ok    vit-live/internal/auth   0.412s'), green('ok    vit-live/internal/ws     1.208s'), green('ok    vit-live/internal/pay    0.097s')]
  return [green('go version go1.22 darwin/arm64')]
})

reg('psql', 'shell', 'talk to postgres', 'psql', () => [
  L('psql (16.2)'),
  L('Type "help" for help.'),
  blank(),
  cyan('portfolio=# select name, kind from projects;'),
  dim('     name      |        kind'),
  dim('---------------+----------------------'),
  ...projects.map((p) => L(` ${pad(p.name, 13)} | ${p.kind}`)),
  dim(`(${projects.length} rows)`),
])

reg('redis', 'shell', 'redis-cli', 'redis <cmd>', (args) => {
  const c = (args[0] ?? 'ping').toUpperCase()
  if (c === 'PING') return [green('PONG')]
  if (c === 'PUBLISH') return [green('(integer) 1'), dim('channel: announcements · sub-second delivery, as always')]
  if (c === 'KEYS') return ['session:yash', 'poll:live', 'alert:emergency', 'feed:clubs'].map((k) => L(`"${k}"`))
  return [dim('(supported: ping, publish, keys)')]
})

reg('ssh', 'shell', 'connect to a server', 'ssh <host>', (args) => [
  L(`ssh: connect to host ${args[0] ?? 'prod'} port 22: Permission denied (publickey).`),
  dim("nice try — but you can 'email' me and I'll give you a tour."),
])

reg('vim', 'shell', 'open vim', 'vim [file]', () => [
  L('~'),
  L('~   VIM - Vi IMproved'),
  L('~'),
  L("~   type  :q<Enter>   to exit (you'll be back, they always are)"),
  L('~'),
  dim(':q'),
])

/* ════════════════════════════════════════════════════════════════════════
   FUN
   ════════════════════════════════════════════════════════════════════════ */

reg('joke', 'fun', 'a programmer joke', null, () => [
  yellow(
    pick([
      'Why do programmers prefer dark mode? Because light attracts bugs.',
      "There are 10 kinds of people: those who understand binary, and those who don't.",
      "I'd tell you a UDP joke, but you might not get it.",
      'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?"',
      'It works on my machine. — every developer, right before Docker was invented.',
      "Why did the Go developer go broke? Too many goroutines, not enough channels.",
    ]),
  ),
])

reg('coffee', 'fun', 'brew some ascii coffee', null, () => [
  dim('      ) )'),
  dim('     ( ('),
  dim('   .......'),
  green('   |     |]  fuel loaded. shipping resumes.'),
  dim('   \\_____/'),
])

reg('quote', 'fun', 'a random quote', null, () => [
  cyan(
    pick([
      '"Simplicity is the soul of efficiency." — Austin Freeman',
      '"Premature optimization is the root of all evil." — Donald Knuth',
      '"Talk is cheap. Show me the code." — Linus Torvalds',
      '"Programs must be written for people to read, and only incidentally for machines to execute." — Harold Abelson',
      '"Make it work, make it right, make it fast." — Kent Beck',
    ]),
  ),
])

reg('cowsay', 'fun', 'a cow says your text', 'cowsay <text>', (args) => {
  const msg = args.join(' ') || 'moo'
  const bar = '-'.repeat(msg.length + 2)
  return [
    dim(' ' + bar.replace(/-/g, '_')),
    L(`< ${msg} >`),
    dim(' ' + bar),
    dim('        \\   ^__^'),
    dim('         \\  (oo)\\_______'),
    dim('            (__)\\       )\\/\\'),
    dim('                ||----w |'),
    dim('                ||     ||'),
  ]
})

reg('matrix', 'fun', 'toggle matrix rain', null, (_a, ctx) => {
  const on = !ctx.matrix
  ctx.setMatrix(on)
  if (on) ctx.setPalette('matrix')
  else ctx.setPalette('default')
  return [green(on ? 'Wake up, Neo... (run matrix again to stop)' : 'rain stopped.')]
})

reg('sl', 'fun', 'the classic typo', null, () => [
  dim('      ====        ________                ___________'),
  dim('  _D _|  |_______/        \\__I_I_____===__|_________|'),
  dim('   |(_)---  |   H\\________/ |   |        =|___ ___|'),
  dim('   /     |  |   H  |  |     |   |         ||_| |_||'),
  dim('  |      |  |   H  |__--------------------| [___] |'),
  dim('  | ________|___H__/__|_____/[][]~\\_______|       |'),
  dim('  |/ |   |-----------I_____I [][] []  D   |=======|__'),
  dim('__/ =| o |=-~~\\  /~~\\  /~~\\  /~~\\ ____Y___________|__'),
  dim(" |/-=|___|=    ||    ||    ||    |_____/~\\___/"),
  dim("  \\_/      \\O=====O=====O=====O_/      \\_/"),
  yellow('...you meant "ls".'),
])

reg('hack', 'fun', 'a very real hacking sequence', null, () => [
  green('Initiating totally real hack sequence...'),
  green('Bypassing mainframe firewall ........ 42%'),
  green('Decrypting Redis Pub/Sub channels ... 87%'),
  green('Injecting goroutines ................ 100%'),
  dim('Just kidding. The only thing compromised here is your free time. 🙂'),
])

reg('flip', 'fun', 'flip text upside down', 'flip <text>', (args) => {
  const map: Record<string, string> = { a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z', '.': '˙', '?': '¿', '!': '¡' }
  const txt = args.join(' ') || 'flip me'
  return [green(txt.toLowerCase().split('').reverse().map((c) => map[c] ?? c).join(''))]
})

reg('42', 'fun', 'the answer', null, () => [cyan('The answer to life, the universe, and everything.')])

reg('weather', 'fun', "today's forecast", null, () => [yellow(`${profile.location.split(',')[0]}: 100% chance of shipping code today.`)])

reg('fortune', 'fun', 'a fortune cookie', null, () => [
  cyan(
    pick([
      'A clean commit history awaits those who rebase wisely.',
      'You will soon encounter an off-by-one error. Or two.',
      'The bug you seek is in the file you have not opened.',
      'Today is a good day to add an index.',
      'Your next deploy will be green.',
    ]),
  ),
])

reg('coinflip', 'fun', 'flip a coin', null, () => [green(Math.random() < 0.5 ? '🪙 Heads' : '🪙 Tails')])

reg('diceroll', 'fun', 'roll a die', 'diceroll [sides]', (args) => {
  const sides = Math.max(2, parseInt(args[0] ?? '6') || 6)
  return [green(`🎲 ${1 + Math.floor(Math.random() * sides)}  (d${sides})`)]
})

reg('konami', 'fun', 'the cheat code', null, () => [yellow('↑ ↑ ↓ ↓ ← → ← → B A — 30 extra lives granted. Use them on side projects.')])

reg('credits', 'fun', 'how this terminal was built', null, () => [
  L('Designed as a mac-style liquid-glass terminal for this portfolio.'),
  dim('React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · SF Mono'),
  dim(`Every answer comes from the same data that renders the page — ${Object.keys(COMMANDS).length} commands, zero placeholders.`),
])

reg('hello', 'fun', 'say hi', null, () => [green(`Hi! I'm ${profile.firstName}. 👋`), dim("'about' to learn more, 'help' to see everything.")])

reg('calc', 'fun', 'evaluate arithmetic', 'calc <expr>', (args) => {
  const expr = args.join(' ')
  if (!expr) return [yellow('usage: calc 2 * (3 + 4)')]
  if (!/^[\d\s+\-*/%().^]+$/.test(expr)) return [red('calc: only digits and + - * / % ^ ( ) are allowed')]
  try {
    const v = Function(`"use strict"; return (${expr.replace(/\^/g, '**')})`)() as number
    return Number.isFinite(v) ? [green(`${expr} = ${v}`)] : [red('calc: not a finite number')]
  } catch {
    return [red('calc: could not evaluate expression')]
  }
})

reg('uuid', 'fun', 'generate a uuid', null, () => [green(crypto.randomUUID())])

reg('rickroll', 'fun', 'never gonna give you up', null, (_a, ctx) => {
  ctx.openUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  return [yellow("You know the rules, and so do I. 🎶")]
})

/* ── sanity: registry size ───────────────────────────────────────────── */
export const COMMAND_COUNT = Object.keys(COMMANDS).length
export const fileNames = () => Object.keys(VIRTUAL_FILES)
export const projectIds = () => projects.map((p) => p.id)
