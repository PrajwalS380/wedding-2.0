import { coupleNames } from '../config/wedding'
import { weddingDateRange } from './format'

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** The page being viewed (never a hard-coded production URL). */
export const currentPageUrl = () => window.location.origin + window.location.pathname

/**
 * Share the invitation with the system share sheet where available; otherwise
 * copy the link. Reports 'copied' only after the copy has actually succeeded.
 */
export async function shareInvitation(text: { title?: string; message?: string } = {}): Promise<ShareResult> {
  const url = currentPageUrl()
  const title = text.title ?? `${coupleNames} — Wedding Invitation`
  const message = text.message ?? `You are warmly invited to the wedding of ${coupleNames}, ${weddingDateRange}.`
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text: message, url })
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // fall through to copying
    }
  }
  return copyText(url)
}

export async function copyText(value: string): Promise<ShareResult> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return 'copied'
    }
  } catch {
    // fall back below
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = value
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok ? 'copied' : 'failed'
  } catch {
    return 'failed'
  }
}
