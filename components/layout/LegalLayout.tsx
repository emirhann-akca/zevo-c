import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface LegalLayoutProps {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-dark-primary text-white">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-emerald-primary transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Anasayfaya Dön
        </Link>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-text-muted text-sm mb-12">Son Güncelleme: {lastUpdated}</p>

        <article className="prose prose-invert max-w-none space-y-6 text-text-muted leading-relaxed [&_h2]:text-white [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-white [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_a]:text-emerald-primary [&_a]:underline [&_strong]:text-white [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:marker:text-emerald-primary">
          {children}
        </article>

        <div className="mt-16 pt-8 border-t border-white/5 text-text-muted text-sm">
          <p>
            Sorularınız için: <a href="mailto:destek@zevooapp.com" className="text-emerald-primary underline">destek@zevooapp.com</a>
          </p>
        </div>
      </div>
    </main>
  )
}
