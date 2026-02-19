'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { Play, ChevronDown, ChevronRight, Star, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import TechBackground from '@/components/effects/TechBackground'
import ComingSoonButton from '@/components/ui/ComingSoonButton'
import { useLanguage } from '@/lib/i18n/LanguageContext'

// ================================
// CODEWAY-STYLE HERO SECTION
// ================================

const STAT_VALUES = ['2.5K+', '12', '%42']
const YOUTUBE_VIDEO_ID = '0Wycc59kfa0'

export default function HeroSection() {
    const { t } = useLanguage()
    const statLabels = [t.hero.stats.athletes, t.hero.stats.clubs, t.hero.stats.growth]
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const pinnedRef = useRef<HTMLDivElement>(null)
    const videoBoxRef = useRef<HTMLDivElement>(null)
    const introOverlayRef = useRef<HTMLDivElement>(null)
    const phoneBorderRef = useRef<HTMLDivElement>(null)
    const contentLeftRef = useRef<HTMLDivElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)





    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger)

        const timer = setTimeout(() => {
            if (!wrapperRef.current || !videoBoxRef.current) return

            const ctx = gsap.context(() => {
                const mm = gsap.matchMedia()

                mm.add('(min-width: 1024px)', () => {
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

                // Mobil — video göster (statik, scroll animasyonu yok)
                mm.add('(max-width: 1023px)', () => {
                    gsap.set(videoBoxRef.current, { autoAlpha: 1, clearProps: 'width,height,x' })
                    gsap.set(introOverlayRef.current, { autoAlpha: 0 })
                    gsap.set(phoneBorderRef.current, { autoAlpha: 0 })
                    gsap.set(contentLeftRef.current, { autoAlpha: 1, x: 0 })
                    gsap.set(glowRef.current, { autoAlpha: 0 })
                })
            }, wrapperRef)

            return () => ctx.revert()
        }, 300)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div id="performans" ref={wrapperRef} className="relative bg-[#0a0e1a] min-h-screen lg:h-[300vh]">
            {/* Sabit kalan içerik */}
            <div
                ref={pinnedRef}
                className="lg:sticky lg:top-0 min-h-screen w-full overflow-hidden"
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

                {/* VIDEO BOX - Mobile: below content, Desktop: absolute fullscreen with GSAP */}
                <div className="relative lg:absolute lg:inset-0 flex items-center justify-center pointer-events-none mt-8 lg:mt-0 px-4 lg:px-0">
                    <div
                        ref={videoBoxRef}
                        className="relative overflow-hidden pointer-events-auto w-full max-w-sm lg:max-w-none rounded-2xl lg:rounded-none"
                        style={{
                            height: '50vh',
                        }}
                    >
                        {/* Video Background - optimized with poster & preload */}
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            poster="/hero-poster.jpg"
                            className="absolute inset-0 w-full h-full object-cover"
                        >
                            <source src="/hero-video.mp4" type="video/mp4" />
                        </video>
                        <div className="absolute inset-0 bg-black/20" />

                        {/* Play button */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div
                                onClick={() => setIsVideoModalOpen(true)}
                                className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center mb-5 cursor-pointer hover:bg-white/20 hover:scale-110 transition-all duration-300"
                            >
                                <Play className="w-8 h-8 text-white ml-1" fill="white" fillOpacity={0.85} />
                            </div>
                            <span className="text-white/50 text-sm tracking-[0.25em] uppercase">Demo</span>
                        </div>

                        {/* INTRO OVERLAY */}
                        <div
                            ref={introOverlayRef}
                            className="absolute inset-0 z-20 bg-black/45 hidden lg:flex flex-col items-center justify-center"
                        >
                            <div className="text-center px-6 mb-20">
                                <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight leading-none">
                                    {t.hero.introTitle1}
                                    <br />
                                    <span className="bg-gradient-to-r from-[#22c55e] to-[#10DC78] bg-clip-text text-transparent">
                                        {t.hero.introTitle2}
                                    </span>
                                </h1>
                                <p className="text-xl md:text-2xl text-white/60 font-light max-w-lg mx-auto">
                                    {t.hero.introDescription}
                                </p>
                            </div>

                            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                <span className="text-white/40 text-sm">{t.hero.scrollText}</span>
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
                    className="relative lg:absolute z-40 flex flex-col items-center text-center lg:items-start lg:text-left px-6 lg:px-0 lg:left-[15%] py-20 lg:py-0 lg:top-1/2 lg:-translate-y-1/2 max-w-lg mx-auto lg:mx-0 lg:opacity-0"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 mb-7">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                        <span className="text-sm font-semibold text-[#22c55e]">{t.hero.badge}</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-2 leading-[1.05]">
                        {t.hero.title1}
                    </h1>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-7 leading-[1.05]">
                        <span className="bg-gradient-to-r from-[#22c55e] to-[#10DC78] bg-clip-text text-transparent">
                            {t.hero.title2}
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 mb-9 leading-relaxed max-w-md">
                        {t.hero.description}
                        <br />
                        {t.hero.descriptionLine2}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-7">
                        <ComingSoonButton
                            className="px-8 py-4 bg-gradient-to-r from-[#22c55e] to-[#10DC78] text-black font-bold rounded-2xl flex items-center justify-center hover:shadow-xl hover:shadow-emerald-500/20 transition-all min-w-[200px] border-none ring-0 outline-none"
                        >
                            <div className="flex items-center gap-2 whitespace-nowrap">
                                {t.hero.cta}
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </ComingSoonButton>
                        <button
                            onClick={() => setIsVideoModalOpen(true)}
                            className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl flex items-center gap-2 justify-center hover:bg-white/10 transition-all"
                        >
                            <Play className="w-5 h-5" />
                            {t.hero.demo}
                        </button>
                    </div>


                </div>
            </div>

            {/* YouTube Video Modal */}
            <AnimatePresence>
                {isVideoModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsVideoModalOpen(false)}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsVideoModalOpen(false)}
                            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-10"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        {/* Video container - Phone shape for Shorts */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-[360px] h-[640px] max-w-[90vw] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/20 border-2 border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <iframe
                                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                                title="ZEVO Demo"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                                style={{ border: 'none' }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}
