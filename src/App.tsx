import { Background } from './components/layout/Background'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { ScrollProgress } from './components/layout/ScrollProgress'
import { About } from './components/sections/About'
import { Certifications } from './components/sections/Certifications'
import { Coding } from './components/sections/Coding'
import { Contact } from './components/sections/Contact'
import { Education } from './components/sections/Education'
import { Hero } from './components/sections/Hero'
import { Projects } from './components/sections/Projects'
import { Skills } from './components/sections/Skills'
import { Terminal } from './components/terminal/Terminal'

/**
 * Section rhythm follows the Apple "pulse": light hero → light → dark tile → light → dark → light → dark → parchment footer.
 * Light sections sit on the fixed drifting-orb backdrop; dark tiles carry their own scoped orbs.
 */
export default function App() {
  return (
    <>
      <ScrollProgress />
      <Background tone="light" mode="fixed" />
      <Navbar />
      <main>
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Coding />
        <Education />
        <Certifications />
        <Contact />
      </main>
      <Footer />
      <Terminal />
    </>
  )
}
