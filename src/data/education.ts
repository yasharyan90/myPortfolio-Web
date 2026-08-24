export interface Education {
  school: string
  degree: string
  detail?: string
  period: string
  location: string
  score?: string
  coursework?: string[]
}

export const education: Education[] = [
  {
    school: 'Vellore Institute of Technology, Bhopal',
    degree: 'B.Tech in Computer Science',
    detail: 'Specialization in Cloud Computing and Automation',
    period: '2024 — Sept 2028 (expected)',
    location: 'Bhopal, Madhya Pradesh',
    score: 'CGPA 8.5 / 10',
    coursework: [
      'Data Structures & Algorithms',
      'DBMS',
      'Operating Systems',
      'Computer Networks',
      'Object-Oriented Programming',
      'Cloud Computing Tools & Services',
      'AI Agents',
      'Unix Tools & Scripting',
    ],
  },
  {
    school: 'Khelgaon Public School',
    degree: 'CBSE Class XII',
    period: 'Graduated May 2023',
    location: 'Prayagraj, Uttar Pradesh',
  },
]
