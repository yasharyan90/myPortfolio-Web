import { AlertTriangle, Check, Clock, Eye, EyeOff, History, LogOut, RotateCcw, Save, Send, Trash2 } from 'lucide-react'
import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ContentBackend } from '../content/backend'
import { useContent } from '../content/ContentProvider'
import { PreviewContext } from '../content/preview'
import { setLiveContent } from '../content/live'
import { validateSection } from '../content/schema'
import { snapshot } from '../content/snapshot'
import { SECTION_LABELS, SECTIONS, type ContentDoc, type Section, type SectionRow, type VersionRow } from '../content/types'
import { cn } from '../lib/cn'
import { NowPage } from '../components/pages/NowPage'
import { About } from '../components/sections/About'
import { Certifications } from '../components/sections/Certifications'
import { Coding } from '../components/sections/Coding'
import { Contact } from '../components/sections/Contact'
import { Education } from '../components/sections/Education'
import { Projects } from '../components/sections/Projects'
import { Skills } from '../components/sections/Skills'
import { GalleryGrid } from '../components/ui/Gallery'
import type { GalleryDoc } from '../content/types'
import { btnCls, FormRenderer, ListEditor, primaryBtnCls } from './fields'
import { GalleryEditor } from './GalleryEditor'
import { ResumePanel } from './ResumePanel'
import { SPECS } from './specs'

/* ── helpers ────────────────────────────────────────────────────────────── */

type Rows = Partial<Record<Section, SectionRow>>
const isSection = (a: string): a is Section => (SECTIONS as string[]).includes(a)
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

function publishedDoc(rows: Rows): ContentDoc {
  const doc = { ...snapshot } as ContentDoc
  for (const s of SECTIONS) {
    const p = rows[s]?.published
    if (p) (doc as unknown as Record<string, unknown>)[s] = p
  }
  return doc
}

class PreviewBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false })
  }
  render() {
    if (this.state.failed)
      return (
        <div className="m-6 rounded-[12px] border border-amber-500/30 bg-amber-500/10 p-4 text-[13.5px] text-ink">
          <AlertTriangle className="mb-1 h-4 w-4 text-amber-600" /> The preview couldn't render this draft. Fix the highlighted issues and it will come back.
        </div>
      )
    return this.props.children
  }
}

const PREVIEW: Record<Section, () => ReactNode> = {
  profile: () => (
    <>
      <About />
      <Contact />
    </>
  ),
  skills: () => <Skills />,
  projects: () => <Projects />,
  education: () => <Education />,
  certifications: () => <Certifications />,
  socials: () => <Coding />,
  now: () => <NowPage />,
  gallery: () => <GalleryPreview />,
}

function GalleryPreview() {
  const { content } = useContent()
  return (
    <div className="container-apple py-10">
      <GalleryGrid items={content.gallery} onOpen={() => undefined} />
    </div>
  )
}

/* ── console ────────────────────────────────────────────────────────────── */

interface Props {
  backend: ContentBackend
  email?: string | null
  onSignOut?: () => void
  settings?: ReactNode
}

