import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageCircle, BookOpen, Bug, Shield, CreditCard, Trash2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Destek & Yardım',
  description: 'ZEVO uygulaması ile ilgili sıkça sorulan sorular, iletişim ve destek kanalları.',
  alternates: { canonical: '/destek' },
}

const faqs = [
  {
    q: 'ZEVO Premium üyeliğimi nasıl iptal ederim?',
    a: 'iOS için: Ayarlar → Apple ID → Abonelikler → ZEVO → İptal Et. Android için: Google Play → Profil → Ödemeler ve abonelikler → Abonelikler → ZEVO → İptal Et. İptal sonrası mevcut dönem sonuna kadar Premium özellikleri kullanmaya devam edebilirsiniz.',
  },
  {
    q: 'Hesabımı nasıl silerim?',
    a: 'Uygulama içinden: Ayarlar → Hesap → Hesabımı Sil. Veya hesap-silme sayfasındaki adımları takip edebilirsiniz. Verileriniz 30 gün içinde kalıcı olarak silinir.',
  },
  {
    q: 'Sağlık verilerim güvende mi?',
    a: 'Evet. Tüm sağlık verileriniz şifrelenmiş olarak saklanır, asla üçüncü taraflarla pazarlama amaçlı paylaşılmaz veya satılmaz. Detaylar için Gizlilik Politikamızı inceleyin.',
  },
  {
    q: 'HealthKit / Health Connect bağlantısı çalışmıyor.',
    a: 'iOS: Ayarlar → Sağlık → Veri Erişimi → ZEVO menüsünden tüm izinleri açtığınızdan emin olun. Android: Health Connect uygulamasını yükleyin ve ZEVO için izinleri aktif edin. Sorun devam ederse uygulamayı yeniden başlatın.',
  },
  {
    q: 'AI Koç yanıt vermiyor / yavaş.',
    a: 'AI Koç bulut tabanlı çalışır; internet bağlantınızı kontrol edin. Ücretsiz üyelikte günlük 50 mesaj limiti bulunur, Premium üyelikte 500. Limiti aştıysanız ertesi gün sıfırlanır.',
  },
  {
    q: 'Antrenman / koşu verim kaybolduğu / senkronize olmadığı görülüyor.',
    a: 'Uygulamayı arka planda çalışmaya kapatmamak için Pil Optimizasyonundan ZEVO\'yu çıkarın (Android). Cihazınızı yeniden başlatıp tekrar deneyin. Sorun devam ederse destek ekibimize yazın.',
  },
  {
    q: 'Faturamı / makbuzumu nereden bulurum?',
    a: 'iOS: Apple e-posta makbuzu kayıtlı e-posta adresinize gönderilir; ayrıca reportaproblem.apple.com adresinden erişebilirsiniz. Android: Google Play → Ödemeler → Sipariş geçmişi.',
  },
]

const contactCards = [
  {
    icon: Mail,
    title: 'E-posta Destek',
    desc: 'Genel sorular, hatalar, geri bildirim',
    href: 'mailto:destek@zevooapp.com',
    cta: 'destek@zevooapp.com',
  },
  {
    icon: Shield,
    title: 'Gizlilik & KVKK',
    desc: 'Veri erişim, silme ve gizlilik talepleri',
    href: 'mailto:gizlilik@zevooapp.com',
    cta: 'gizlilik@zevooapp.com',
  },
  {
    icon: Bug,
    title: 'Hata Bildirimi',
    desc: 'Crash, bug ve teknik sorunlar',
    href: 'mailto:bug@zevooapp.com',
    cta: 'bug@zevooapp.com',
  },
]

const quickLinks = [
  { icon: BookOpen, title: 'Gizlilik Politikası', href: '/gizlilik' },
  { icon: MessageCircle, title: 'Kullanım Şartları', href: '/kosullar' },
  { icon: Trash2, title: 'Hesap Silme', href: '/hesap-silme' },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-dark-primary text-white">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-emerald-primary transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Anasayfaya Dön
        </Link>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Destek &amp; Yardım Merkezi
        </h1>
        <p className="text-text-muted text-lg mb-12">
          Size yardımcı olmak için buradayız. Aşağıdan iletişim kanallarına ulaşabilir veya sık sorulan soruları
          inceleyebilirsiniz.
        </p>

        {/* Contact Cards */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Bize Ulaşın</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactCards.map((c) => {
              const Icon = c.icon
              return (
                <a
                  key={c.title}
                  href={c.href}
                  className="block p-6 rounded-2xl bg-dark-secondary border border-white/10 hover:border-emerald-primary/50 transition-all group"
                >
                  <Icon className="w-8 h-8 text-emerald-primary mb-3" />
                  <h3 className="text-white font-semibold mb-1">{c.title}</h3>
                  <p className="text-text-muted text-sm mb-3">{c.desc}</p>
                  <span className="text-emerald-primary text-sm group-hover:underline break-all">{c.cta}</span>
                </a>
              )
            })}
          </div>
          <p className="text-text-muted text-sm mt-4">
            Ortalama yanıt süresi: <strong className="text-white">24 saat</strong> (hafta içi). Acil
            güvenlik/gizlilik talepleri 48 saat içinde yanıtlanır.
          </p>
        </section>

        {/* Quick Links */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Hızlı Bağlantılar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickLinks.map((l) => {
              const Icon = l.icon
              return (
                <Link
                  key={l.title}
                  href={l.href}
                  className="flex items-center gap-3 p-4 rounded-xl bg-dark-secondary border border-white/10 hover:border-emerald-primary/50 transition-all"
                >
                  <Icon className="w-5 h-5 text-emerald-primary" />
                  <span className="text-white font-medium">{l.title}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Sıkça Sorulan Sorular</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="group bg-dark-secondary border border-white/10 rounded-xl p-5 open:border-emerald-primary/30 transition-colors"
              >
                <summary className="cursor-pointer text-white font-semibold list-none flex justify-between items-start gap-4">
                  <span>{f.q}</span>
                  <span className="text-emerald-primary text-2xl leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-text-muted mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Premium / Billing Note */}
        <section className="mt-16 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-primary/20">
          <div className="flex items-start gap-4">
            <CreditCard className="w-6 h-6 text-emerald-primary shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">Faturalandırma &amp; Abonelik</h3>
              <p className="text-text-muted text-sm">
                Ödeme işlemleri Apple App Store ve Google Play tarafından yönetilir. İade talepleri için ilgili mağazaya
                başvurmanız gerekir:
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li>
                  <a
                    href="https://reportaproblem.apple.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-primary underline"
                  >
                    Apple — Bir Sorunu Bildir
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.google.com/googleplay/answer/2479637"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-primary underline"
                  >
                    Google Play — İade Talebi
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
