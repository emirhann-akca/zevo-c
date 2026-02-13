'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { Play, ChevronDown, ChevronRight, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TechBackground from '@/components/effects/TechBackground'
import ComingSoonButton from '@/components/ui/ComingSoonButton'

// ================================
// CODEWAY-STYLE HERO SECTION
// ================================

const STATS = [
    { value: '2.5K+', label: 'Aktif Sporcu' },
    { value: '12', label: 'Kulüp' },
    { value: '%42', label: 'Gelişim Artışı' },
]

export default function HeroSection() {
    const wrapperRef = useRef<HTMLDivElement>(null)
    const pinnedRef = useRef<HTMLDivElement>(null)
    const videoBoxRef = useRef<HTMLDivElement>(null)
    const introOverlayRef = useRef<HTMLDivElement>(null)
    const phoneBorderRef = useRef<HTMLDivElement>(null)
    const contentLeftRef = useRef<HTMLDivElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)



    const [ready, setReady] = useState(false)

    useEffect(() => {
        setReady(true)
        gsap.registerPlugin(ScrollTrigger)

        const timer = setTimeout(() => {
            if (!wrapperRef.current || !videoBoxRef.current) return

            const ctx = gsap.context(() => {
                const mm = gsap.matchMedia()

                mm.add('(min-width: 768px)', () => {
                    // Başlangıç durumları
                    gsap.set(phoneBorderRef.current, { autoAlpha: 0, scale: 1.05 })
                    gsap.set(contentLeftRef.current, { autoAlpha: 0, x: -40 })
                    gsap.set(glowRef.current, { autoAlpha: 0, scale: 0.5 })


                    // Ana timeline
                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: wrapperRef.current,
                            start: 'top top',
                            end: 'bottom bottom',
                            scrub: 1.2,
                            // Pin yok - wrapper height ile kontrol
                        },
                    })

                    // FAZ 1: Intro fade out (0-10%)
                    tl.to(introOverlayRef.current, {
                        autoAlpha: 0,
                        duration: 0.1,
                    }, 0)

                    // FAZ 2: Video küçülme (0-40%)
                    tl.to(videoBoxRef.current, {
                        width: 300,
                        height: 600,
                        borderRadius: 44,
                        duration: 0.4,
                        ease: 'power2.inOut',
                    }, 0)

                    // Telefon çerçevesi
                    tl.to(phoneBorderRef.current, {
                        autoAlpha: 1,
                        scale: 1,
                        duration: 0.2,
                    }, 0.2)

                    // Glow efekti başlangıcı (zayıf)
                    tl.to(glowRef.current, {
                        autoAlpha: 0.4,
                        scale: 1,
                        duration: 0.3
                    }, 0.2)

                    // FAZ 3: Sağa kayma (40-60%)
                    tl.to(videoBoxRef.current, {
                        x: () => window.innerWidth * 0.18,
                        duration: 0.2,
                        ease: 'power2.inOut',
                    }, 0.4)

                    // Glow da telefonla birlikte kayıyor ama biraz daha genişliyor (WOW EFEKTİ)
                    tl.to(glowRef.current, {
                        x: () => window.innerWidth * 0.18,
                        scale: 1.5,
                        autoAlpha: 0.8, // Daha parlak
                        duration: 0.2,
                        ease: 'power2.inOut',
                    }, 0.4)

                    // FAZ 4: Sol içerik (55-85%)
                    tl.to(contentLeftRef.current, {
                        autoAlpha: 1,
                        x: 0,
                        duration: 0.15,
                    }, 0.55)

                    if (contentLeftRef.current?.children) {
                        tl.fromTo(
                            contentLeftRef.current.children,
                            { y: 40, opacity: 0 },
                            { y: 0, opacity: 1, stagger: 0.03, duration: 0.15 },
                            0.58
                        )
                    }
                })

                // Mobil
                mm.add('(max-width: 767px)', () => {
                    gsap.set(videoBoxRef.current, {
                        width: 260,
                        height: 520,
                        borderRadius: 36,
                        x: 0,
                    })
                    gsap.set(introOverlayRef.current, { autoAlpha: 0 })
                    gsap.set(phoneBorderRef.current, { autoAlpha: 1, scale: 1 })
                    gsap.set(contentLeftRef.current, { autoAlpha: 1, x: 0 })
                    gsap.set(glowRef.current, { autoAlpha: 0.5, scale: 1 }) // Mobilde sabit glow
                })
            }, wrapperRef)

            return () => ctx.revert()
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    if (!ready) {
        return <div className="h-[300vh] bg-[#0a0e1a]" />
    }

    return (
        <div id="performans" ref={wrapperRef} className="relative bg-[#0a0e1a]" style={{ height: '300vh' }}>
            {/* Sabit kalan içerik */}
            <div
                ref={pinnedRef}
                className="sticky top-0 h-screen w-full overflow-hidden"
            >
                {/* Arka plan */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1829] to-[#0a0e1a]" />

                {/* TEKNOLOJİK EFEKTLER: Pixel Rain & Circuits */}
                <TechBackground />

                {/* YENİ: ANA GLOW EFEKTİ (Telefun arkasında hareket edecek) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        ref={glowRef}
                        className="w-[320px] h-[500px] intense-glow rounded-full opacity-0"
                    />
                </div>

                {/* VIDEO BOX */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        ref={videoBoxRef}
                        className="relative overflow-hidden pointer-events-auto"
                        style={{
                            width: '100vw',
                            height: '100vh',
                            borderRadius: 0,
                        }}
                    >
                        {/* Gradient BG */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `
                  radial-gradient(ellipse at 30% 30%, rgba(16, 220, 120, 0.35) 0%, transparent 50%),
                  radial-gradient(ellipse at 70% 70%, rgba(14, 169, 104, 0.25) 0%, transparent 50%),
                  linear-gradient(180deg, #0d1829 0%, #0a1628 50%, #071018 100%)
                `,
                                backgroundSize: '200% 200%',
                                animation: 'bgPulse 10s ease-in-out infinite',
                            }}
                        />

                        {/* Play button */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center mb-5 cursor-pointer hover:bg-white/20 transition-all">
                                <Play className="w-8 h-8 text-white ml-1" fill="white" fillOpacity={0.85} />
                            </div>
                            <span className="text-white/50 text-sm tracking-[0.25em] uppercase">Demo</span>
                        </div>

                        {/* INTRO OVERLAY */}
                        <div
                            ref={introOverlayRef}
                            className="absolute inset-0 z-20 bg-black/45 flex flex-col items-center justify-center"
                        >
                            <div className="text-center px-6 mb-20">
                                <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none">
                                    Sporun
                                    <br />
                                    <span className="bg-gradient-to-r from-[#22c55e] to-[#10DC78] bg-clip-text text-transparent">
                                        Geleceği
                                    </span>
                                </h1>
                                <p className="text-xl md:text-2xl text-white/60 font-light max-w-lg mx-auto">
                                    Yapay zeka ile performansını ölç ve geliştir.
                                </p>
                            </div>

                            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                <span className="text-white/40 text-sm">Kaydır</span>
                                <ChevronDown className="w-5 h-5 text-white/40 animate-bounce" />
                            </div>
                        </div>

                        {/* Telefon çerçevesi */}
                        <div
                            ref={phoneBorderRef}
                            className="absolute inset-0 z-30 pointer-events-none"
                            style={{ opacity: 0 }}
                        >
                            <div className="absolute inset-0 rounded-[48px] border-[10px] border-[#1c1c2e]">
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full" />
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/15 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>



                {/* SOL İÇERİK */}
                <div
                    ref={contentLeftRef}
                    className="absolute z-40 left-[10%] md:left-[15%] top-1/2 -translate-y-1/2 max-w-lg"
                    style={{ opacity: 0 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 mb-7">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                        <span className="text-sm font-semibold text-[#22c55e]">AI-Powered</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-2 leading-[1.05]">
                        Antrenörün
                    </h1>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-7 leading-[1.05]">
                        <span className="bg-gradient-to-r from-[#22c55e] to-[#10DC78] bg-clip-text text-transparent">
                            Cebinde
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 mb-9 leading-relaxed max-w-md">
                        Antrenmanını ölç, analiz et, geliştir
                        <br />
                        hepsi tek uygulamada.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-7">
                        <ComingSoonButton
                            className="px-8 py-4 bg-gradient-to-r from-[#22c55e] to-[#10DC78] text-black font-bold rounded-2xl flex items-center justify-center hover:shadow-xl hover:shadow-emerald-500/20 transition-all min-w-[200px]"
                        >
                            <div className="flex items-center gap-2 whitespace-nowrap">
                                Şimdi Başla
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </ComingSoonButton>
                        <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl flex items-center gap-2 justify-center hover:bg-white/10 transition-all">
                            <Play className="w-5 h-5" />
                            Demo
                        </button>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-9">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span>2.500+ sporcu güveniyor</span>
                    </div>

                    <div className="flex gap-10">
                        {STATS.map((stat, i) => (
                            <div key={i}>
                                <div className="text-3xl font-bold text-white">{stat.value}</div>
                                <div className="text-sm text-gray-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


        </div>
    )
}
