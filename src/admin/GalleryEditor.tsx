import { ChevronLeft, ChevronRight, ImagePlus, Trash2 } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'
import type { ContentBackend } from '../content/backend'
import type { GalleryDoc, GalleryImage } from '../content/types'
import { cn } from '../lib/cn'
import { newImageId, prepareImage } from '../lib/image'
import { btnCls, inputCls, primaryBtnCls } from './fields'

interface Props {
  value: GalleryDoc
  onChange: (v: GalleryDoc) => void
  backend: ContentBackend
}

/**
 * Multi-file upload with browser-side resizing: each photo becomes a 640 px thumbnail (grid) and a
 * high-resolution file (viewer). Items are appended to the draft as they finish; Publish makes
 * them visible on the site.
 */
export function GalleryEditor({ value, onChange, backend }: Props) {
  const items = value.items ?? []
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  // the latest list, so uploads finishing in sequence append to fresh state rather than a stale closure
  const latest = useRef(items)
  latest.current = items

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (!list.length) {
      setError('Pick image files (JPEG, PNG, WebP or GIF).')
      return
    }
    setError(null)
    const local = backend.kind === 'local'
    for (let i = 0; i < list.length; i++) {
      const file = list[i]
      setProgress(`Preparing ${i + 1} of ${list.length}: ${file.name}`)
      try {
        // local mode keeps files in this browser's storage, so keep them small there
        const prepared = await prepareImage(file, local ? { maxFull: 1200, maxThumb: 400 } : {})
        const id = newImageId()
        setProgress(`Uploading ${i + 1} of ${list.length}: ${file.name}`)
        const fullName = `gallery/${id}.${prepared.ext}`
        const thumbName = `gallery/${id}-thumb.jpg`
        const toFile = (blob: Blob, name: string) => new File([blob], name.split('/').pop()!, { type: blob.type })
        const [src, thumb] = await Promise.all([backend.upload(fullName, toFile(prepared.full, fullName)), backend.upload(thumbName, toFile(prepared.thumb, thumbName))])
        const img: GalleryImage = { id, src, thumb, width: prepared.width, height: prepared.height }
        const next = [...latest.current, img]
        latest.current = next
        onChange({ items: next })
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    setProgress(null)
  }

  const update = (id: string, patch: Partial<GalleryImage>) => onChange({ items: items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange({ items: next })
  }
  const remove = (id: string) => {
    onChange({ items: items.filter((x) => x.id !== id) })
    setConfirm(null)
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    void addFiles(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn('rounded-[14px] border border-dashed p-6 text-center transition-colors', over ? 'border-primary bg-primary/5' : 'border-black/15 dark:border-white/15')}
      >
        <ImagePlus className="mx-auto h-6 w-6 text-primary" />
        <p className="mt-2 text-[14px] text-ink">Drop photos here, or</p>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={!!progress} className={cn(primaryBtnCls, 'mt-3')}>
          {progress ? 'Working…' : 'Choose photos'}
        </button>
        <input
          ref={inputRef}
          id="gallery-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <p className="mt-3 text-[12.5px] text-ink-48">Each photo is stored twice: a small thumbnail for the grid and a high-resolution version (up to 2400 px) for the viewer. Up to 6 MB per original.</p>
        {progress && (
          <p className="mt-2 text-[13px] text-ink" aria-live="polite">
            {progress}
          </p>
        )}
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
      </div>

      {items.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="Gallery photos">
          {items.map((img, i) => (
            <li key={img.id} className={cn('rounded-[12px] border bg-white/50 p-3 dark:bg-white/[0.04]', confirm === img.id ? 'border-red-500/50' : 'border-black/10 dark:border-white/10')}>
              <div className="flex gap-3">
                <a href={img.src} target="_blank" rel="noopener noreferrer" className="block h-24 w-24 shrink-0 overflow-hidden rounded-[10px] bg-black/[0.04] dark:bg-white/[0.06]" title="Open the full-resolution file">
                  <img src={img.thumb} alt={img.alt || ''} className="h-full w-full object-cover" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] text-ink-48">
                    #{i + 1} · {img.width}×{img.height}
                  </p>
                  <input value={img.caption ?? ''} onChange={(e) => update(img.id, { caption: e.target.value || undefined })} placeholder="Caption (optional)" className={cn(inputCls, 'mt-1.5 text-[13px]')} aria-label={`Caption for photo ${i + 1}`} />
                  <input value={img.alt ?? ''} onChange={(e) => update(img.id, { alt: e.target.value || undefined })} placeholder="Alt text for screen readers (optional)" className={cn(inputCls, 'mt-1.5 text-[12.5px]')} aria-label={`Alt text for photo ${i + 1}`} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={cn(btnCls, 'px-2')} aria-label="Move earlier">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className={cn(btnCls, 'px-2')} aria-label="Move later">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </span>
                {confirm === img.id ? (
                  <span className="flex items-center gap-2 text-[12.5px] text-ink">
                    Remove this photo?
                    <button type="button" onClick={() => remove(img.id)} className={cn(primaryBtnCls, '!bg-red-600 hover:!bg-red-700')} data-testid="confirm-remove-photo">
                      Yes, remove
                    </button>
                    <button type="button" onClick={() => setConfirm(null)} className={btnCls}>
                      Keep
                    </button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirm(img.id)} className={cn(btnCls, 'text-red-600 dark:text-red-400')} data-testid="remove-photo">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && <p className="mt-3 text-[12.5px] text-ink-48">Removing a photo takes it off the site at the next Publish; the files stay in storage until you delete them from the Supabase dashboard.</p>}
    </div>
  )
}
