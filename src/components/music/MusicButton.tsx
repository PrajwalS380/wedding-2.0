import { useI18n } from '../../i18n/useI18n'
import { useMusic } from './musicContext'
import './music.css'

/** The header's music control: a gold note at rest, three soft bars while playing. */
export function MusicButton() {
  const { t } = useI18n()
  const { playing, toggle } = useMusic()
  return (
    <button type="button" className={`music-btn ${playing ? 'is-playing' : ''}`} aria-pressed={playing} aria-label={playing ? t.music.pause : t.music.play} title={t.music.title} onClick={toggle}>
      {playing ? (
        <span className="music-btn__bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      ) : (
        <svg viewBox="0 0 24 24" className="music-btn__note" aria-hidden="true" focusable="false">
          <path d="M9 18V6l10-2v11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx="6.5" cy="18" rx="2.6" ry="2.1" fill="currentColor" />
          <ellipse cx="16.5" cy="15" rx="2.6" ry="2.1" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}
