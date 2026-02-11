'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Users, Trophy, Zap, Heart, Shield, Crown, Star, Target, Swords } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'
import PhoneMockup from '@/components/ui/PhoneMockup'

/* ─── Static Data ─── */
const clanFeatures = [
    {
        icon: Trophy,
        title: 'Klan Görevleri',
        desc: 'Birlikte hedeflere ulaşın, adım yarışları ve antrenman mücadeleleri',
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        icon: Zap,
        title: 'Canlı Etkinlikler',
        desc: 'Haftalık turnuvalar, XP ödülleri ve liderlik tablosu',
        gradient: 'from-teal-500 to-cyan-500',
    },
    {
        icon: Heart,
        title: 'Takım Ruhu',
        desc: 'Grup sohbet, motivasyon ve birlikte ilerleme takibi',
        gradient: 'from-cyan-500 to-emerald-500',
    },
]

const clanMembers = [
    { name: 'Efe', level: 42, avatar: '🦁', role: 'Lider' },
    { name: 'Ayşe', level: 38, avatar: '🐺', role: 'Yönetici' },
    { name: 'Mert', level: 35, avatar: '🦅', role: 'Üye' },
    { name: 'Zeynep', level: 31, avatar: '🐉', role: 'Üye' },
]

const clanQuests = [
    { title: 'Haftalık 100K Adım', progress: 72, reward: '500 XP', icon: '🏃' },
    { title: 'Takım Antrenmanı', progress: 45, reward: '300 XP', icon: '💪' },
]

const stats = [
    { value: 100, suffix: 'K+', label: 'Oyuncu' },
    { value: 5000, suffix: '+', label: 'Klan' },
    { value: 50, suffix: '+', label: 'Etkinlik' },
    { value: 98, suffix: '%', label: 'Memnuniyet' },
]

