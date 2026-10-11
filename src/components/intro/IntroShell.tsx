import { useI18n } from '../../i18n/useI18n'
import './intro-shell.css'

/** Shown for the moment the intro's own code is loading: the same dark hall and D&V monogram as its loader. */
export function IntroShell() {
  const { t } = useI18n()
  return (
    <div className="intro-shell" role="status">
      <span className="intro-shell__mono" aria-hidden="true">
        D<span>&amp;</span>V
      </span>
      <span className="intro-shell__text">{t.intro.preparing}</span>
    </div>
  )
}
