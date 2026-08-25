import type { IconType } from 'react-icons'
import { FaAws, FaJava } from 'react-icons/fa6'
import {
  SiApple,
  SiBun,
  SiCloudflare,
  SiCplusplus,
  SiCss,
  SiCssmodules,
  SiDocker,
  SiExpress,
  SiFastapi,
  SiFirebase,
  SiFramer,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiGo,
  SiHtml5,
  SiIntellijidea,
  SiJavascript,
  SiJsonwebtokens,
  SiLinux,
  SiMongodb,
  SiMysql,
  SiNeon,
  SiNodedotjs,
  SiOpenapiinitiative,
  SiPostgresql,
  SiPwa,
  SiPython,
  SiRazorpay,
  SiReact,
  SiReactrouter,
  SiRedis,
  SiSocketdotio,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiVite,
} from 'react-icons/si'
import { TbBrandVscode, TbBrandWindows, TbMail, TbShieldCheck, TbSql } from 'react-icons/tb'

export interface Skill {
  name: string
  icon: IconType
  /** brand hex; omit for monochrome marks so they inherit the text color (theme-safe) */
  color?: string
}

export interface SkillGroup {
  title: string
  description: string
  items: Skill[]
}

export const skillGroups: SkillGroup[] = [
  {
    title: 'Languages',
    description: 'The tools I think in.',
    items: [
      { name: 'Java', icon: FaJava, color: '#E76F00' },
      { name: 'C++', icon: SiCplusplus, color: '#00599C' },
      { name: 'Python', icon: SiPython, color: '#3776AB' },
      { name: 'Go', icon: SiGo, color: '#00ADD8' },
      { name: 'JavaScript', icon: SiJavascript, color: '#E8C90A' },
      { name: 'TypeScript', icon: SiTypescript, color: '#3178C6' },
      { name: 'SQL', icon: TbSql, color: '#4169E1' },
      { name: 'HTML5', icon: SiHtml5, color: '#E34F26' },
      { name: 'CSS3', icon: SiCss, color: '#663399' },
    ],
  },
  {
    title: 'Backend',
    description: 'APIs, real-time pipes, auth.',
    items: [
      { name: 'Node.js', icon: SiNodedotjs, color: '#5FA04E' },
      { name: 'Express.js', icon: SiExpress },
      { name: 'Go (Fiber)', icon: SiGo, color: '#00ADD8' },
      { name: 'FastAPI', icon: SiFastapi, color: '#009688' },
      { name: 'REST APIs', icon: SiOpenapiinitiative, color: '#6BA539' },
      { name: 'WebSockets', icon: SiSocketdotio },
      { name: 'Redis Pub/Sub', icon: SiRedis, color: '#FF4438' },
      { name: 'Bun', icon: SiBun },
      { name: 'JWT', icon: SiJsonwebtokens },
      { name: 'RBAC', icon: TbShieldCheck, color: '#0A84FF' },
    ],
  },
  {
    title: 'Frontend',
    description: 'Interfaces that feel native.',
    items: [
      { name: 'React.js', icon: SiReact, color: '#61DAFB' },
      { name: 'Vite', icon: SiVite, color: '#646CFF' },
      { name: 'Tailwind CSS', icon: SiTailwindcss, color: '#06B6D4' },
      { name: 'Framer Motion', icon: SiFramer, color: '#0055FF' },
      { name: 'CSS Modules', icon: SiCssmodules },
      { name: 'React Router', icon: SiReactrouter, color: '#CA4245' },
      { name: 'PWA', icon: SiPwa, color: '#5A0FC8' },
    ],
  },
  {
    title: 'Databases',
    description: 'Relational, document, in-memory.',
    items: [
      { name: 'PostgreSQL', icon: SiPostgresql, color: '#4169E1' },
      { name: 'Neon (serverless Postgres)', icon: SiNeon, color: '#00E599' },
      { name: 'MySQL', icon: SiMysql, color: '#4479A1' },
      { name: 'MongoDB', icon: SiMongodb, color: '#47A248' },
      { name: 'Redis', icon: SiRedis, color: '#FF4438' },
      { name: 'Supabase', icon: SiSupabase, color: '#3ECF8E' },
      { name: 'Amazon DynamoDB', icon: FaAws, color: '#FF9900' },
    ],
  },
  {
    title: 'Cloud & DevOps',
    description: 'From laptop to production.',
    items: [
      { name: 'AWS EC2', icon: FaAws, color: '#FF9900' },
      { name: 'AWS S3', icon: FaAws, color: '#FF9900' },
      { name: 'Cloudflare CDN', icon: SiCloudflare, color: '#F38020' },
      { name: 'Docker', icon: SiDocker, color: '#2496ED' },
      { name: 'Docker Compose', icon: SiDocker, color: '#2496ED' },
      { name: 'CI/CD', icon: SiGithubactions, color: '#2088FF' },
      { name: 'Vercel', icon: SiVercel },
      { name: 'Linux', icon: SiLinux, color: '#E9B400' },
      { name: 'Git', icon: SiGit, color: '#F05032' },
      { name: 'GitHub', icon: SiGithub },
    ],
  },
  {
    title: 'Tools & Platforms',
    description: 'Integrations and daily drivers.',
    items: [
      { name: 'Razorpay', icon: SiRazorpay, color: '#3395FF' },
      { name: 'Firebase Cloud Messaging', icon: SiFirebase, color: '#F5A623' },
      { name: 'EmailJS', icon: TbMail, color: '#F5A623' },
      { name: 'VS Code', icon: TbBrandVscode, color: '#007ACC' },
      { name: 'IntelliJ IDEA', icon: SiIntellijidea, color: '#FE315D' },
      { name: 'macOS', icon: SiApple },
      { name: 'Windows', icon: TbBrandWindows, color: '#0078D4' },
    ],
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
