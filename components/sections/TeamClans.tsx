'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, Trophy, Zap, Heart, Shield, Swords } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'
import PhoneMockup from '@/components/ui/PhoneMockup'
import { useLanguage } from '@/lib/i18n/LanguageContext'

/* ─── Static Data ─── */
const FEATURE_CONFIGS = [
    {
        icon: Trophy,
        iconColor: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        shadowClass: 'group-hover:shadow-[0_8px_20px_-4px_rgba(52,211,153,0.3)]'
    },
    {
        icon: Zap,
        iconColor: 'text-teal-400',
        bgColor: 'bg-teal-500/10',
        borderColor: 'border-teal-500/20',
        shadowClass: 'group-hover:shadow-[0_8px_20px_-4px_rgba(45,212,191,0.3)]'
    },
    {
        icon: Heart,
        iconColor: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20',
        shadowClass: 'group-hover:shadow-[0_8px_20px_-4px_rgba(34,211,238,0.3)]'
    },
]

const MEMBER_AVATARS = [
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
]
const MEMBER_NAMES = ['Efe', 'Ayşe', 'Mert', 'Zeynep']
const MEMBER_LEVELS = [42, 38, 35, 31]

const QUEST_PROGRESS = [72, 45]
const QUEST_REWARDS = ['500 XP', '300 XP']
const QUEST_ICONS = ['🏃', '💪']


/* ─── Component ─── */
export default function TeamClans() {
    const { t } = useLanguage()
    const sectionRef = useRef<HTMLElement>(null)
    const [isVisible, setIsVisible] = useState(false)
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


    return (
        <section
            ref={sectionRef}
            id="ekipler"
            className="relative min-h-0 lg:min-h-screen py-24 lg:py-20 px-6 bg-[#0a0e1a] overflow-hidden flex items-start lg:items-center"
        >
            {/* ─── Background (Static Efficient Gradients) ─── */}
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
                        className={`relative hidden lg:block transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                    >
                        <PhoneMockup>
                            {/* ─── Clan Screen Content ─── */}
                            <div className="relative w-full h-full bg-[#0a0e1a] pt-14 px-3 flex flex-col">
                                {/* Clan Header */}
                                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl">
                                        🐺
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-bold text-sm truncate">
                                            Alpha Wolves
                                        </div>
                                        <div className="text-emerald-400 text-[10px] font-medium">
                                            {t.teamClans.phone.clanLevel}
                                        </div>
                                    </div>
                                    <div className="px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                        <span className="text-emerald-400 text-[9px] font-bold">#3</span>
                                    </div>
                                </div>

                                {/* XP Progress */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-[9px] mb-1.5 px-1">
                                        <span className="text-white/40">{t.teamClans.phone.clanXP}</span>
                                        <span className="text-emerald-400 font-bold">8,450 / 10,000</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
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
                                <div className="mb-4 flex-1">
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 px-1">
                                        {t.teamClans.phone.activeMembers}
                                    </div>
                                    <div className="space-y-1.5">
                                        {MEMBER_NAMES.map((name, i) => {
                                            const roles = [t.teamClans.phone.roles.leader, t.teamClans.phone.roles.admin, t.teamClans.phone.roles.member, t.teamClans.phone.roles.member]
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors"
                                                    style={{
                                                        opacity: isVisible ? 1 : 0,
                                                        transform: isVisible ? 'translateX(0)' : 'translateX(-8px)',
                                                        transition: `all 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${0.3 + i * 0.1}s`,
                                                    }}
                                                >
                                                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                                        <img src={MEMBER_AVATARS[i]} alt={name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[10px] text-white font-medium truncate">
                                                            {name}
                                                        </div>
                                                        <div className="text-[8px] text-white/30">{roles[i]}</div>
                                                    </div>
                                                    <div className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-center">
                                                        Lv.{MEMBER_LEVELS[i]}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Active Quests */}
                                <div className="mb-20">
                                    <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-2 px-1">
                                        {t.teamClans.phone.activeQuests}
                                    </div>
                                    {t.teamClans.phone.quests.map((q, i) => (
                                        <div
                                            key={i}
                                            className="p-3 bg-white/[0.02] rounded-xl mb-2 border border-white/5"
                                            style={{
                                                opacity: isVisible ? 1 : 0,
                                                transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                                                transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.6 + i * 0.15}s`,
                                            }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{QUEST_ICONS[i]}</span>
                                                    <span className="text-[9px] text-white font-medium">
                                                        {q.title}
                                                    </span>
                                                </div>
                                                <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                    {QUEST_REWARDS[i]}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 origin-left"
                                                    style={{
                                                        transform: isVisible
                                                            ? `scaleX(${QUEST_PROGRESS[i] / 100})`
                                                            : 'scaleX(0)',
                                                        transition: `transform 1s cubic-bezier(0.22, 1, 0.36, 1) ${0.8 + i * 0.2}s`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bottom Nav */}
                                <div className="absolute bottom-6 left-3 right-3 flex justify-around py-3 bg-[#0f172a] rounded-2xl border border-white/10 shadow-lg z-10">
                                    {[
                                        { icon: Users, label: t.teamClans.phone.nav.members, active: false },
                                        { icon: Shield, label: t.teamClans.phone.nav.clan, active: true },
                                        { icon: Swords, label: t.teamClans.phone.nav.war, active: false },
                                    ].map((nav, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 group cursor-pointer">
                                            <nav.icon
                                                className={`w-4 h-4 transition-colors ${nav.active ? 'text-emerald-400' : 'text-white/30 group-hover:text-white/50'
                                                    }`}
                                            />
                                            <span
                                                className={`text-[8px] font-medium transition-colors ${nav.active ? 'text-emerald-400' : 'text-white/30 group-hover:text-white/50'
                                                    }`}
                                            >
                                                {nav.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PhoneMockup>
                    </div>

                    {/* ════════════ RIGHT — CONTENT ════════════ */}
                    <div
                        className={`relative lg:order-last pl-4 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                            }`}
                        style={{ transitionDelay: '0.15s' }}
                    >
                        <SectionHeader
                            icon={<Users className="w-4 h-4" />}
                            badge={t.teamClans.badge}
                            title={<>{t.teamClans.title}{' '}<span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">{t.teamClans.titleHighlight}</span></>}
                            description={<>{t.teamClans.description}</>}
                            align='left'
                            className="mb-8"
                        />

                        {/* Feature Cards - AICoach/VisionNutrition Style */}
                        <div className="space-y-4 mb-10">
                            {FEATURE_CONFIGS.map((item, i) => {
                                const feat = t.teamClans.features[i]
                                return (
                                    <div key={i} className="flex items-center gap-4 group cursor-default">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bgColor} border ${item.borderColor} transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${item.shadowClass} flex-shrink-0`}>
                                            <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                                        </div>
                                        <div>
                                            <p className={`text-base font-bold text-white group-hover:${item.iconColor} transition-colors`}>{feat.title}</p>
                                            <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    )
}
