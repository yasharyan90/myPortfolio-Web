import type { ProfileDoc } from './types'

/** File name the browser saves the résumé under, e.g. Yash_Aryan_Resume.pdf */
export const resumeFileName = (profile: Pick<ProfileDoc, 'name'>) => `${profile.name.trim().replace(/\s+/g, '_')}_Resume.pdf`

/**
 * The href every "Download PDF" button uses.
 * - a site path (public/…) downloads via the anchor's `download` attribute and the Vercel header
 * - a Supabase Storage URL is cross-origin, where browsers ignore `download`, so we ask Storage
 *   to send it as an attachment with the right file name
 * - a data: URL (local demo mode) downloads via the attribute like a same-origin file
 */
export function resumeDownloadUrl(profile: Pick<ProfileDoc, 'name' | 'resumePdf'>): string {
  const url = profile.resumePdf
  if (!/\/storage\/v1\/object\/public\//.test(url)) return url
  try {
    const u = new URL(url)
    u.searchParams.set('download', resumeFileName(profile))
    return u.toString()
  } catch {
    return url
  }
}

/** Absolute form for places that open a new tab (the terminal). */
export function resumeDownloadAbsolute(profile: Pick<ProfileDoc, 'name' | 'resumePdf'>, origin: string): string {
  const href = resumeDownloadUrl(profile)
  return /^(https?:|data:)/.test(href) ? href : `${origin}${href}`
}
