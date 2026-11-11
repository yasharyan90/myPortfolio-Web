import { ChevronDown, ChevronUp, Copy, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ContentBackend } from '../content/backend'
import { ICON_NAMES, iconFor } from '../content/icons'
import { cn } from '../lib/cn'
import type { FieldSpec } from './specs'

/* ── primitives ─────────────────────────────────────────────────────────── */

export const inputCls =
  'w-full rounded-[10px] border border-black/10 bg-white/70 px-3 py-2 text-[14px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink-48/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-white/[0.06]'
export const btnCls =
  'inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[13px] text-ink transition-colors hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus'
export const primaryBtnCls =
  'inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-primary-focus disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus'

function Label({ text, help, optional, htmlFor }: { text: string; help?: string; optional?: boolean; htmlFor?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[12.5px] font-semibold tracking-[-0.1px] text-ink">
        {text}
        {optional && <span className="ml-1.5 font-normal text-ink-48">optional</span>}
      </label>
      {help && <span className="text-[12px] text-ink-48">{help}</span>}
    </div>
  )
}

const safeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '')

function UploadButton({ accept, onFile, busy }: { accept?: string; onFile: (f: File) => void; busy: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <button type="button" className={btnCls} disabled={busy} onClick={() => ref.current?.click()}>
        <Upload className="h-3.5 w-3.5" /> {busy ? 'Uploading…' : 'Upload'}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </>
  )
}

function StringsEditor({ id, value, onChange, placeholder }: { id: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState(value.join('\n'))
  useEffect(() => {
    setText((t) => (t.split('\n').filter(Boolean).join('\n') === value.join('\n') ? t : value.join('\n')))
  }, [value])
  return (
    <textarea
      id={id}
      value={text}
      rows={Math.min(12, Math.max(3, value.length + 1))}
      placeholder={placeholder ?? 'one per line'}
      onChange={(e) => {
        setText(e.target.value)
        onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))
      }}
      className={cn(inputCls, 'font-mono text-[13px] leading-[1.5]')}
    />
  )
}

