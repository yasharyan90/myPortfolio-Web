export interface Certification {
  title: string
  issuer: string
  platform: string
  badge?: string
  topics: string[]
  /** public verification page for the certificate */
  credentialUrl?: string
}

export const certifications: Certification[] = [
  {
    title: 'Applied Machine Learning in Python',
    issuer: 'University of Michigan',
    platform: 'Coursera',
    badge: '88.96%',
    topics: ['Predictive Modeling', 'Scikit-Learn', 'Data Preprocessing'],
    credentialUrl: 'https://coursera.org/share/06993bcdf7ec51976f18565dc831fde4',
  },
  {
    title: 'Cloud Computing and Distributed Systems',
    issuer: 'IIT Kanpur',
    platform: 'NPTEL',
    badge: 'Elite + Silver · 78%',
    topics: ['Virtualization', 'Scalability', 'Distributed Systems'],
    credentialUrl: 'https://nptel.ac.in/noc/E_Certificate/NOC26CS29S55280041703130440',
  },
  {
    title: 'Introduction to Internet of Things',
    issuer: 'IIT Kharagpur',
    platform: 'NPTEL',
    badge: 'Elite · 77%',
    topics: ['IoT Architecture', 'Embedded Systems', 'Protocols'],
    credentialUrl: 'https://nptel.ac.in/noc/E_Certificate/NPTEL25CS147S95840145010990718',
  },
  {
    title: 'Big Data Computing',
    issuer: 'IIT Kanpur',
    platform: 'NPTEL',
    badge: '70%',
    topics: ['Hadoop & MapReduce', 'Apache Spark', 'NoSQL Stores'],
    credentialUrl: 'https://nptel.ac.in/verify/NOC-6GRT-CV4H-VZ5GZ',
  },
]

export const achievements = [
  'Solved 500+ DSA problems across LeetCode and GeeksforGeeks',
  "Following Striver's A2Z DSA Sheet end-to-end",
  'S Grade + College Project Exhibition for UHIP',
]
