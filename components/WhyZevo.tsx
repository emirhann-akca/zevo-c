'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, Trophy, Zap, Activity, ChevronRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const FEATURES = [
    {
        id: '01',
        title: 'Veri Odaklı Analiz',
        desc: 'Sıradan antrenmanları geride bırakın. Zevo\'nun yapay zekası, vücut hareketlerinizi milisaniyeler içinde tarar, duruş bozukluklarını tespit eder ve sakatlık riskini %90\'a kadar azaltır.',
        icon: Activity,
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        borderColor: 'border-blue-500/50',
        glow: 'shadow-[0_0_50px_-10px_rgba(59,130,246,0.5)]'
    },
    {
        id: '02',
        title: 'Global Spor Ağı',
        desc: 'Yetenekleriniz keşfedilmeyi bekliyor. Zevo ile performans verileriniz dijital bir kimliğe dönüşür. Kulüpler, scoutlar ve diğer sporcularla etkileşime geçin, kariyerinize yön verin.',
        icon: Users,
        color: 'text-purple-400',
        bg: 'bg-purple-500/20',
        borderColor: 'border-purple-500/50',
        glow: 'shadow-[0_0_50px_-10px_rgba(168,85,247,0.5)]'
    },
    {
        id: '03',
        title: 'Rekabetçi Ligler',
        desc: 'Antrenman yapmak hiç bu kadar eğlenceli olmamıştı. Her kalori bir puan, her set bir zafer. Arkadaşlarınızla kapışın, liglerde yükselin ve gerçek ödüller kazanın.',
        icon: Trophy,
        color: 'text-amber-400',
        bg: 'bg-amber-500/20',
        borderColor: 'border-amber-500/50',
        glow: 'shadow-[0_0_50px_-10px_rgba(251,191,36,0.5)]'
    }
]

