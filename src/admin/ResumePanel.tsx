import { Check, Download, ExternalLink, FileText, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ContentBackend } from '../content/backend'
import { useContent } from '../content/ContentProvider'
import { resumeDownloadUrl, resumeFileName } from '../content/resume'
import { snapshot } from '../content/snapshot'
import type { ProfileDoc, SectionRow } from '../content/types'
import { btnCls, primaryBtnCls } from './fields'

interface Props {
  backend: ContentBackend
  /** the Profile section row — the résumé URL lives in profile.resumePdf */
  row: SectionRow | undefined
  onRow: (r: SectionRow) => void
}

const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null)

/**
 * One-step résumé replacement: upload a PDF, and the Profile section is published with the new
 * file so every "Download PDF" button on the site serves it. Any other unpublished Profile edits
 * stay in the draft, untouched.
 */
export function ResumePanel({ backend, row, onRow }: Props) {
  const { refresh } = useContent()
  const published = (row?.published ?? snapshot.profile) as ProfileDoc
  const draft = (row?.draft ?? null) as ProfileDoc | null
  const live = resumeDownloadUrl(published)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('That is not a PDF. Export your résumé as PDF and try again.')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('The file is over 8 MB. Compress it (most résumés are well under 1 MB).')
      return
    }
    setBusy(true)
    setError(null)
    setStatus('Uploading…')
    try {
      const url = await backend.upload('resume/resume.pdf', file)
      setStatus('Publishing…')
      // publish the live profile with the new file; re-attach any other draft edits afterwards
      await backend.saveDraft('profile', { ...published, resumePdf: url })
      let final = await backend.publish('profile')
      if (draft) final = await backend.saveDraft('profile', { ...draft, resumePdf: url })
      onRow(final)
      if (backend.kind === 'supabase') await refresh()
      setStatus(`Live — every "Download PDF" button now serves ${file.name}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-[680px]">
      <h1 className="font-display text-[26px] font-semibold tracking-[-0.01em] text-ink">Résumé PDF</h1>
      <p className="mt-1 text-[13.5px] text-ink-48">Upload a new PDF and it goes live immediately: the hero, navbar, footer, résumé page and the terminal's `cv` command all download this file.</p>

      <div className="mt-6 rounded-[14px] border border-black/[0.06] p-5 dark:border-white/10">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">Currently live</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-[12.5px] text-ink">{published.resumePdf.startsWith('data:') ? 'PDF stored in this browser (local mode)' : published.resumePdf.replace(/\?.*$/, '')}</p>
            <p className="text-[12.5px] text-ink-48">Saves as {resumeFileName(published)}{row?.published_at ? ` · published ${fmt(row.published_at)}` : ''}</p>
          </div>
          <a href={live} download={resumeFileName(published)} className={btnCls}>
            <Download className="h-3.5 w-3.5" /> Test download
          </a>
          {!published.resumePdf.startsWith('data:') && (
            <a href={published.resumePdf} target="_blank" rel="noopener noreferrer" className={btnCls}>
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-[14px] border border-dashed border-black/15 p-5 dark:border-white/15">
        <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-48">Replace with a new PDF</p>
        <p className="mt-1 text-[13.5px] text-ink-80">One step: pick the file and it is uploaded and published. {draft ? 'Your other unpublished Profile edits stay in the draft.' : ''}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={primaryBtnCls}>
            <Upload className="h-3.5 w-3.5" /> {busy ? 'Working…' : 'Upload new résumé'}
          </button>
          <input
            ref={inputRef}
            id="resume-upload"
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onFile(f)
              e.target.value = ''
            }}
          />
          {status && (
            <span className="inline-flex items-center gap-1.5 text-[13px] text-ink" aria-live="polite">
              {status.startsWith('Live') && <Check className="h-3.5 w-3.5 text-emerald-500" />}
              {status}
            </span>
          )}
        </div>
        {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
        {backend.kind === 'local' && <p className="mt-3 text-[12px] text-ink-48">Local mode keeps the file in this browser only. With Supabase connected it goes to the media bucket as resume/resume.pdf and replaces the previous one.</p>}
      </div>
    </div>
  )
}
