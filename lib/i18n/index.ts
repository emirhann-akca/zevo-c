import { tr } from './locales/tr'
import { en } from './locales/en'

export type Locale = 'tr' | 'en'
export const locales = { tr, en }

export function getDefaultLocale(): Locale {
    if (typeof window === 'undefined') return 'en'
    const browserLang = navigator.language.slice(0, 2)
    return browserLang === 'tr' ? 'tr' : 'en'
}
