export interface ProjectLink {
  label: string
  href: string
  kind: 'github' | 'live'
}

export interface Project {
  id: string
  name: string
  subtitle: string
  kind: string
  accent: string
  monogram: string
  /** screenshot of the live product, shown instead of the generated monogram cover */
  cover?: string
  /** CSS object-position for the cover crop (default: 'top') */
  coverPosition?: string
  description: string
  highlights: string[]
  stack: string[]
  links: ProjectLink[]
  metrics: { label: string; value: string }[]
}

export const projects: Project[] = [
  {
    id: 'colcode',
    name: 'ColCode',
    subtitle: 'Real-Time Collaborative Code Editor',
    kind: 'Personal project · Production Docker deployment',
    accent: '#f04a1c',
    monogram: 'CC',
    cover: '/projects/colcode.jpg',
    coverPosition: 'left top',
    description:
      'A shared code editor — one project, many cursors, instant sync. Yjs CRDTs and WebSockets merge concurrent edits conflict-free, and each run executes in a single-use, locked-down Docker sandbox without leaving the page.',
    highlights: [
      'Real-time collaborative editing on Yjs CRDT + WebSockets — live cursors, selections and user presence with zero lost keystrokes during simultaneous typing.',
      'Secure code-execution sandbox: every run launches a single-use Docker container with network isolation, read-only root filesystem, dropped capabilities and cgroup CPU, memory, PID and wall-clock limits.',
      'Runs Python, JavaScript, TypeScript, Ruby and Go with stdout/stderr streamed back into the shared panel in real time.',
      'GitHub OAuth, JWT sessions and server-side project RBAC (owner / editor / viewer) enforced during WebSocket upgrades; CRDT snapshots persisted to PostgreSQL so project state survives server restarts.',
      'Load-tested the sync server at 3,500 ops/s across 100 rooms and 500 concurrent clients, achieving 100% message delivery.',
      'Shipped 150 automated checks — sync, access control, sandbox limits and Puppeteer browser E2E — plus a production Docker Compose deployment behind Caddy with HTTPS.',
    ],
    stack: ['React', 'TypeScript', 'Monaco Editor', 'Yjs (CRDT)', 'WebSockets', 'xterm.js', 'Node.js', 'Fastify', 'PostgreSQL', 'Redis', 'Docker', 'Caddy', 'Puppeteer'],
    links: [{ label: 'Source on GitHub', href: 'https://github.com/yasharyan90/ColCode', kind: 'github' }],
    metrics: [
      { label: 'Sync load', value: '3.5K ops/s' },
      { label: 'Delivery', value: '100%' },
      { label: 'Checks', value: '150' },
    ],
  },
  {
    id: 'lumiere',
    name: 'Lumière',
    subtitle: 'Members-Only Movie Streaming Platform',
    kind: 'Personal project · Live demo',
    accent: '#e11d48',
    monogram: 'LU',
    cover: '/projects/lumiere.jpg',
    coverPosition: 'left top',
    description:
      'A private screening room on the web — hand-curated movies, shows and anime streamed ad-free in up to 1080p behind a demo membership, on Neon Postgres and Cloudflare for seamless content delivery.',
    highlights: [
      'Demo membership flow — sample monthly (₹100) and quarterly (₹199) plans with per-plan screen limits and cancel-anytime billing; no real charges.',
      'Resume-where-you-stopped playback synced to the second across devices, with concurrent-screen enforcement.',
      'Member and owner entrances: a curated catalogue for members and an owner dashboard for managing the shelf.',
      'Catalogue, memberships and watch progress live in Neon serverless Postgres — branchable, autoscaling and sub-100 ms from the edge.',
      'Video and static assets served through Cloudflare\'s global CDN with edge caching, so playback starts instantly and never buffers on a shared origin.',
      'Built with Next.js (Turbopack) and deployed on Vercel with light/dark themes and a glass-morphism UI.',
    ],
    stack: ['Next.js', 'React', 'TypeScript', 'Neon Postgres', 'Cloudflare CDN', 'Vercel', 'Video Streaming', 'Subscriptions', 'RBAC'],
    links: [{ label: 'Watch it live', href: 'https://lumiere-project-lime.vercel.app/', kind: 'live' }],
    metrics: [
      { label: 'Quality', value: '1080p' },
      { label: 'Delivery', value: 'Edge CDN' },
      { label: 'Ads', value: 'Zero' },
    ],
  },
  {
    id: 'vit-live',
    name: 'VIT Live',
    subtitle: 'Real-Time Campus Engagement Platform',
    kind: 'Personal project',
    accent: '#d8643c',
    monogram: 'VL',
    cover: '/projects/vit-live.jpg',
    coverPosition: 'left top',
    description:
      'A full-stack real-time platform for campus life — live announcements, emergency alerts, polls and club feeds delivered in under a second.',
    highlights: [
      'Architected 5-role RBAC with live announcements, emergency alerts, polls and club feeds over WebSockets + Redis Pub/Sub — sub-second delivery.',
      'Integrated Razorpay with HMAC-SHA256 signature verification, QR-code event ticketing and live attendee check-in.',
      'JWT auth with rotating refresh tokens, OTP verification, anonymous polling, audit logging and CI-tested REST APIs.',
      'Installable React PWA with offline support, FCM push notifications, admin dashboard, scheduled publishing and S3-compatible storage.',
    ],
    stack: ['Go (Fiber)', 'React 19', 'TypeScript', 'PostgreSQL', 'Redis Pub/Sub', 'WebSockets', 'Razorpay', 'Tailwind CSS', 'Framer Motion', 'PWA'],
    links: [{ label: 'Source on GitHub', href: 'https://github.com/yasharyan90/vit-live', kind: 'github' }],
    metrics: [
      { label: 'Delivery', value: '< 1s' },
      { label: 'Roles', value: '5' },
      { label: 'Monorepo', value: '13K+ LOC' },
    ],
  },
  {
    id: 'aurum',
    name: 'Aurum Luxury Boutique',
    subtitle: 'Full Stack E-Commerce Platform',
    kind: 'Personal project · Production',
    accent: '#a67c00',
    monogram: 'AU',
    cover: '/projects/aurum.jpg',
    description:
      'A production-deployed luxury storefront processing real transactions, with dual customer/owner dashboards and live order tracking.',
    highlights: [
      'Dual authentication (customer + owner RBAC) secured with Supabase Row Level Security and JWT.',
      'Razorpay gateway with automated GST calculation and EmailJS order confirmations on real transactions.',
      'Supabase Realtime order tracking — status updates reflect in the customer dashboard within 2 seconds of owner action.',
      'Responsive dark-mode UI with dynamic skeleton loaders, plus customer wallet and coupon services.',
    ],
    stack: ['React.js', 'Supabase', 'PostgreSQL', 'Razorpay', 'EmailJS', 'CSS Modules', 'React Router', 'Vercel'],
    links: [{ label: 'Live store', href: 'https://aurum-luxury-ecom-store-main-store-six.vercel.app', kind: 'live' }],
    metrics: [
      { label: 'Order sync', value: '< 2s' },
      { label: 'Payments', value: 'Live' },
      { label: 'Auth', value: 'RLS + JWT' },
    ],
  },
  {
    id: 'uhip',
    name: 'UHIP',
    subtitle: 'Unified Health Intelligence Platform',
    kind: 'Team project · S Grade',
    accent: '#2a9d8f',
    monogram: 'UH',
    description:
      'A cloud-native, multi-service healthcare platform — I led containerization and Docker-based deployment across five services.',
    highlights: [
      'Led containerization and Docker deployment of React, Express.js, FastAPI, PostgreSQL and MongoDB microservices.',
      'Configured service orchestration, container networking, persistent volumes and environment config via Docker Compose.',
      'Ran system debugging, integration testing and deployment analysis to harden reliability and performance.',
      'Awarded S Grade and presented at the College Project Exhibition.',
    ],
    stack: ['Docker', 'Docker Compose', 'Node.js', 'Express.js', 'React', 'Vite', 'PostgreSQL', 'MongoDB', 'FastAPI'],
    links: [],
    metrics: [
      { label: 'Services', value: '5' },
      { label: 'Grade', value: 'S' },
      { label: 'Role', value: 'DevOps lead' },
    ],
  },
]
