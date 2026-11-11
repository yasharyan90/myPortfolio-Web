import { LOCAL_KEY } from './ContentProvider'
import { setLiveContent } from './live'
import { snapshot } from './snapshot'
import { loadSupabase, mediaUrl } from './supabase'
import { SECTIONS, type ContentDoc, type Section, type SectionRow, type VersionRow } from './types'

/**
 * What the owner console talks to. Supabase in production; a localStorage stand-in when no
 * database is configured, so the console can be tried (and the editors tested) in one browser.
 */
export interface ContentBackend {
  kind: 'supabase' | 'local'
  rows(): Promise<SectionRow[]>
  saveDraft(section: Section, doc: unknown): Promise<SectionRow>
  discardDraft(section: Section): Promise<SectionRow>
  publish(section: Section, note?: string): Promise<SectionRow>
  versions(section: Section): Promise<VersionRow[]>
  restore(versionId: number): Promise<SectionRow>
  /** returns the public URL of the uploaded file */
  upload(path: string, file: File): Promise<string>
  /** write the bundled snapshot into every section that has nothing published yet */
  seed(): Promise<SectionRow[]>
}

/* ── Supabase ────────────────────────────────────────────────────────────── */

interface PublishedRow {
  section: Section
  published: unknown | null
  published_at: string | null
  updated_at: string | null
  updated_by: string | null
}
interface DraftRow {
  section: Section
  draft: unknown
  updated_at: string | null
  updated_by: string | null
}

export function supabaseBackend(): ContentBackend {
  const sb = () => loadSupabase()
  const fail = (error: { message: string } | null) => {
    if (error) throw new Error(error.message)
  }

  /** published + draft tables composed into the one shape the console reads */
  const compose = (p: PublishedRow | undefined, d: DraftRow | undefined, section: Section): SectionRow => ({
    section,
    draft: d?.draft ?? null,
    published: p?.published ?? null,
    published_at: p?.published_at ?? null,
    updated_at: d?.updated_at ?? p?.updated_at ?? null,
    updated_by: d?.updated_by ?? p?.updated_by ?? null,
  })

  const rows = async (): Promise<SectionRow[]> => {
    const c = await sb()
    const [p, d] = await Promise.all([
      c.from('content').select('*').in('section', SECTIONS),
      c.from('content_drafts').select('*').in('section', SECTIONS),
    ])
    fail(p.error)
    fail(d.error)
    const pub = new Map((p.data as PublishedRow[]).map((r) => [r.section, r]))
    const dr = new Map((d.data as DraftRow[]).map((r) => [r.section, r]))
    return SECTIONS.map((s) => compose(pub.get(s), dr.get(s), s))
  }
  const row = async (section: Section): Promise<SectionRow> => {
    const c = await sb()
    const [p, d] = await Promise.all([
      c.from('content').select('*').eq('section', section).maybeSingle(),
      c.from('content_drafts').select('*').eq('section', section).maybeSingle(),
    ])
    fail(p.error)
    fail(d.error)
    return compose((p.data as PublishedRow | null) ?? undefined, (d.data as DraftRow | null) ?? undefined, section)
  }

  return {
    kind: 'supabase',
    rows,
    async saveDraft(section, doc) {
      const { error } = await (await sb()).from('content_drafts').upsert({ section, draft: doc }, { onConflict: 'section' })
      fail(error)
      return row(section)
    },
    async discardDraft(section) {
      const { error } = await (await sb()).from('content_drafts').delete().eq('section', section)
      fail(error)
      return row(section)
    },
    async publish(section, note) {
      const { error } = await (await sb()).rpc('publish_section', { p_section: section, p_note: note ?? null })
      fail(error)
      return row(section)
    },
    async versions(section) {
      const { data, error } = await (await sb()).from('content_versions').select('*').eq('section', section).order('published_at', { ascending: false }).limit(50)
      fail(error)
      return data as VersionRow[]
    },
    async restore(id) {
      const { data, error } = await (await sb()).rpc('restore_version', { p_version_id: id })
      fail(error)
      const d = (Array.isArray(data) ? data[0] : data) as DraftRow
      return row(d.section)
    },
    async upload(path, file) {
      const { error } = await (await sb()).storage.from('media').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '60' })
      fail(error)
      // bust caches on the public URL so a replaced file shows up immediately
      return `${mediaUrl(path)}?v=${Date.now()}`
    },
    async seed() {
      const existing = await rows()
      const have = new Set(existing.filter((r) => r.published).map((r) => r.section))
      const missing = SECTIONS.filter((s) => !have.has(s))
      if (!missing.length) return existing
      const batch = missing.map((section) => ({ section, published: snapshot[section], published_at: new Date().toISOString() }))
      const { error } = await (await sb()).from('content').upsert(batch, { onConflict: 'section' })
      fail(error)
      return rows()
    },
  }
}

/* ── local (no database) ─────────────────────────────────────────────────── */

interface LocalState {
  rows: Record<Section, SectionRow>
  versions: VersionRow[]
}
const LOCAL_STATE_KEY = 'portfolio:console:local'

function loadLocal(): LocalState {
  try {
    const raw = localStorage.getItem(LOCAL_STATE_KEY)
    if (raw) return JSON.parse(raw) as LocalState
  } catch {
    /* ignore */
  }
  const rows = Object.fromEntries(
    SECTIONS.map((s) => [s, { section: s, draft: null, published: snapshot[s], published_at: null, updated_at: null }]),
  ) as Record<Section, SectionRow>
  return { rows, versions: [] }
}
function saveLocal(state: LocalState) {
  localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state))
}
function publishedDoc(state: LocalState): ContentDoc {
  const doc = { ...snapshot }
  for (const s of SECTIONS) if (state.rows[s].published) (doc as Record<string, unknown>)[s] = state.rows[s].published
  return doc
}

export function localBackend(): ContentBackend {
  const state = loadLocal()
  const touch = (s: Section) => {
    state.rows[s].updated_at = new Date().toISOString()
    saveLocal(state)
    return state.rows[s]
  }
  return {
    kind: 'local',
    async rows() {
      return SECTIONS.map((s) => state.rows[s])
    },
    async saveDraft(section, doc) {
      state.rows[section].draft = doc
      return touch(section)
    },
    async discardDraft(section) {
      state.rows[section].draft = null
      return touch(section)
    },
    async publish(section, note) {
      const r = state.rows[section]
      r.published = r.draft ?? r.published
      r.draft = null
      r.published_at = new Date().toISOString()
      state.versions.unshift({ id: Date.now(), section, snapshot: r.published, published_at: r.published_at, published_by: 'local', note: note ?? null })
      touch(section)
      const doc = publishedDoc(state)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(doc))
      setLiveContent(doc)
      return r
    },
    async versions(section) {
      return state.versions.filter((v) => v.section === section)
    },
    async restore(id) {
      const v = state.versions.find((x) => x.id === id)
      if (!v) throw new Error('unknown version')
      state.rows[v.section].draft = v.snapshot
      return touch(v.section)
    },
    async upload(_path, file) {
      // no storage locally: keep the file in the page as a data URL (fine for a preview)
      return new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result))
        r.onerror = () => reject(new Error('could not read file'))
        r.readAsDataURL(file)
      })
    },
    async seed() {
      return this.rows()
    },
  }
}