export default function WhyZevo() {
    const [activeFeature, setActiveFeature] = useState(0)
    const observerRef = useRef<IntersectionObserver | null>(null)

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger)

        const ctx = gsap.context(() => {
            // Header Animation
            gsap.from('.why-header > *', {
                y: 50,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.why-header',
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            })

            // Phone Container Animation
            gsap.from('.why-phone', {
                x: -50,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.why-phone',
                    start: 'top 80%',
                }
            })

            // Feature List Animation
            gsap.to('.feature-item-wrapper', {
                x: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.3,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.why-content',
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                }
            })


        })

        return () => ctx.revert()
    }, [])

    useEffect(() => {
        // Simple Intersection Observer implementation for better reliability than ScrollTrigger in this case
        const options = {
            root: null,
            rootMargin: '-45% 0px -45% 0px', // Center of viewport
            threshold: 0
        }

        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = Number(entry.target.getAttribute('data-id'))
                    setActiveFeature(id)
                }
            })
        }, options)

        document.querySelectorAll('.feature-section').forEach((el) => {
            observerRef.current?.observe(el)
        })

        return () => {
            observerRef.current?.disconnect()
        }
    }, [])

    return (
        <section
            className="relative py-24 lg:py-40 overflow-x-clip bg-[#0a0e1a]"
        >
            {/* Sadece ortaya subtle glow - geçişler belli olmaz */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
                        filter: 'blur(80px)'
                    }}
                />
            </div>
            <div className="max-w-7xl mx-auto px-6">

                {/* Section Header */}
                <div className="text-center mb-32 why-header">
                    <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold tracking-wider text-sm mb-6 animate-pulse">
                        GELECEĞİ ŞEKİLLENDİR
                    </span>
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8">
                        NEDEN <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">ZEVO?</span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Teknoloji ve sporun mükemmel uyumu. Sadece bir uygulama değil,
                        sizi profesyonel seviyeye taşıyacak bir platform.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-20">

                    {/* LEFT: Sticky Phone Container */}
                    <div className="w-full lg:w-1/2 relative why-phone">
                        <div className="lg:sticky lg:top-24 w-full flex justify-center items-center perspective-1000">

                            {/* Phone Mockup */}
                            <div className={`relative w-[320px] h-[640px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-700 transform ${activeFeature === 0 ? 'rotate-y-2' : activeFeature === 1 ? '-rotate-y-2' : 'rotate-y-0'}`}>

                                {/* Top Notch */}
                                <div className="absolute top-0 inset-x-0 h-8 bg-slate-800 rounded-b-2xl w-40 mx-auto z-50"></div>

                                {/* Dynamic Content Screen */}
                                <div className="absolute inset-0 bg-[#0f172a] p-8 flex flex-col pt-16">

                                    {/* Grid background */}
                                    <div className="absolute inset-0 z-0 opacity-20"
                                        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                                    </div>

                                    {/* Animated Content Layers */}
                                    <div className="relative z-10 h-full">

                                        {/* FEATURE 1: DATA */}
                                        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${activeFeature === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                                            <div className="w-32 h-32 rounded-full bg-blue-500/20 flex items-center justify-center mb-8 relative">
                                                <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-30"></div>
                                                <Activity className="w-16 h-16 text-blue-400" />
                                            </div>
                                            <div className="w-full bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-gray-400 text-sm">Analiz Skoru</span>
                                                    <span className="text-blue-400 font-bold">98/100</span>
                                                </div>
                                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full w-[98%] bg-blue-500"></div>
                                                </div>
                                                <div className="mt-4 flex gap-2">
                                                    <div className="h-20 w-8 bg-blue-500/20 rounded-md col-span-1 relative overflow-hidden"><div className="absolute bottom-0 w-full h-[40%] bg-blue-500"></div></div>
                                                    <div className="h-20 w-8 bg-blue-500/20 rounded-md col-span-1 relative overflow-hidden"><div className="absolute bottom-0 w-full h-[70%] bg-blue-500"></div></div>
                                                    <div className="h-20 w-8 bg-blue-500/20 rounded-md col-span-1 relative overflow-hidden"><div className="absolute bottom-0 w-full h-[50%] bg-blue-500"></div></div>
                                                    <div className="h-20 w-8 bg-blue-500/20 rounded-md col-span-1 relative overflow-hidden"><div className="absolute bottom-0 w-full h-[80%] bg-blue-500"></div></div>
                                                    <div className="h-20 w-8 bg-blue-500/20 rounded-md col-span-1 relative overflow-hidden"><div className="absolute bottom-0 w-full h-[90%] bg-blue-500"></div></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* FEATURE 2: SOCIAL */}
                                        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${activeFeature === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                                            <div className="w-24 h-24 rounded-full border-4 border-purple-500 p-1 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                                                <div className="w-full h-full bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                                                    <Users className="w-10 h-10 text-white" />
                                                </div>
                                            </div>
                                            <h3 className="text-white text-xl font-bold mb-1">Emirhan Akça</h3>
                                            <p className="text-purple-400 text-sm mb-6">@profesyonel_sporcu</p>

                                            <div className="grid grid-cols-2 gap-4 w-full">
                                                <div className="bg-slate-800/80 p-4 rounded-xl text-center border border-purple-500/20">
                                                    <div className="text-2xl font-bold text-white">12.5K</div>
                                                    <div className="text-xs text-gray-400">Takipçi</div>
                                                </div>
                                                <div className="bg-slate-800/80 p-4 rounded-xl text-center border border-purple-500/20">
                                                    <div className="text-2xl font-bold text-white">8</div>
                                                    <div className="text-xs text-gray-400">Kulüp Teklifi</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* FEATURE 3: GAMIFICATION */}
                                        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ${activeFeature === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                                            <Trophy className="w-32 h-32 text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-bounce duration-1000" />
                                            <div className="text-center mt-6">
                                                <h3 className="text-3xl font-black text-white tracking-widest uppercase">KAZANDIN!</h3>
                                                <div className="inline-block mt-4 px-6 py-2 bg-amber-500 text-black font-bold rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                                                    +500 XP
                                                </div>
                                            </div>
                                            <div className="mt-8 w-full bg-slate-800/50 p-4 rounded-2xl border border-amber-500/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-500">1</div>
                                                    <div className="flex-1">
                                                        <div className="text-white font-bold">Haftanın Lideri</div>
                                                        <div className="text-xs text-amber-400">Şampiyonlar Ligi</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Content Text */}
                    <div className="w-full lg:w-1/2 pt-10 pb-64 min-h-screen why-content">
                        {FEATURES.map((feature, index) => (
                            <div key={index} className="feature-item-wrapper opacity-0 translate-x-[50px] feature-item">
                                <div
                                    data-id={index}
                                    className={`feature-section min-h-[50vh] flex flex-col justify-center transition-all duration-700 ${activeFeature === index ? 'opacity-100 translate-x-0' : 'opacity-30 lg:opacity-20 translate-x-10 scale-95 blur-sm'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl mb-8 flex items-center justify-center ${feature.bg} ${feature.glow} border ${feature.borderColor}`}>
                                        <feature.icon className={`w-8 h-8 ${feature.color}`} />
                                    </div>

                                    <h3 className={`text-4xl lg:text-5xl font-bold mb-6 text-white transition-all duration-500 ${activeFeature === index ? 'drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]' : ''}`}>
                                        {feature.title}
                                    </h3>

                                    <p className="text-lg lg:text-xl text-gray-400 leading-relaxed font-light border-l-4 border-slate-700 pl-6">
                                        {feature.desc}
                                    </p>

                                    <div className={`mt-8 flex items-center gap-2 font-bold ${feature.color} opacity-0 transition-all duration-500 ${activeFeature === index ? 'opacity-100 translate-x-0' : '-translate-x-4'}`}>
                                        <span>Detaylı İncele</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