function IconPicker({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const Current = iconFor(value)
  const names = useMemo(() => ICON_NAMES.filter((n) => n.toLowerCase().includes(q.toLowerCase())), [q])
  return (
    <div>
      <button type="button" id={id} onClick={() => setOpen((v) => !v)} className={cn(btnCls, 'gap-2')} aria-expanded={open}>
        <Current size={16} /> {value || 'Pick an icon'} <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="mt-2 rounded-[12px] border border-black/10 bg-white/80 p-2 dark:border-white/10 dark:bg-white/[0.06]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons…" className={inputCls} autoFocus />
          <div className="mt-2 grid max-h-56 grid-cols-6 gap-1 overflow-y-auto sm:grid-cols-8">
            {names.map((n) => {
              const I = iconFor(n)
              return (
                <button
                  key={n}
                  type="button"
                  title={n}
                  onClick={() => {
                    onChange(n)
                    setOpen(false)
                  }}
                  className={cn('grid h-10 place-items-center rounded-[8px] text-ink transition-colors hover:bg-black/[0.05] dark:hover:bg-white/10', n === value && 'bg-primary/15 text-primary')}
                >
                  <I size={18} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── one field ──────────────────────────────────────────────────────────── */

interface FieldProps {
  spec: FieldSpec
  value: unknown
  onChange: (v: unknown) => void
  backend: ContentBackend
  path: string
}

export function Field({ spec, value, onChange, backend, path }: FieldProps) {
  const id = `f-${path.replace(/[^a-z0-9]+/gi, '-')}`
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const upload = async (file: File, folder: string, fixedName?: string) => {
    setBusy(true)
    setErr(null)
    try {
      const url = await backend.upload(`${folder}/${fixedName ?? `${Date.now()}-${safeName(file.name)}`}`, file)
      onChange(url)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'upload failed')
    } finally {
      setBusy(false)
    }
  }

  switch (spec.kind) {
    case 'text':
    case 'url':
    case 'date':
      return (
        <div>
          <Label text={spec.label} help={spec.help} optional={spec.optional} htmlFor={id} />
          <input id={id} type={spec.kind === 'date' ? 'date' : 'text'} value={String(value ?? '')} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
        </div>
      )
    case 'textarea':
      return (
        <div>
          <Label text={spec.label} help={spec.help} optional={spec.optional} htmlFor={id} />
          <textarea id={id} value={String(value ?? '')} rows={4} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, 'leading-[1.5]')} />
        </div>
      )
    case 'number':
      return (
        <div>
          <Label text={spec.label} help={spec.help} optional={spec.optional} htmlFor={id} />
          <input
            id={id}
            type="number"
            step="any"
            value={value == null || value === '' ? '' : String(value)}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
            className={cn(inputCls, 'tabular-nums')}
          />
        </div>
      )
    case 'color': {
      const v = typeof value === 'string' ? value : ''
      return (
        <div>
          <Label text={spec.label} help={spec.help} optional={spec.optional} htmlFor={id} />
          <div className="flex items-center gap-2">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : '#0066cc'} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded-[8px] border border-black/10 bg-transparent p-0.5 dark:border-white/10" aria-label={`${spec.label} swatch`} />
            <input id={id} value={v} placeholder="#0066cc" onChange={(e) => onChange(e.target.value || undefined)} className={cn(inputCls, 'font-mono text-[13px]')} />
          </div>
        </div>
      )
    }
    case 'select':
      return (
        <div>
          <Label text={spec.label} help={spec.help} htmlFor={id} />
          <select id={id} value={String(value ?? spec.options[0])} onChange={(e) => onChange(e.target.value)} className={inputCls}>
            {spec.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      )
    case 'icon':
      return (
        <div>
          <Label text={spec.label} help={spec.help} htmlFor={id} />
          <IconPicker id={id} value={String(value ?? '')} onChange={onChange} />
        </div>
      )
    case 'strings':
      return (
        <div>
          <Label text={spec.label} help={spec.help} htmlFor={id} />
          <StringsEditor id={id} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} placeholder={spec.placeholder} />
        </div>
      )
    case 'image':
    case 'file': {
      const v = typeof value === 'string' ? value : ''
      return (
        <div>
          <Label text={spec.label} help={spec.help} optional={spec.optional} htmlFor={id} />
          <div className="flex items-start gap-3">
            {spec.kind === 'image' && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border border-black/10 bg-black/[0.04] dark:border-white/10 dark:bg-white/[0.06]">
                {v && <img src={v} alt="" className="h-full w-full object-cover" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <input id={id} value={v} placeholder={spec.kind === 'image' ? '/path.jpg or https://…' : 'https://…/file.pdf'} onChange={(e) => onChange(e.target.value || undefined)} className={cn(inputCls, 'font-mono text-[12.5px]')} />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <UploadButton accept={spec.accept ?? (spec.kind === 'image' ? 'image/*' : undefined)} busy={busy} onFile={(f) => void upload(f, spec.uploadPath ?? 'uploads', spec.fixedName)} />
                {v && spec.kind === 'file' && (
                  <a href={v} target="_blank" rel="noopener noreferrer" className="text-[12.5px] text-primary hover:underline">
                    Open current file
                  </a>
                )}
                {backend.kind === 'local' && <span className="text-[12px] text-ink-48">local mode: files stay in this browser</span>}
              </div>
              {err && <p className="mt-1 text-[12.5px] text-red-600">{err}</p>}
            </div>
          </div>
        </div>
      )
    }
    case 'object':
      return (
        <fieldset className="rounded-[12px] border border-black/10 p-4 dark:border-white/10">
          <legend className="px-1 text-[12.5px] font-semibold text-ink">{spec.label}</legend>
          <FormRenderer fields={spec.fields} value={(value as Record<string, unknown>) ?? {}} onChange={onChange} backend={backend} path={path} />
        </fieldset>
      )
    case 'list':
      return (
        <div>
          <Label text={spec.label} help={spec.help} />
          <ListEditor spec={spec} value={Array.isArray(value) ? (value as Record<string, unknown>[]) : []} onChange={onChange} backend={backend} path={path} />
        </div>
      )
  }
}

/* ── lists: reorder, duplicate, delete, add ─────────────────────────────── */

export function ListEditor({
  spec,
  value,
  onChange,
  backend,
  path,
}: {
  spec: Extract<FieldSpec, { kind: 'list' }> | { fields: FieldSpec[]; itemLabel: (item: Record<string, unknown>, i: number) => string; newItem: () => Record<string, unknown>; collapsed?: boolean }
  value: Record<string, unknown>[]
  onChange: (v: Record<string, unknown>[]) => void
  backend: ContentBackend
  path: string
}) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const set = (i: number, item: Record<string, unknown>) => onChange(value.map((x, j) => (j === i ? item : x)))
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
    setOpen((o) => ({ ...o, [i]: o[j] ?? false, [j]: o[i] ?? false }))
  }
  return (
    <div className="grid gap-2">
      {value.map((item, i) => {
        const isOpen = open[i] ?? !spec.collapsed
        return (
          <div key={i} className="rounded-[12px] border border-black/10 bg-white/50 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [i]: !isOpen }))} className="flex min-w-0 flex-1 items-center gap-2 rounded-[8px] px-2 py-1 text-left text-[13.5px] font-semibold text-ink hover:bg-black/[0.04] dark:hover:bg-white/[0.06]" aria-expanded={isOpen}>
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-ink-48 transition-transform', isOpen && 'rotate-180')} />
                <span className="truncate">{spec.itemLabel(item, i) || `Item ${i + 1}`}</span>
                <span className="ml-auto shrink-0 text-[11.5px] font-normal text-ink-48">#{i + 1}</span>
              </button>
              <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                <ChevronUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1}>
                <ChevronDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Duplicate" onClick={() => onChange([...value.slice(0, i + 1), JSON.parse(JSON.stringify(item)), ...value.slice(i + 1)])}>
                <Copy className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Delete" onClick={() => onChange(value.filter((_, j) => j !== i))} danger>
                <Trash2 className="h-3.5 w-3.5" />
              </IconBtn>
            </div>
            {isOpen && (
              <div className="border-t border-black/[0.06] px-4 py-4 dark:border-white/10">
                <FormRenderer fields={spec.fields} value={item} onChange={(v) => set(i, v as Record<string, unknown>)} backend={backend} path={`${path}.${i}`} />
              </div>
            )}
          </div>
        )
      })}
      <button
        type="button"
        onClick={() => {
          onChange([...value, spec.newItem()])
          setOpen((o) => ({ ...o, [value.length]: true }))
        }}
        className={cn(btnCls, 'justify-center border-dashed')}
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
  )
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn('grid h-7 w-7 place-items-center rounded-[7px] text-ink-48 transition-colors hover:bg-black/[0.05] hover:text-ink disabled:opacity-30 dark:hover:bg-white/10', danger && 'hover:text-red-600')}
    >
      {children}
    </button>
  )
}

/* ── a set of fields over one object ────────────────────────────────────── */

export function FormRenderer({ fields, value, onChange, backend, path }: { fields: FieldSpec[]; value: Record<string, unknown>; onChange: (v: unknown) => void; backend: ContentBackend; path: string }) {
  return (
    <div className="grid gap-4">
      {fields.map((f) => (
        <Field
          key={f.key}
          spec={f}
          value={value[f.key]}
          onChange={(v) => {
            const next = { ...value }
            if (v === undefined || v === '') delete next[f.key]
            else next[f.key] = v
            onChange(next)
          }}
          backend={backend}
          path={`${path}.${f.key}`}
        />
      ))}
    </div>
  )
}
