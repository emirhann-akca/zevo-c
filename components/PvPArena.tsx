'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ================================
// PVP ARENA SECTION - Codeway Style
// Tek viewport, iki kolon layout
// ================================

const LEADERBOARD = [
  { rank: '🥇', name: 'Ahmet Y.', score: 2450 },
  { rank: '🥈', name: 'Elif K.', score: 2280 },
  { rank: '🥉', name: 'Mert D.', score: 2115 },
]

const FEATURE_CHIPS = [
  { emoji: '⚡', label: 'Hız Düellosu' },
  { emoji: '🔥', label: 'Kalori Yarışı' },
  { emoji: '👥', label: 'Takım Savaşı' },
]

export default function PvPArena() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const floatingCardsRef = useRef<HTMLDivElement>(null)
  const [scores, setScores] = useState([0, 0, 0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    gsap.registerPlugin(ScrollTrigger)

    const timer = setTimeout(() => {
      if (!sectionRef.current) return

      const ctx = gsap.context(() => {
        // Sol kolon staggered fade-in
        if (leftColRef.current?.children) {
          gsap.fromTo(
            leftColRef.current.children,
            { opacity: 0, x: -30 },
            {
              opacity: 1,
              x: 0,
              stagger: 0.12,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
            }
          )
        }

        // Telefon fade-in
        gsap.fromTo(
          phoneRef.current,
          { opacity: 0, x: 50, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        )

        // Floating cards
        if (floatingCardsRef.current?.children) {
          gsap.fromTo(
            floatingCardsRef.current.children,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.15,
              duration: 0.5,
              delay: 0.4,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 65%',
                toggleActions: 'play none none reverse',
              },
            }
          )
        }

        // Score count-up
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 70%',
          onEnter: () => {
            LEADERBOARD.forEach((item, i) => {
              gsap.to({}, {
                duration: 1.5,
                onUpdate: function () {
                  const progress = this.progress()
                  setScores(prev => {
                    const newScores = [...prev]
                    newScores[i] = Math.floor(item.score * progress)
                    return newScores
                  })
                },
              })
            })
          },
        })
      }, sectionRef)

      return () => ctx.revert()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return <div className="h-screen bg-[#0a0e1a]" />
  }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen bg-[#0a0e1a] py-16 md:py-20 overflow-hidden"
    >
      {/* Sadece ortaya subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(34, 197, 94, 0.06) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ================================
              SOL KOLON - %45
              ================================ */}
          <div ref={leftColRef} className="w-full lg:w-[45%] space-y-6">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10">
              <span className="text-base">⚔️</span>
              <span className="text-sm font-semibold text-[#22c55e]">PVP ARENA</span>
            </div>

            {/* Başlık */}
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.1] mb-2">
                Gerçek Rakip.
              </h2>
              <h2 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold leading-[1.1]">
                <span className="bg-gradient-to-r from-[#22c55e] to-[#f59e0b] bg-clip-text text-transparent">
                  Gerçek Zamanlı.
                </span>
              </h2>
            </div>

            {/* Açıklama */}
            <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-md">
              Arkadaşlarınla yarış, liderlik tablosunda yüksel. Hız düellosu, kalori yarışı
              veya takım savaşı — sen seç.
            </p>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-3">
              {FEATURE_CHIPS.map((chip) => (
                <div
                  key={chip.label}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm"
                >
                  <span>{chip.emoji}</span>
                  <span className="text-white/80 font-medium">{chip.label}</span>
                </div>
              ))}
            </div>

            {/* Mini Leaderboard */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 max-w-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Liderlik Tablosu</p>
              <div className="space-y-2">
                {LEADERBOARD.map((player, i) => (
                  <div
                    key={player.name}
                    className={`flex items-center justify-between py-2 px-3 rounded-lg ${i === 0 ? 'bg-[#22c55e]/10 border border-[#22c55e]/20' : 'bg-white/[0.02]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{player.rank}</span>
                      <span className="text-white text-sm font-medium">{player.name}</span>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${i === 0 ? 'text-[#22c55e]' : 'text-gray-400'}`}>
                      {scores[i].toLocaleString()} puan
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================================
              SAĞ KOLON - %55 - Telefon Mockup
              ================================ */}
          <div className="w-full lg:w-[55%] flex justify-center relative">

            {/* Floating Cards */}
            <div ref={floatingCardsRef} className="absolute inset-0 pointer-events-none hidden md:block">
              {/* Üst sağ kart */}
              <div
                className="absolute -top-4 -right-4 lg:right-8 px-4 py-3 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/[0.1]"
                style={{ animation: 'floatCard 4s ease-in-out infinite' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏆</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Düello Kazandın!</p>
                    <p className="text-[#22c55e] text-xs font-bold">+150 puan</p>
                  </div>
                </div>
              </div>

              {/* Alt sol kart */}
              <div
                className="absolute -bottom-4 -left-4 lg:left-0 px-4 py-3 rounded-xl bg-white/[0.05] backdrop-blur-md border border-white/[0.1]"
                style={{ animation: 'floatCard 4.5s ease-in-out infinite', animationDelay: '1s' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <div>
                    <p className="text-white text-sm font-semibold">3 Maç Serisi!</p>
                    <p className="text-orange-400 text-xs font-bold">Rakipsizsin</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Telefon */}
            <div
              ref={phoneRef}
              className="relative"
              style={{
                transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
              }}
            >
              {/* Glow */}
              <div
                className="absolute inset-0 -z-10"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.15) 0%, transparent 60%)',
                  filter: 'blur(40px)',
                  transform: 'scale(1.3)',
                }}
              />

              {/* Telefon Frame */}
              <div
                className="relative bg-[#1a1a2e] rounded-[44px] p-2"
                style={{ width: 280, height: 580 }}
              >
                {/* Notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-10" />

                {/* Ekran içeriği */}
                <div className="bg-[#0d1117] w-full h-full rounded-[36px] overflow-hidden flex flex-col">

                  {/* Status Bar */}
                  <div className="flex justify-between items-center px-5 pt-8 pb-2">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 border border-white/60 rounded-sm">
                        <div className="w-3 h-1.5 bg-green-500 rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Green Header */}
                  <div className="bg-gradient-to-r from-green-600 to-green-500 mx-3 rounded-xl px-4 py-2.5 flex justify-between items-center">
                    <div>
                      <p className="text-white/70 text-[9px] font-medium">CANLI MAÇ</p>
                      <p className="text-white text-sm font-bold">PvP Arena</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-white text-[9px] font-bold">LIVE</span>
                    </div>
                  </div>

                  {/* VS Section */}
                  <div className="flex items-center justify-center gap-6 py-5 px-4">
                    {/* Sen */}
                    <div className="text-center">
                      <div className="w-11 h-11 rounded-full border-2 border-green-500 bg-green-500/20 flex items-center justify-center mb-1">
                        <span className="text-white text-base font-bold">S</span>
                      </div>
                      <p className="text-white text-[10px]">Sen</p>
                      <p className="text-green-400 text-xl font-bold">12</p>
                    </div>

                    {/* VS */}
                    <div className="text-white/30 text-base font-bold">VS</div>

                    {/* Rakip */}
                    <div className="text-center">
                      <div className="w-11 h-11 rounded-full border-2 border-gray-600 bg-gray-600/20 flex items-center justify-center mb-1">
                        <span className="text-white text-base font-bold">R</span>
                      </div>
                      <p className="text-white text-[10px]">Rakip</p>
                      <p className="text-white/70 text-xl font-bold">11</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="px-4 mb-2">
                    <div className="flex justify-between text-[9px] text-white/50 mb-1">
                      <span>İlerleme</span>
                      <span>%75</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex justify-around px-3 py-2.5 border-t border-white/5">
                    <div className="text-center">
                      <p className="text-white/40 text-[8px]">SÜRE</p>
                      <p className="text-white text-[11px] font-bold">02:34</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/40 text-[8px]">KALORİ</p>
                      <p className="text-green-400 text-[11px] font-bold">156</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/40 text-[8px]">HIZ</p>
                      <p className="text-white text-[11px] font-bold">8.2</p>
                    </div>
                  </div>

                  {/* Mini Activity */}
                  <div className="flex-1 flex items-center justify-center px-3 pb-3">
                    <div className="w-full h-full bg-white/[0.02] rounded-xl border border-white/5 flex items-center justify-center gap-3">
                      {/* Skeleton dots */}
                      <div className="relative w-12 h-16">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full" />
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-500/80 rounded-full" />
                        <div className="absolute top-3 left-0 w-1.5 h-1.5 bg-green-500/60 rounded-full" />
                        <div className="absolute top-3 right-0 w-1.5 h-1.5 bg-green-500/60 rounded-full" />
                        <div className="absolute top-7 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-500/80 rounded-full" />
                        <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-green-500/60 rounded-full" />
                        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-green-500/60 rounded-full" />
                      </div>
                      <p className="text-white/20 text-[8px]">Hareket Analizi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  )
}
