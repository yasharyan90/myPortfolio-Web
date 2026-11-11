import { useEffect, useState } from 'react'
import { isPreviewFrame } from '../content/ContentProvider'
import type { ContributionCalendar } from '../../api/contributions'
import type { LeetCodeStats } from '../../api/leetcode'

export type { LeetCodeStats }

export interface CodeforcesStats {
  handle: string
  rating?: number
  rank?: string
  maxRating?: number
  maxRank?: string
  registeredAt: string
}

export interface GitHubStats {
  login: string
  publicRepos: number
  followers: number
  createdAt: string
  /** contributions in the rolling last 365 days, from /api/contributions */
  contributions: number | null
}

export type Live<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error' }

const TTL = 5 * 60 * 1000

/** Fetch once per session (sessionStorage, 5-minute TTL) and expose a loading / ready / error state. */
function useLive<T>(key: string, load: () => Promise<T>, enabled = true): Live<T> {
  const [state, setState] = useState<Live<T>>(() => (isPreviewFrame ? { status: 'error' } : { status: 'loading' }))
  useEffect(() => {
    if (!enabled || isPreviewFrame) return
    let alive = true
    try {
      const raw = sessionStorage.getItem(key)
      if (raw) {
        const { at, data } = JSON.parse(raw) as { at: number; data: T }
        if (Date.now() - at < TTL) {
          setState({ status: 'ready', data })
          return
        }
      }
    } catch {
      /* ignore */
    }
    load()
      .then((data) => {
        if (!alive) return
        setState({ status: 'ready', data })
        try {
          sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }))
        } catch {
          /* ignore */
        }
      })
      .catch(() => alive && setState({ status: 'error' }))
    return () => {
      alive = false
    }
  }, [key, enabled]) // eslint-disable-line react-hooks/exhaustive-deps
  return state
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json() as Promise<T>
}

function localToday() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function useLeetCode(username: string, enabled = true) {
  return useLive<LeetCodeStats>(`live:lc:${username}`, () => json(`/api/leetcode?user=${encodeURIComponent(username)}`), enabled)
}

export function useCodeforces(handle: string, enabled = true) {
  return useLive<CodeforcesStats>(
    `live:cf:${handle}`,
    async () => {
      const r = await json<{ status: string; result: Array<Record<string, unknown>> }>(
        `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      )
      const u = r.result?.[0]
      if (r.status !== 'OK' || !u) throw new Error('Codeforces user not found')
      return {
        handle: String(u.handle),
        rating: typeof u.rating === 'number' ? u.rating : undefined,
        rank: typeof u.rank === 'string' ? u.rank : undefined,
        maxRating: typeof u.maxRating === 'number' ? u.maxRating : undefined,
        maxRank: typeof u.maxRank === 'string' ? u.maxRank : undefined,
        registeredAt: new Date(Number(u.registrationTimeSeconds) * 1000).toISOString(),
      }
    },
    enabled,
  )
}

export function useGitHubStats(login: string, enabled = true) {
  return useLive<GitHubStats>(
    `live:gh:${login}`,
    async () => {
      const [user, calendar] = await Promise.all([
        json<{ login: string; public_repos: number; followers: number; created_at: string }>(`https://api.github.com/users/${encodeURIComponent(login)}`, {
          headers: { accept: 'application/vnd.github+json' },
        }),
        json<ContributionCalendar>(`/api/contributions?user=${encodeURIComponent(login)}&to=${localToday()}`).catch(() => null),
      ])
      return {
        login: user.login,
        publicRepos: user.public_repos,
        followers: user.followers,
        createdAt: user.created_at,
        contributions: calendar?.total ?? null,
      }
    },
    enabled,
  )
}

export const monthYear = (iso: string) => new Date(iso).toLocaleString('en-GB', { month: 'short', year: 'numeric' })
