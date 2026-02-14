import type { Metadata, Viewport } from 'next'
import './globals.css'
import ConsoleMessage from '@/components/ConsoleMessage'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
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

  metadataBase: new URL('https://zevo.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ZEVO - Yapay Zeka Spor Antrenörü',
    description: 'Yapay zeka ile performansını zirveye taşı. ZEVO ile tanış.',
    url: 'https://zevo.ai',
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
    <html lang="tr">
      <body><ConsoleMessage /><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  )
}
