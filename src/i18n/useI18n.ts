import { useContext } from 'react'
import { I18nContext, type I18n } from './context'

/** The active language and its dictionary. */
export function useI18n(): I18n {
  const v = useContext(I18nContext)
  if (!v) throw new Error('useI18n must be used inside I18nProvider')
  return v
}
