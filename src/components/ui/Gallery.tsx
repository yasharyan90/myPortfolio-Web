import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Images, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useContent } from '../../content/ContentProvider'
import type { GalleryImage } from '../../content/types'
import { cn } from '../../lib/cn'
import { appleEase, spring } from '../../lib/motion'

export const OPEN_GALLERY_EVENT = 'portfolio:open-gallery'

/** Open the full-screen gallery from anywhere (hero icon, terminal, footer). */
export function openGallery(index?: number) {
  window.dispatchEvent(new CustomEvent(OPEN_GALLERY_EVENT, { detail: index ?? null }))
}

/* ── the thumbnail grid (masonry via CSS columns) ───────────────────────── */

export function GalleryGrid({ items, onOpen, className }: { items: GalleryImage[]; onOpen: (i: number) => void; className?: string }) {
  if (items.length === 0) {
    return (
      <div className={cn('rounded-[18px] border border-dashed border-black/15 p-10 text-center text-[14px] text-ink-48 dark:border-white/15', className)}>
        <Images className="mx-auto mb-2 h-6 w-6" /> No photos yet.
      </div>
    )
  }
  return (
    <div className={cn('columns-2 gap-3 sm:columns-3 lg:columns-4 [column-fill:balance]', className)}>
      {items.map((img, i) => (
        <motion.button
          key={img.id}
          type="button"
          onClick={() => onOpen(i)}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
          className="group mb-3 block w-full break-inside-avoid overflow-hidden rounded-[14px] bg-black/[0.04] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus dark:bg-white/[0.06]"
          aria-label={img.alt || img.caption || `Photo ${i + 1}`}
        >
          <img
            src={img.thumb}
            alt={img.alt || img.caption || ''}
            width={img.width}
            height={img.height}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
            style={{ aspectRatio: `${img.width} / ${img.height}` }}
          />
          {img.caption && <span className="block px-3 py-2 text-[12.5px] leading-snug text-ink-80">{img.caption}</span>}
        </motion.button>
      ))}
    </div>
  )
}

/* ── full-resolution viewer ─────────────────────────────────────────────── */

function Viewer({ items, index, onClose, onIndex }: { items: GalleryImage[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const reduce = useReducedMotion()
  const img = items[index]
  const prev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex])
  const next = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  // warm the neighbours so arrows feel instant
  useEffect(() => {
    for (const j of [index - 1, index + 1]) {
      const n = items[(j + items.length) % items.length]
      if (n) new Image().src = n.src
    }
  }, [index, items])

  return (
    <motion.div
      key="viewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
      className="fixed inset-0 z-[130] flex flex-col bg-black/95 text-white"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={img.caption || `Photo ${index + 1} of ${items.length}`}
    >
      <div className="flex items-center justify-between px-4 py-3 text-[13px] text-white/70" onClick={(e) => e.stopPropagation()}>
        <span className="tabular-nums">
          {index + 1} / {items.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={img.id}
            src={img.src}
            alt={img.alt || img.caption || ''}
            initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, ease: appleEase }}
            drag={items.length > 1 && !reduce ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) next()
              else if (info.offset.x > 60) prev()
            }}
            className="max-h-full max-w-full select-none rounded-[8px] object-contain shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
            style={{ maxHeight: 'calc(100dvh - 140px)' }}
            draggable={false}
          />
        </AnimatePresence>
        {items.length > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Previous photo" className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:grid">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={next} aria-label="Next photo" className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:grid">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {(img.caption || items.length > 1) && (
        <div className="px-6 pb-5 text-center text-[14px] text-white/80" onClick={(e) => e.stopPropagation()}>
          {img.caption}
          {items.length > 1 && <span className="ml-3 hidden text-[12px] text-white/40 sm:inline">← → to browse · swipe on touch · Esc closes</span>}
        </div>
      )}
    </motion.div>
  )
}

/* ── the overlay: grid first, then the viewer ────────────────────────────── */

export function GalleryOverlay() {
  const { content } = useContent()
  const items = content.gallery
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState<number | null>(null)

  useEffect(() => {
    const onOpen = (e: Event) => {
      const i = (e as CustomEvent<number | null>).detail
      setOpen(true)
      setIndex(typeof i === 'number' ? i : null)
    }
    window.addEventListener(OPEN_GALLERY_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_GALLERY_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && index === null) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, index])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="gallery"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}
          className="fixed inset-0 z-[120] overflow-y-auto bg-parchment/95 backdrop-blur-md print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="container-apple py-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold tracking-[-0.224px] text-primary">Gallery</p>
                <h2 className="mt-1 font-display text-[28px] font-semibold tracking-[-0.01em] text-ink sm:text-[34px]">
                  {items.length} photo{items.length === 1 ? '' : 's'}
                </h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close gallery" className="glass grid h-11 w-11 place-items-center rounded-full text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <GalleryGrid items={items} onOpen={setIndex} className="mt-8" />
          </div>
          <AnimatePresence>{index !== null && items[index] && <Viewer items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />}</AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── the small icon that opens it ───────────────────────────────────────── */

export function GalleryButton({ className }: { className?: string }) {
  const { content } = useContent()
  const n = content.gallery.length
  if (n === 0) return null
  return (
    <motion.button
      type="button"
      onClick={() => openGallery()}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      transition={spring}
      aria-label={`Open gallery, ${n} photo${n === 1 ? '' : 's'}`}
      className={cn(
        'glass-dark inline-flex h-9 items-center gap-1.5 rounded-full pl-2.5 pr-3 text-[12.5px] font-semibold text-white/90 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky',
        className,
      )}
    >
      <Images className="h-4 w-4" />
      {n}
    </motion.button>
  )
}

/* ── standalone page at /gallery ────────────────────────────────────────── */

export function GalleryPage() {
  const { content } = useContent()
  const items = content.gallery
  const [index, setIndex] = useState<number | null>(null)
  useEffect(() => {
    const prev = document.title
    document.title = 'Gallery'
    return () => {
      document.title = prev
    }
  }, [])
  return (
    <div className="container-apple pt-32 pb-20">
      <p className="text-[14px] font-semibold tracking-[-0.224px] text-primary">Gallery</p>
      <h1 className="mt-2 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]">
        {items.length} photo{items.length === 1 ? '' : 's'}.
      </h1>
      <GalleryGrid items={items} onOpen={setIndex} className="mt-10" />
      <AnimatePresence>{index !== null && items[index] && <Viewer items={items} index={index} onClose={() => setIndex(null)} onIndex={setIndex} />}</AnimatePresence>
    </div>
  )
}