export function Console({ backend, email, onSignOut, settings }: Props) {
  const { refresh, applyLocal } = useContent()
  const [rows, setRows] = useState<Rows>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [active, setActive] = useState<Section | 'settings' | 'resume'>('profile')
  // the editor's value is keyed to its section so a section switch never renders a mismatched shape
  const [edit, setEdit] = useState<{ section: Section; value: unknown } | null>(null)
  const value = edit && edit.section === active ? edit.value : null
  const setValue = (v: unknown) => isSection(active) && setEdit({ section: active, value: v })
  const [loaded, setLoaded] = useState(false)
  const rowsRef = useRef<Rows>({})
  rowsRef.current = rows
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [issues, setIssues] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [preview, setPreview] = useState(true)
  const [versions, setVersions] = useState<VersionRow[] | null>(null)
  const timer = useRef<number>(0)

  const unseeded = backend.kind === 'supabase' && !loadError && loaded ? SECTIONS.filter((s) => !rows[s]?.published) : []
  const needsSeed = unseeded.length > 0

  const load = useCallback(async () => {
    try {
      const list = await backend.rows()
      const map: Rows = {}
      for (const r of list) map[r.section] = r
      setRows(map)
      setLoadError(null)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoaded(true)
    }
  }, [backend])
  useEffect(() => void load(), [load])

  // pick up the draft (or the published document) when the section changes or content first loads
  useEffect(() => {
    if (!isSection(active) || !loaded) return
    const r = rowsRef.current[active]
    const base = (r?.draft ?? r?.published ?? snapshot[active]) as unknown
    setEdit({ section: active, value: clone(base) })
    setDirty(false)
    setIssues([])
    setVersions(null)
    setStatus(r?.draft ? 'Unpublished draft' : r?.published_at ? `Published ${fmt(r.published_at)}` : 'Not published yet')
  }, [active, loaded])

  // live preview: this tab shows the draft in place of the published content
  useEffect(() => {
    if (!isSection(active) || value == null) return
    const doc = publishedDoc(rows)
    if (preview) (doc as unknown as Record<string, unknown>)[active] = value
    try {
      setLiveContent(doc)
    } catch {
      /* invalid draft shape — the boundary shows a message */
    }
  }, [active, value, preview, rows])

  // on leaving the console, show the published content again
  useEffect(
    () => () => {
      if (backend.kind === 'supabase') void refresh()
      else setLiveContent(publishedDoc(rows))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const upsertRow = (r: SectionRow) => setRows((m) => ({ ...m, [r.section]: r }))

  const saveDraft = useCallback(
    async (silent = false) => {
      if (!isSection(active) || value == null) return
      if (!silent) window.clearTimeout(timer.current)
      setBusy('save')
      try {
        const r = await backend.saveDraft(active, value)
        upsertRow(r)
        setDirty(false)
        setStatus(silent ? `Draft autosaved ${fmt(r.updated_at)}` : `Draft saved ${fmt(r.updated_at)}`)
      } catch (e) {
        setStatus(`Could not save: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        setBusy(null)
      }
    },
    [active, value, backend],
  )

  // autosave 1.5 s after the last keystroke
  const onChange = (v: unknown) => {
    setValue(v)
    setDirty(true)
    setStatus('Editing…')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void saveDraftRef.current(true), 1500)
  }
  const saveDraftRef = useRef(saveDraft)
  saveDraftRef.current = saveDraft
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const publish = async () => {
    if (!isSection(active)) return
    window.clearTimeout(timer.current)
    const check = validateSection(active, value)
    if (!check.ok) {
      setIssues(check.issues)
      setStatus('Fix the issues below before publishing')
      return
    }
    setIssues([])
    setBusy('publish')
    try {
      await backend.saveDraft(active, check.data)
      const r = await backend.publish(active)
      upsertRow({ ...r, draft: null })
      setDirty(false)
      if (backend.kind === 'supabase') await refresh()
      else applyLocal(publishedDoc({ ...rows, [active]: { ...r, draft: null } }))
      setStatus(`Published ${fmt(r.published_at)} — live`)
    } catch (e) {
      setStatus(`Publish failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  const discard = async () => {
    if (!isSection(active)) return
    window.clearTimeout(timer.current)
    setBusy('discard')
    try {
      const r = await backend.discardDraft(active)
      upsertRow(r)
      setEdit({ section: active, value: clone((r.published ?? snapshot[active]) as unknown) })
      setDirty(false)
      setStatus(r.published_at ? `Published ${fmt(r.published_at)}` : 'Not published yet')
    } catch (e) {
      setStatus(`Could not discard: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  const showHistory = async () => {
    if (!isSection(active)) return
    setVersions(await backend.versions(active))
  }
  const restore = async (id: number) => {
    setBusy('restore')
    try {
      const r = await backend.restore(id)
      upsertRow(r)
      setEdit({ section: r.section, value: clone(r.draft as unknown) })
      setDirty(false)
      setVersions(null)
      setStatus('Version restored into the draft — publish to make it live')
    } catch (e) {
      setStatus(`Could not restore: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  const [seedError, setSeedError] = useState<string | null>(null)
  const seed = async () => {
    setBusy('seed')
    setSeedError(null)
    try {
      const list = await backend.seed()
      const map: Rows = {}
      for (const r of list) map[r.section] = r
      setRows(map)
      await refresh()
    } catch (e) {
      setSeedError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(null)
    }
  }

  const spec = !isSection(active) ? null : SPECS[active]
  const Preview = !isSection(active) ? null : PREVIEW[active]
  const previewKey = useMemo(() => (!isSection(active) ? '' : `${active}:${JSON.stringify(value)?.length ?? 0}`), [active, value])

  return (
    <div className="container-apple grid gap-6 pb-16 pt-28 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* sidebar */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">Sections</p>
        <ul className="mt-2 grid gap-1">
          {SECTIONS.map((s) => {
            const r = rows[s]
            const state = r?.draft ? 'draft' : r?.published_at ? 'live' : 'none'
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => setActive(s)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[14px] transition-colors',
                    active === s ? 'bg-ink text-on-ink' : 'text-ink hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
                  )}
                >
                  {SECTION_LABELS[s].title}
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', state === 'draft' ? 'bg-amber-400' : state === 'live' ? 'bg-emerald-400' : 'bg-black/20 dark:bg-white/20')}
                    title={state === 'draft' ? 'Unpublished changes' : state === 'live' ? 'Published' : 'Not published yet'}
                  />
                </button>
              </li>
            )
          })}
          <li className="mt-2 border-t border-black/[0.06] pt-2 dark:border-white/10">
            <button type="button" onClick={() => setActive('resume')} className={cn('flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[14px]', active === 'resume' ? 'bg-ink text-on-ink' : 'text-ink hover:bg-black/[0.04] dark:hover:bg-white/[0.06]')}>
              Résumé PDF
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] opacity-60">upload</span>
            </button>
          </li>
          {settings && (
            <li>
              <button type="button" onClick={() => setActive('settings')} className={cn('w-full rounded-[10px] px-3 py-2 text-left text-[14px]', !isSection(active) ? 'bg-ink text-on-ink' : 'text-ink hover:bg-black/[0.04] dark:hover:bg-white/[0.06]')}>
                Account & security
              </button>
            </li>
          )}
        </ul>
        <div className="mt-4 rounded-[12px] border border-black/[0.06] p-3 text-[12.5px] text-ink-48 dark:border-white/10">
          {backend.kind === 'supabase' ? (
            <>
              <p className="text-ink">Signed in as</p>
              <p className="truncate font-mono text-[12px]">{email}</p>
              {onSignOut && (
                <button type="button" onClick={onSignOut} className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-ink hover:text-primary">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-600">Local mode</p>
              <p className="mt-1">No database connected. Edits and publishes stay in this browser only.</p>
            </>
          )}
        </div>
      </aside>

      {/* main */}
      <section className="min-w-0">
        {loadError && (
          <div className="mb-4 rounded-[12px] border border-red-500/30 bg-red-500/10 p-4 text-[13.5px] text-ink">
            <b>Couldn't load content:</b> {loadError}. If you just signed in, this account may not be listed as an owner.
          </div>
        )}
        {needsSeed && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-primary/30 bg-primary/10 p-4 text-[13.5px] text-ink">
            <span>
              <b>{unseeded.length === SECTIONS.length ? 'The database is empty.' : `${unseeded.length} section${unseeded.length > 1 ? 's are' : ' is'} not in the database yet`}</b>{' '}
              {unseeded.length === SECTIONS.length ? 'Seed it with the content currently built into the site, then edit from there.' : `(${unseeded.map((s) => SECTION_LABELS[s].title).join(', ')}). Visitors see the built-in version of those until they are published. Seed them with the built-in content now?`}
            </span>
            <button type="button" onClick={seed} disabled={busy === 'seed'} className={primaryBtnCls}>
              {busy === 'seed' ? 'Seeding…' : unseeded.length === SECTIONS.length ? 'Seed from site' : `Seed ${unseeded.length} section${unseeded.length > 1 ? 's' : ''}`}
            </button>
            {seedError && (
              <p className="basis-full text-[13px] text-red-600">
                <b>Seeding failed:</b> {seedError}
                {/violates check constraint|is_object/i.test(seedError) && <> — run <code className="font-mono">supabase/migrations/0002_allow_array_sections.sql</code> in the SQL editor, then try again.</>}
              </p>
            )}
          </div>
        )}

        {active === 'resume' ? (
          <ResumePanel backend={backend} row={rows.profile} onRow={upsertRow} />
        ) : active === 'settings' ? (
          <div>{settings}</div>
        ) : (
          spec && (
            <div className={cn('grid gap-6', preview && 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]')}>
              {/* editor */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-ink">{SECTION_LABELS[active].title}</h1>
                    <p className="mt-1 text-[13.5px] text-ink-48">{SECTION_LABELS[active].blurb}</p>
                  </div>
                  <button type="button" onClick={() => setPreview((v) => !v)} className={btnCls} aria-pressed={preview}>
                    {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {preview ? 'Hide preview' : 'Show preview'}
                  </button>
                </div>

                <div className="sticky top-[84px] z-20 mt-4 flex flex-wrap items-center gap-2 rounded-[12px] border border-black/[0.06] bg-parchment/90 p-2 backdrop-blur dark:border-white/10">
                  <button type="button" onClick={() => void saveDraft()} disabled={!dirty || !!busy} className={btnCls}>
                    <Save className="h-3.5 w-3.5" /> Save draft
                  </button>
                  <button type="button" onClick={publish} disabled={!!busy} className={primaryBtnCls}>
                    <Send className="h-3.5 w-3.5" /> {busy === 'publish' ? 'Publishing…' : 'Publish'}
                  </button>
                  <button type="button" onClick={discard} disabled={!rows[active]?.draft || !!busy} className={btnCls} title="Throw away the draft and go back to what is published">
                    <Trash2 className="h-3.5 w-3.5" /> Discard draft
                  </button>
                  <button type="button" onClick={showHistory} disabled={!!busy} className={btnCls}>
                    <History className="h-3.5 w-3.5" /> History
                  </button>
                  <span className="ml-auto inline-flex items-center gap-1.5 text-[12.5px] text-ink-48" aria-live="polite">
                    {status.startsWith('Published') ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5" />}
                    {status}
                  </span>
                </div>

                {issues.length > 0 && (
                  <ul className="mt-3 rounded-[12px] border border-amber-500/30 bg-amber-500/10 p-3 text-[13px] text-ink">
                    {issues.map((i) => (
                      <li key={i} className="font-mono text-[12.5px]">
                        {i}
                      </li>
                    ))}
                  </ul>
                )}

                {versions && (
                  <div className="mt-3 rounded-[12px] border border-black/[0.06] p-3 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-semibold text-ink">History</p>
                      <button type="button" onClick={() => setVersions(null)} className="text-[12.5px] text-ink-48 hover:text-ink">
                        Close
                      </button>
                    </div>
                    {versions.length === 0 ? (
                      <p className="mt-2 text-[13px] text-ink-48">No versions yet — the first publish creates one.</p>
                    ) : (
                      <ul className="mt-2 divide-y divide-black/[0.06] dark:divide-white/10">
                        {versions.map((v) => (
                          <li key={v.id} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                            <span className="text-ink">
                              {fmt(v.published_at)} <span className="text-ink-48">{v.note ?? ''}</span>
                            </span>
                            <button type="button" onClick={() => restore(v.id)} className={btnCls}>
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-5">
                  {value != null &&
                    (spec.root === 'custom' && active === 'gallery' ? (
                      <GalleryEditor value={value as GalleryDoc} onChange={onChange} backend={backend} />
                    ) : spec.root === 'list' ? (
                      <ListEditor
                        spec={{ fields: spec.fields, itemLabel: spec.itemLabel!, newItem: spec.newItem!, collapsed: true, noun: spec.noun }}
                        value={value as Record<string, unknown>[]}
                        onChange={onChange}
                        backend={backend}
                        path={active}
                      />
                    ) : (
                      <FormRenderer fields={spec.fields} value={value as Record<string, unknown>} onChange={onChange} backend={backend} path={active} />
                    ))}
                </div>
              </div>

              {/* preview */}
              {preview && Preview && (
                <div className="min-w-0 xl:sticky xl:top-24 xl:self-start">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-48">Live preview of the draft</p>
                  <div className="max-h-[calc(100dvh-140px)] overflow-y-auto overflow-x-hidden rounded-[18px] border border-black/[0.06] bg-canvas dark:border-white/10">
                    <PreviewBoundary resetKey={previewKey}>
                      <PreviewContext.Provider value={true}>
                        <div className="[&_section]:!py-10 [&_.container-apple]:!px-5" style={{ zoom: 0.8 }}>
                          {Preview()}
                        </div>
                      </PreviewContext.Provider>
                    </PreviewBoundary>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </section>
    </div>
  )
}
