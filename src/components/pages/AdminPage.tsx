import { Database, FlaskConical } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Console } from '../../admin/Console'
import { Login, MfaChallenge, SecuritySettings } from '../../admin/Login'
import { useAuth } from '../../admin/useAuth'
import { btnCls, primaryBtnCls } from '../../admin/fields'
import { localBackend, supabaseBackend } from '../../content/backend'
import { isSupabaseConfigured } from '../../content/supabase'

function Setup({ onLocal }: { onLocal: () => void }) {
  return (
    <div className="container-apple pt-32 pb-20">
      <div className="glass mx-auto max-w-[640px] rounded-[20px] p-7">
        <h1 className="flex items-center gap-2 font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
          <Database className="h-5 w-5 text-primary" /> Owner console isn't connected yet
        </h1>
        <p className="mt-2 text-[14.5px] leading-[1.5] text-ink-80">
          This build has no Supabase keys, so there is nothing to sign in to. Add <code className="rounded bg-black/[0.05] px-1 font-mono text-[12.5px] dark:bg-white/10">VITE_SUPABASE_URL</code> and{' '}
          <code className="rounded bg-black/[0.05] px-1 font-mono text-[12.5px] dark:bg-white/10">VITE_SUPABASE_ANON_KEY</code> to <code className="font-mono text-[12.5px]">.env.local</code> for local work and to the
          Vercel project's environment variables for production, then redeploy. The README in <code className="font-mono text-[12.5px]">supabase/</code> has the full steps.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onLocal} className={primaryBtnCls}>
            <FlaskConical className="h-3.5 w-3.5" /> Try the console in local mode
          </button>
          <a href="/" className={btnCls}>
            Back to the site
          </a>
        </div>
        <p className="mt-3 text-[12.5px] text-ink-48">Local mode uses this browser's storage only. Nothing you publish there reaches the live site or anyone else.</p>
      </div>
    </div>
  )
}

function SupabaseConsole() {
  const auth = useAuth()
  const backend = useMemo(() => supabaseBackend(), [])
  if (!auth.ready) return <div className="container-apple pt-32 text-[14px] text-ink-48">Checking your session…</div>
  if (!auth.session) return <Login auth={auth} />
  if (auth.aal && auth.aal.next === 'aal2' && auth.aal.current !== 'aal2') return <MfaChallenge auth={auth} />
  return <Console backend={backend} email={auth.email} onSignOut={() => void auth.signOut()} settings={<SecuritySettings auth={auth} />} />
}

export default function AdminPage() {
  const [local, setLocal] = useState(false)
  const localBe = useMemo(() => (local ? localBackend() : null), [local])
  useEffect(() => {
    const prev = document.title
    document.title = 'Owner console'
    return () => {
      document.title = prev
    }
  }, [])
  if (isSupabaseConfigured) return <SupabaseConsole />
  if (local && localBe) return <Console backend={localBe} />
  return <Setup onLocal={() => setLocal(true)} />
}
