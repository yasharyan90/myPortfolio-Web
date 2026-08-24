import type { IconType } from 'react-icons'
import { SiCodeforces, SiGeeksforgeeks, SiGithub, SiLeetcode } from 'react-icons/si'
import { FaEnvelope, FaLinkedinIn } from 'react-icons/fa6'

export interface Social {
  id: string
  label: string
  handle: string
  href: string
  /** brand color used for glow + icon */
  color: string
  /** override when the brand color is too dark for dark tiles */
  colorOnDark?: string
  icon: IconType
  blurb: string
  cta: string
}

export const socials: Social[] = [
  {
    id: 'github',
    label: 'GitHub',
    handle: '@yasharyan90',
    href: 'https://github.com/yasharyan90',
    color: '#181717',
    colorOnDark: '#ffffff',
    icon: SiGithub,
    blurb: 'Open-source work, monorepos and everything I ship.',
    cta: 'View repositories',
  },
  {
    id: 'leetcode',
    label: 'LeetCode',
    handle: 'Yash_Aryan90',
    href: 'https://leetcode.com/u/Yash_Aryan90/',
    color: '#FFA116',
    icon: SiLeetcode,
    blurb: 'Daily DSA practice — arrays to graphs to DP.',
    cta: 'See my profile',
  },
  {
    id: 'gfg',
    label: 'GeeksforGeeks',
    handle: 'yasharyanno80',
    href: 'https://www.geeksforgeeks.org/profile/yasharyanno80',
    color: '#2F8D46',
    icon: SiGeeksforgeeks,
    blurb: "Working through Striver's A2Z DSA sheet.",
    cta: 'See my profile',
  },
  {
    id: 'codeforces',
    label: 'Codeforces',
    handle: 'yasharyan90',
    href: 'https://codeforces.com/profile/yasharyan90',
    color: '#1F8ACB',
    icon: SiCodeforces,
    blurb: 'Competitive programming under the clock.',
    cta: 'See my rating',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    handle: 'in/yasharyan90',
    href: 'https://www.linkedin.com/in/yasharyan90/',
    color: '#0A66C2',
    icon: FaLinkedinIn,
    blurb: 'Professional profile and updates.',
    cta: 'Connect',
  },
  {
    id: 'email',
    label: 'Email',
    handle: 'yasharyanchunar90@gmail.com',
    href: 'mailto:yasharyanchunar90@gmail.com',
    color: '#0066cc',
    icon: FaEnvelope,
    blurb: 'The fastest way to reach me.',
    cta: 'Say hello',
  },
]

const codingIds = ['github', 'leetcode', 'gfg', 'codeforces']
export const codingProfiles = socials.filter((s) => codingIds.includes(s.id))
export const contactProfiles = socials.filter((s) => !codingIds.includes(s.id))
export const bySocialId = (id: string) => socials.find((s) => s.id === id)!
