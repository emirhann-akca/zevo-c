import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-8xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          404
        </h1>
        <p className="text-xl text-white/60 mb-8">
          Aradığınız sayfa bulunamadı.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors"
        >
          Anasayfaya Dön
        </Link>
      </div>
    </div>
  )
}
