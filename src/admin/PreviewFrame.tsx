import { useEffect, useRef, useState } from 'react'
import { PREVIEW_MESSAGE, PREVIEW_READY } from '../content/ContentProvider'
import type { ContentDoc, Section } from '../content/types'

/** Which page / anchor shows a section best. */
const TARGET: Record<Section, string> = {
  profile: '/?preview=1#about',
  skills: '/?preview=1#skills',
  projects: '/?preview=1#projects',
  education: '/?preview=1#education',
  certifications: '/?preview=1#certifications',
  socials: '/?preview=1#coding',
  now: '/now?preview=1',
  gallery: '/gallery?preview=1',
}

/** Intrinsic width the site is laid out at inside the frame; the frame is then scaled to the pane. */
const FRAME_WIDTH = 1024

/**
 * The real site in an iframe with its own viewport, scaled to fit. The draft document is posted
 * into it on every change, so what you see is exactly what visitors would see after Publish —
 * including responsive layouts and layout animations, which a shrunken in-page render gets wrong.
 */
export function PreviewFrame({ section, doc }: { section: Section; doc: ContentDoc }) {
  const wrap = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const [scale, setScale] = useState(0.5)
  const [height, setHeight] = useState(700)
  const [ready, setReady] = useState(false)
  const latest = useRef(doc)
  latest.current = doc

  // fit the 1180 px frame to the pane
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const s = Math.min(1, w / FRAME_WIDTH)
      setScale(s)
      setHeight(Math.max(480, window.innerHeight - 160))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const post = () => frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, doc: latest.current }, window.location.origin)

  // the frame announces itself when its app has mounted; after that, every draft change is pushed
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      if ((e.data as { type?: string })?.type === PREVIEW_READY) {
        setReady(true)
        post()
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(post, 120)
    return () => window.clearTimeout(t)
  }, [doc, ready])
  // navigating to another section reloads the frame at that anchor
  useEffect(() => setReady(false), [section])

  return (
    <div ref={wrap} className="relative w-full overflow-hidden rounded-[18px] border border-black/[0.06] bg-canvas dark:border-white/10" style={{ height: height * scale }}>
      <iframe
        ref={frame}
        key={section}
        title="Live preview of the draft"
        src={TARGET[section]}
        name="owner-preview"
        style={{ width: FRAME_WIDTH, height, transform: `scale(${scale})`, transformOrigin: 'top left', border: 0 }}
        className="absolute left-0 top-0 bg-canvas"
      />
      {!ready && <div className="pointer-events-none absolute inset-0 grid place-items-center text-[13px] text-ink-48">Loading preview…</div>}
    </div>
  )
}
