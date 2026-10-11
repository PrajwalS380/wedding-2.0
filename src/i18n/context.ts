import { createContext } from 'react'
import type { Messages } from './en'

export type Lang = 'en' | 'kn' | 'hi'

export const LANGUAGES: ReadonlyArray<{ code: Lang; label: string; name: string }> = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'kn', label: 'ಕನ್ನಡ', name: 'ಕನ್ನಡ' },
  { code: 'hi', label: 'हिन्दी', name: 'हिन्दी' },
]

export interface I18n {
  lang: Lang
  t: Messages
  setLang: (l: Lang) => void
}

export const I18nContext = createContext<I18n | null>(null)