/* ─── Component ─── */
export default function TeamClans() {
    const sectionRef = useRef<HTMLElement>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0))
    const statsAnimated = useRef(false)
    const rafRef = useRef<number>()

    // IntersectionObserver — section visibility
    useEffect(() => {
        const el = sectionRef.current
        if (!el) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(el)
                }
            },
            { threshold: 0.15, rootMargin: '-50px 0px' }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    // Stats counter — single RAF loop
    useEffect(() => {
        if (!isVisible || statsAnimated.current) return
        statsAnimated.current = true

        let startTime: number | null = null
        const duration = 1200

        const tick = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const progress = Math.min(elapsed / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3) // cubic ease-out

            setAnimatedStats(stats.map((s) => Math.round(s.value * ease)))

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(tick)
            }
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
        }
    }, [isVisible])

    return (
        <section
            ref={sectionRef}
            id="ekipler"
            className="relative min-h-screen py-24 lg:py-20 px-6 bg-[#0a0e1a] overflow-hidden flex items-center"
        >
            {/* ─── Background (static gradients + grid) ─── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] opacity-15"
                    style={{
                        background:
                            'radial-gradient(circle at center, rgba(16, 220, 120, 0.35) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="absolute bottom-0 right-0 w-[500px] h-[500px] opacity-10"
                    style={{
                        background:
                            'radial-gradient(circle at center, rgba(6, 182, 212, 0.35) 0%, transparent 70%)',
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(16, 220, 120, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(16, 220, 120, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            <div className="max-w-7xl mx-auto relative w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* ════════════ LEFT — PHONE MOCKUP ════════════ */}
                    <div
                        className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                    >
                        <PhoneMockup>
                            {/* ─── Clan Screen Content ─── */}
                            <div className="relative w-full h-full bg-gradient-to-b from-[#0c1425] to-[#0a0e1a] pt-14 px-3">
                                {/* Clan Header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-lg">
                                        🐺
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-bold text-xs truncate">
                                            Alpha Wolves
                                        </div>
                                        <div className="text-emerald-400 text-[9px] font-medium">
                                            Seviye 12 • 28 Üye
                                        </div>
                                    </div>
                                    <div className="px-2 py-0.5 bg-emerald-500/20 rounded-full">
                                        <span className="text-emerald-400 text-[8px] font-bold">#3</span>
                                    </div>
                                </div>

                                {/* XP Progress */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-[8px] mb-1">
                                        <span className="text-white/40">Klan XP</span>
                                        <span className="text-emerald-400 font-bold">8,450 / 10,000</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 origin-left"
                                            style={{
                                                transform: isVisible ? 'scaleX(0.845)' : 'scaleX(0)',
                                                transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Members */}
                                <div className="mb-3">
                                    <div className="text-[9px] text-white/50 font-medium mb-1.5">
                                        Aktif Üyeler
                                    </div>
                                    <div className="space-y-1">
                                        {clanMembers.map((m, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 p-1.5 bg-white/[0.03] rounded-lg"
                                                style={{
                                                    opacity: isVisible ? 1 : 0,
                                                    transform: isVisible ? 'translateX(0)' : 'translateX(-8px)',
                                                    transition: `all 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.1}s`,
                                                }}
                                            >
                                                <span className="text-base">{m.avatar}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[9px] text-white font-medium truncate">
                                                        {m.name}
                                                    </div>
                                                    <div className="text-[7px] text-white/30">{m.role}</div>
                                                </div>
                                                <div className="text-[8px] text-emerald-400 font-bold">
                                                    Lv.{m.level}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Active Quests */}
                                <div>
                                    <div className="text-[9px] text-white/50 font-medium mb-1.5">
                                        Aktif Görevler
                                    </div>
                                    {clanQuests.map((q, i) => (
                                        <div
                                            key={i}
                                            className="p-2 bg-white/[0.03] rounded-lg mb-1.5 border border-white/5"
                                            style={{
                                                opacity: isVisible ? 1 : 0,
                                                transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                                                transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.6 + i * 0.15}s`,
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs">{q.icon}</span>
                                                    <span className="text-[8px] text-white font-medium">
                                                        {q.title}
                                                    </span>
                                                </div>
                                                <span className="text-[7px] text-emerald-400 font-bold">
                                                    {q.reward}
                                                </span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 origin-left"
                                                    style={{
                                                        transform: isVisible
                                                            ? `scaleX(${q.progress / 100})`
                                                            : 'scaleX(0)',
                                                        transition: `transform 1s cubic-bezier(0.22, 1, 0.36, 1) ${0.8 + i * 0.2}s`,
                                                    }}
                                                />
                                            </div>
                                            <div className="text-right text-[7px] text-white/30 mt-0.5">
                                                %{q.progress}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom Nav */}
                                <div className="absolute bottom-8 left-3 right-3 flex justify-around py-2 bg-white/[0.04] rounded-xl border border-white/5">
                                    {[
                                        { icon: Users, label: 'Üyeler', active: false },
                                        { icon: Shield, label: 'Klan', active: true },
                                        { icon: Swords, label: 'Savaş', active: false },
                                    ].map((nav, i) => (
                                        <div key={i} className="flex flex-col items-center gap-0.5">
                                            <nav.icon
                                                className={`w-3.5 h-3.5 ${nav.active ? 'text-emerald-400' : 'text-white/30'
                                                    }`}
                                            />
                                            <span
                                                className={`text-[7px] font-medium ${nav.active ? 'text-emerald-400' : 'text-white/30'
                                                    }`}
                                            >
                                                {nav.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PhoneMockup>

                        {/* ─── Floating Info Cards (hidden on mobile) ─── */}
                        {/* Left — Active Members */}
                        <div
                            className={`hidden md:flex absolute z-20 bg-[#0f172a]/95 rounded-xl p-3 border border-white/10 items-center gap-2.5 transition-all duration-500 ${isVisible
                                ? 'opacity-100 translate-x-0 scale-100'
                                : 'opacity-0 -translate-x-8 scale-90'
                                }`}
                            style={{ left: '-40px', top: '120px', width: '145px', transitionDelay: '0.5s' }}
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <Users className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <div className="text-sm font-extrabold text-white">1,247</div>
                                <div className="text-[9px] text-white/40">Çevrimiçi</div>
                            </div>
                        </div>

                        {/* Left — Clan Level */}
                        <div
                            className={`hidden md:flex absolute z-20 bg-[#0f172a]/95 rounded-xl p-3 border border-white/10 items-center gap-2.5 transition-all duration-500 ${isVisible
                                ? 'opacity-100 translate-x-0 scale-100'
                                : 'opacity-0 -translate-x-8 scale-90'
                                }`}
                            style={{ left: '-30px', top: '230px', width: '140px', transitionDelay: '0.65s' }}
                        >
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                                <Crown className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                                <div className="text-sm font-extrabold text-white">Lv.12</div>
                                <div className="text-[9px] text-white/40">Klan Seviyesi</div>
                            </div>
                        </div>

                        {/* Right — Weekly Rank */}
                        <div
                            className={`hidden md:flex absolute z-20 bg-[#0f172a]/95 rounded-xl p-3 border border-white/10 items-center gap-2.5 transition-all duration-500 ${isVisible
                                ? 'opacity-100 translate-x-0 scale-100'
                                : 'opacity-0 translate-x-8 scale-90'
                                }`}
                            style={{ right: '-35px', top: '140px', width: '140px', transitionDelay: '0.6s' }}
                        >
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Star className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <div className="text-sm font-extrabold text-white">#3</div>
                                <div className="text-[9px] text-white/40">Haftalık Sıra</div>
                            </div>
                        </div>

                        {/* Right — XP Earned */}
                        <div
                            className={`hidden md:flex absolute z-20 bg-[#0f172a]/95 rounded-xl p-3 border border-white/10 items-center gap-2.5 transition-all duration-500 ${isVisible
                                ? 'opacity-100 translate-x-0 scale-100'
                                : 'opacity-0 translate-x-8 scale-90'
                                }`}
                            style={{ right: '-25px', top: '250px', width: '140px', transitionDelay: '0.75s' }}
                        >
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <Target className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                                <div className="text-sm font-extrabold text-white">8,450</div>
                                <div className="text-[9px] text-white/40">Toplam XP</div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        <div
                            className={`absolute -top-3 -left-2 lg:left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-[0_0_20px_rgba(16,220,120,0.3)] flex items-center gap-1.5 z-10 animate-bounce-slow transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            <Shield className="w-3.5 h-3.5" />
                            Clan Wars
                        </div>
                    </div>

                    {/* ════════════ RIGHT — CONTENT ════════════ */}
                    <div
                        className={`relative lg:order-last transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                            }`}
                        style={{ transitionDelay: '0.15s' }}
                    >
                        <SectionHeader
                            icon={<Users className="w-4 h-4" />}
                            badge="Ekipler"
                            title={<>Klanını Kur,{' '}<span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Ekibini Zirveye Taşı</span></>}
                            description={<>Arkadaşlarınla ekipler kur, görevleri tamamla, etkinliklere katıl. Birlikte antrenman yap, birbirini motive et. Takım ruhuyla liderlik tablosunda yüksel, zirve sizin olsun.</>}
                        />

                        {/* Feature Cards */}
                        <div className="space-y-3 mb-8">
                            {clanFeatures.map((item, i) => (
                                <div
                                    key={i}
                                    className="group flex gap-3 items-center p-3 bg-white/[0.03] border border-white/5 rounded-xl transition-all duration-300 cursor-pointer clan-card"
                                    style={{
                                        opacity: isVisible ? 1 : 0,
                                        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                                        transition: `opacity 0.5s ease ${0.3 + i * 0.12}s, transform 0.5s ease ${0.3 + i * 0.12}s`,
                                    }}
                                >
                                    <div
                                        className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}
                                    >
                                        <item.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white text-sm mb-0.5 group-hover:text-emerald-400 transition-colors duration-300">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-white/50">{item.desc}</div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                                        <svg
                                            className="w-4 h-4 text-white/60"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Stats Row — 2x2 on mobile, 4-col on desktop */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.map((stat, i) => (
                                <div
                                    key={i}
                                    className="relative group text-center p-3 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl overflow-hidden clan-stat-card"
                                    style={{
                                        opacity: isVisible ? 1 : 0,
                                        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
                                        transition: `opacity 0.5s ease ${0.5 + i * 0.1}s, transform 0.5s ease ${0.5 + i * 0.1}s`,
                                    }}
                                >
                                    {/* Hover glow — pseudo-element via border color */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="relative">
                                        <div className="text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                            {animatedStats[i]}
                                            {stat.suffix}
                                        </div>
                                        <div className="text-[10px] text-white/40 mt-0.5 font-medium">
                                            {stat.label}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Scoped styles */}
            <style jsx>{`
        .clan-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(16, 220, 120, 0.3);
          transform: translateX(4px);
        }
        .clan-stat-card:hover {
          border-color: rgba(16, 220, 120, 0.3);
          transform: scale(1.05);
        }
        .clan-card,
        .clan-stat-card {
          will-change: transform;
        }
      `}</style>
        </section>
    )
}
