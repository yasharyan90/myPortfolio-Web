export interface Certification {
  title: string
  issuer: string
  platform: string
  badge?: string
  topics: string[]
}

export const certifications: Certification[] = [
  {
    title: 'Applied Machine Learning in Python',
    issuer: 'University of Michigan',
    platform: 'Coursera',
    topics: ['Predictive Modeling', 'Scikit-Learn', 'Data Preprocessing'],
  },
  {
    title: 'Cloud Computing and Distributed Systems',
    issuer: 'IIT Kanpur',
    platform: 'NPTEL',
    badge: 'Elite + Silver · 78%',
    topics: ['Virtualization', 'Scalability', 'Distributed Systems'],
  },
  {
    title: 'Introduction to Internet of Things',
    issuer: 'IIT Kharagpur',
    platform: 'NPTEL',
    badge: 'Elite · 77%',
    topics: ['IoT Architecture', 'Embedded Systems', 'Protocols'],
  },
]

export const achievements = [
  'Solved 500+ DSA problems across LeetCode and GeeksforGeeks',
  "Following Striver's A2Z DSA Sheet end-to-end",
  'S Grade + College Project Exhibition for UHIP',
]
