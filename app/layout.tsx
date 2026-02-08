import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ZEVO - Yapay Zeka Antrenör',
  description: 'Performansını takip etmek, analiz etmek ve geliştirmek için en iyi spor asistanı',
  keywords: 'spor, yapay zeka, fitness, antrenman, performans analizi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
