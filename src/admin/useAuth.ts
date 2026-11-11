import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, loadSupabase } from '../content/supabase'

export type Aal = 'aal1' | 'aal2'

export interface AuthState {
  ready: boolean
  session: Session | null
  email: string | null
  /** current assurance level and the one the account requires (aal2 once a TOTP factor is verified) */
  aal: { current: Aal; next: Aal } | null
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** MFA */
  factors: () => Promise<{ id: string; friendly_name?: string | null; status: string }[]>
  enroll: () => Promise<{ factorId: string; qr: string; secret: string }>
  verifyEnrollment: (factorId: string, code: string) => Promise<void>
  challenge: (code: string) => Promise<void>
  unenroll: (factorId: string) => Promise<void>
}

export function useAuth(): AuthState {
  const [sb, setSb] = useState<SupabaseClient | null>(null)
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [aal, setAal] = useState<AuthState['aal']>(null)
  const [error, setError] = useState<string | null>(null)

  const readAal = useCallback(async () => {
    if (!sb) return
    const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel()
    if (data) setAal({ current: (data.currentLevel ?? 'aal1') as Aal, next: (data.nextLevel ?? 'aal1') as Aal })
  }, [sb])

  // the SDK is loaded on demand — only the console pays for it
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true)
      return
    }
    loadSupabase()
      .then(setSb)
      .catch(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!sb) return
    let alive = true
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setReady(true)
      void readAal()
    })
    const { data: sub } = sb.auth.onAuthStateChange((_evt, s) => {
      setSession(s)
      void readAal()
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [sb, readAal])

  const wrap = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setError(null)
    try {
      return await fn()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      throw e
    }
  }

  return {
    ready,
    session,
    email: session?.user.email ?? null,
    aal,
    error,
    signIn: (email, password) =>
      wrap(async () => {
        const { error } = await sb!.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        await readAal()
      }),
    signOut: () =>
      wrap(async () => {
        await sb!.auth.signOut()
        setAal(null)
      }),
    factors: async () => {
      const { data, error } = await sb!.auth.mfa.listFactors()
      if (error) throw new Error(error.message)
      return data.totp
    },
    enroll: () =>
      wrap(async () => {
        const { data, error } = await sb!.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' })
        if (error) throw new Error(error.message)
        return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
      }),
    verifyEnrollment: (factorId, code) =>
      wrap(async () => {
        const { data: ch, error: e1 } = await sb!.auth.mfa.challenge({ factorId })
        if (e1) throw new Error(e1.message)
        const { error: e2 } = await sb!.auth.mfa.verify({ factorId, challengeId: ch.id, code })
        if (e2) throw new Error(e2.message)
        await readAal()
      }),
    challenge: (code) =>
      wrap(async () => {
        const { data, error } = await sb!.auth.mfa.listFactors()
        if (error) throw new Error(error.message)
        const f = data.totp.find((x) => x.status === 'verified')
        if (!f) throw new Error('No verified authenticator on this account')
        const { data: ch, error: e1 } = await sb!.auth.mfa.challenge({ factorId: f.id })
        if (e1) throw new Error(e1.message)
        const { error: e2 } = await sb!.auth.mfa.verify({ factorId: f.id, challengeId: ch.id, code })
        if (e2) throw new Error(e2.message)
        await readAal()
      }),
    unenroll: (factorId) =>
      wrap(async () => {
        const { error } = await sb!.auth.mfa.unenroll({ factorId })
        if (error) throw new Error(error.message)
        await readAal()
      }),
  }
}
