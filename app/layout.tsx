import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ConsoleMessage from '@/components/ConsoleMessage'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

// ===== OPTIMIZED FONT LOADING =====
// next/font eliminates render-blocking CSS requests
// Fonts are self-hosted, preloaded, and subsetted automatically
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
  preload: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A1628',
}

export const metadata: Metadata = {
  title: {
    default: 'ZEVO - Yapay Zeka Spor Antrenörü',
    template: '%s | ZEVO'
  },
  description: 'Performansını takip etmek, analiz etmek ve geliştirmek için en iyi yapay zeka destekli spor asistanı. Hemen indir ve potansiyelini keşfet.',
  keywords: ['spor', 'yapay zeka', 'fitness', 'antrenman', 'performans analizi', 'ai coach', 'zevo'],
  authors: [{ name: 'ZEVO Team' }],
  creator: 'ZEVO',
  publisher: 'ZEVO AI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  metadataBase: new URL('https://zevooapp.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ZEVO - Yapay Zeka Spor Antrenörü',
    description: 'Yapay zeka ile performansını zirveye taşı. ZEVO ile tanış.',
    url: 'https://zevooapp.com',
    siteName: 'ZEVO',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZEVO - Yapay Zeka Spor Antrenörü',
    description: 'Yapay zeka ile performansını zirveye taşı.',
    creator: '@zevoapp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body className={inter.className}>
        <ConsoleMessage />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
