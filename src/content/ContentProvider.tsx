import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getContent, mergeSections, setLiveContent, subscribeContent } from './live'
import { snapshot } from './snapshot'
import { anonHeaders, isSupabaseConfigured, loadSupabase, SUPABASE_URL } from './supabase'
import { SECTIONS, type ContentDoc, type ResolvedContent, type Section } from './types'

export type ContentSource = 'snapshot' | 'cache' | 'live' | 'local'

interface ContentState {
  content: ResolvedContent
  version: number
  source: ContentSource
  loadedAt: number | null
  /** re-fetch published content now (used after a publish from the console) */
  refresh: () => Promise<void>
  /** apply a document without touching the network (local mode in the console) */
  applyLocal: (doc: ContentDoc) => void
}

const Ctx = createContext<ContentState | null>(null)

export const CACHE_KEY = 'portfolio:content:published'
export const LOCAL_KEY = 'portfolio:content:local'
export const PREVIEW_MESSAGE = 'portfolio:preview'
export const PREVIEW_READY = 'portfolio:preview-ready'

/** True when this document is the owner console's preview iframe (same origin, ?preview=1). */
export const isPreviewFrame = typeof window !== 'undefined' && window.parent !== window && new URLSearchParams(window.location.search).get('preview') === '1'

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

/** Published sections from Supabase, as a partial document — plain fetch, no SDK on the visitor's path. */
export async function fetchPublished(): Promise<Partial<Record<Section, unknown>> | null> {
  if (!isSupabaseConfigured) return null
  try {
    const url = `${SUPABASE_URL}/rest/v1/content?select=section,published&section=in.(${SECTIONS.join(',')})`
    const res = await fetch(url, { headers: { ...anonHeaders(), accept: 'application/json' } })
    if (!res.ok) return null
    const data = (await res.json()) as { section: Section; published: unknown }[]
    const out: Partial<Record<Section, unknown>> = {}
    for (const row of data) if (row.published) out[row.section] = row.published
    return out
  } catch {
    return null
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const [source, setSource] = useState<ContentSource>('snapshot')
  const [loadedAt, setLoadedAt] = useState<number | null>(null)
  const applied = useRef<string>('')

  const apply = useCallback((doc: ContentDoc, from: ContentSource) => {
    const key = JSON.stringify(doc)
    if (key === applied.current) return
    applied.current = key
    setLiveContent(doc)
    setSource(from)
    setLoadedAt(Date.now())
  }, [])

  const refresh = useCallback(async () => {
    const rows = await fetchPublished()
    if (!rows) return
    const doc = mergeSections(snapshot, rows)
    writeJson(CACHE_KEY, { at: Date.now(), rows })
    apply(doc, 'live')
  }, [apply])

  // re-render on any live change (from this provider, the console, or realtime)
  useEffect(() => subscribeContent(() => setVersion((v) => v + 1)), [])

  useEffect(() => {
    if (isPreviewFrame) {
      // the console posts the draft document; nothing is fetched or persisted here
      const onMessage = (e: MessageEvent) => {
        if (e.origin !== window.location.origin || e.source !== window.parent) return
        const data = e.data as { type?: string; doc?: ContentDoc }
        if (data?.type === PREVIEW_MESSAGE && data.doc) {
          apply(data.doc, 'local')
          // land on the section the console is editing once the layout has settled
          const id = window.location.hash.replace(/^#/, '')
          if (id) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' }), 250)
        }
      }
      window.addEventListener('message', onMessage)
      window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin)
      return () => window.removeEventListener('message', onMessage)
    }
    if (isSupabaseConfigured) {
      // 1. last known published content, instantly; 2. the network; 3. stay subscribed
      const cached = readJson<{ at: number; rows: Partial<Record<Section, unknown>> }>(CACHE_KEY)
      if (cached?.rows) apply(mergeSections(snapshot, cached.rows), 'cache')
      void refresh()
      // Realtime needs the SDK: load it after first paint so it never delays the page
      let cancelled = false
      let cleanup: (() => void) | null = null
      const timer = window.setTimeout(() => {
        loadSupabase()
          .then((sb) => {
            if (cancelled) return
            const channel = sb
              .channel('content-published')
              .on('postgres_changes', { event: '*', schema: 'public', table: 'content' }, () => void refresh())
              .subscribe()
            cleanup = () => void sb.removeChannel(channel)
          })
          .catch(() => undefined)
      }, 1500)
      const onFocus = () => void refresh()
      window.addEventListener('focus', onFocus)
      return () => {
        cancelled = true
        window.clearTimeout(timer)
        window.removeEventListener('focus', onFocus)
        cleanup?.()
      }
    }
    // no database: honour edits made in this browser's local console, if any
    const local = readJson<ContentDoc>(LOCAL_KEY)
    if (local) apply(local, 'local')
    return undefined
  }, [apply, refresh])

  const applyLocal = useCallback(
    (doc: ContentDoc) => {
      writeJson(LOCAL_KEY, doc)
      apply(doc, 'local')
    },
    [apply],
  )

  const value = useMemo<ContentState>(() => ({ content: getContent(), version, source, loadedAt, refresh, applyLocal }), [version, source, loadedAt, refresh, applyLocal])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** The resolved content plus a version that changes whenever it does — call it in any component that renders content. */
export function useContent(): ContentState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useContent must be used inside <ContentProvider>')
  return ctx
}
