import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { btnCls, inputCls, primaryBtnCls } from './fields'
import type { AuthState } from './useAuth'

function Card({ children, title, sub }: { children: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="glass mx-auto w-full max-w-[420px] rounded-[20px] p-7">
      <h1 className="font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
      {sub && <p className="mt-1 text-[13.5px] text-ink-48">{sub}</p>}
      <div className="mt-5">{children}</div>
    </div>
  )
}

export function Login({ auth }: { auth: AuthState }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await auth.signIn(email, password)
    } catch {
      /* shown via auth.error */
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="container-apple pt-32 pb-20">
      <Card title="Owner sign-in" sub="Only the site owner can edit. Public sign-up is off.">
        <form onSubmit={submit} className="grid gap-3">
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold text-ink">Email</span>
            <input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-semibold text-ink">Password</span>
            <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} required />
          </label>
          {auth.error && <p className="text-[13px] text-red-600">{auth.error}</p>}
          <button type="submit" disabled={busy} className={primaryBtnCls}>
            <KeyRound className="h-3.5 w-3.5" /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </Card>
    </div>
  )
}

export function MfaChallenge({ auth }: { auth: AuthState }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await auth.challenge(code.replace(/\s+/g, ''))
    } catch {
      /* shown via auth.error */
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="container-apple pt-32 pb-20">
      <Card title="Second step" sub="Enter the 6-digit code from your authenticator app.">
        <form onSubmit={submit} className="grid gap-3">
          <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls + ' text-center font-mono text-[20px] tracking-[0.3em]'} maxLength={7} autoFocus />
          {auth.error && <p className="text-[13px] text-red-600">{auth.error}</p>}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => void auth.signOut()} className={btnCls}>
              Sign out
            </button>
            <button type="submit" disabled={busy || code.length < 6} className={primaryBtnCls}>
              <ShieldCheck className="h-3.5 w-3.5" /> Verify
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}

/** Account & security panel inside the console: two-factor enrolment and sign out. */
export function SecuritySettings({ auth }: { auth: AuthState }) {
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string | null; status: string }[]>([])
  const [enrolling, setEnrolling] = useState<{ factorId: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const reload = async () => setFactors(await auth.factors())
  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const verified = factors.filter((f) => f.status === 'verified')
  return (
    <div className="max-w-[640px]">
      <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-ink">Account & security</h1>
      <p className="mt-1 text-[13.5px] text-ink-48">
        Signed in as <span className="font-mono">{auth.email}</span>.
      </p>

      <div className="mt-6 rounded-[14px] border border-black/[0.06] p-5 dark:border-white/10">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <ShieldCheck className="h-4 w-4 text-primary" /> Two-factor authentication
        </h2>
        {verified.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {verified.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-[10px] bg-emerald-500/10 px-3 py-2 text-[13.5px] text-ink">
                <span>{f.friendly_name ?? 'Authenticator app'} · enabled</span>
                <button
                  type="button"
                  className={btnCls}
                  onClick={async () => {
                    await auth.unenroll(f.id)
                    await reload()
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </li>
            ))}
          </ul>
        ) : enrolling ? (
          <div className="mt-3 grid gap-3">
            <p className="text-[13.5px] text-ink-80">Scan this with Google Authenticator, 1Password, Authy or similar, then enter the code it shows.</p>
            <img src={enrolling.qr} alt="Authenticator QR code" className="h-44 w-44 rounded-[10px] bg-white p-2" />
            <p className="font-mono text-[12px] text-ink-48">Manual key: {enrolling.secret}</p>
            <div className="flex gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" placeholder="123 456" className={inputCls + ' max-w-[160px] font-mono'} />
              <button
                type="button"
                className={primaryBtnCls}
                disabled={code.replace(/\s/g, '').length < 6}
                onClick={async () => {
                  try {
                    await auth.verifyEnrollment(enrolling.factorId, code.replace(/\s/g, ''))
                    setEnrolling(null)
                    setCode('')
                    setMsg('Two-factor is on. You will be asked for a code at every sign-in.')
                    await reload()
                  } catch {
                    /* auth.error */
                  }
                }}
              >
                Turn on
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-[13.5px] text-ink-80">Recommended: a code from your phone is required at sign-in, so a leaked password alone can't edit the site.</p>
            <button type="button" className={primaryBtnCls + ' mt-3'} onClick={async () => setEnrolling(await auth.enroll())}>
              Set up authenticator
            </button>
          </div>
        )}
        {auth.error && <p className="mt-2 text-[13px] text-red-600">{auth.error}</p>}
        {msg && <p className="mt-2 text-[13px] text-emerald-600">{msg}</p>}
      </div>
    </div>
  )
}
