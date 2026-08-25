export interface SkillGroup {
  title: string
  description: string
  items: string[]
}

export const skillGroups: SkillGroup[] = [
  {
    title: 'Languages',
    description: 'The tools I think in.',
    items: ['Java', 'C++', 'Python', 'Go', 'JavaScript', 'TypeScript', 'SQL', 'HTML5', 'CSS3'],
  },
  {
    title: 'Backend',
    description: 'APIs, real-time pipes, auth.',
    items: ['Node.js', 'Express.js', 'Go (Fiber)', 'FastAPI', 'REST APIs', 'WebSockets', 'Redis Pub/Sub', 'Bun', 'JWT', 'RBAC'],
  },
  {
    title: 'Frontend',
    description: 'Interfaces that feel native.',
    items: ['React.js', 'Vite', 'Tailwind CSS', 'Framer Motion', 'CSS Modules', 'React Router', 'PWA'],
  },
  {
    title: 'Databases',
    description: 'Relational, document, in-memory.',
    items: ['PostgreSQL', 'Neon (serverless Postgres)', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Amazon DynamoDB'],
  },
  {
    title: 'Cloud & DevOps',
    description: 'From laptop to production.',
    items: ['AWS EC2', 'AWS S3', 'Cloudflare CDN', 'Docker', 'Docker Compose', 'CI/CD', 'Vercel', 'Linux', 'Git', 'GitHub'],
  },
  {
    title: 'Tools & Platforms',
    description: 'Integrations and daily drivers.',
    items: ['Razorpay', 'Firebase Cloud Messaging', 'EmailJS', 'VS Code', 'IntelliJ IDEA', 'macOS', 'Windows'],
  },
]

export const competencies = [
  'Data Structures & Algorithms',
  'Object-Oriented Programming',
  'System Design',
  'Problem Solving',
  'Debugging',
  'Agile Teamwork',
]
