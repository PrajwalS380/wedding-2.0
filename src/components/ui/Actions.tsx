import { useI18n } from '../../i18n/useI18n'
import { downloadWeddingIcs } from '../../lib/ics'
import { shareInvitation } from '../../lib/share'
import { CalendarIcon, ShareIcon } from './icons'
import { useToast } from './toastContext'

/** Share the invitation (system share sheet, or copy the link) with spoken feedback. */
export function ShareButton({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  const notify = useToast()
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const r = await shareInvitation({ title: t.share.title, message: t.share.text })
        if (r === 'shared') notify(t.share.shared)
        else if (r === 'copied') notify(t.share.copied)
        else if (r === 'failed') notify(t.share.failed)
      }}
    >
      <ShareIcon className="h-4 w-4" /> {t.actions.share}
    </button>
  )
}

/** Download an all-day calendar event for both wedding days (.ics). */
export function CalendarButton({ className = '' }: { className?: string }) {
  const { t } = useI18n()
  const notify = useToast()
  return (
    <button type="button" className={className} onClick={() => notify(downloadWeddingIcs() ? t.ics.done : t.ics.failed)}>
      <CalendarIcon className="h-4 w-4" /> {t.actions.addToCalendar}
    </button>
  )
}
