'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { locales, Locale, getDefaultLocale } from './index'

type Translations = typeof locales.en

interface LanguageContextType {
    locale: Locale
    t: Translations
    setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>('en')

    useEffect(() => {
        const saved = localStorage.getItem('zevo-lang') as Locale
        if (saved && (saved === 'tr' || saved === 'en')) {
            setLocaleState(saved)
        } else {
            setLocaleState(getDefaultLocale())
        }
    }, [])

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale)
        localStorage.setItem('zevo-lang', newLocale)
    }

    const t = locales[locale]

    return (
        <LanguageContext.Provider value={{ locale, t, setLocale }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) throw new Error('useLanguage must be used within LanguageProvider')
    return context
}
