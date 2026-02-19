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
    // Mobile-specific refs
    const mobileVideoBoxRef = useRef<HTMLDivElement>(null)
    const mobileIntroRef = useRef<HTMLDivElement>(null)
    const mobilePhoneFrameRef = useRef<HTMLDivElement>(null)
    const mobileContentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger)

        const timer = setTimeout(() => {
            if (!wrapperRef.current) return

            const ctx = gsap.context(() => {
                const mm = gsap.matchMedia()

                // ===== DESKTOP: Scroll-linked animation =====
                mm.add('(min-width: 1024px)', () => {
                    if (!videoBoxRef.current) return
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

                    // Glow da telefonla birlikte kayıyor
                    tl.to(glowRef.current, {
                        x: () => window.innerWidth * 0.18,
                        scale: 1.5,
                        autoAlpha: 0.8,
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

                // ===== MOBILE: Same concept - scroll-linked animation =====
                mm.add('(max-width: 1023px)', () => {
                    if (!mobileVideoBoxRef.current || !mobileContentRef.current) return

                    // Başlangıç: Video tam ekran, intro overlay görünür, içerik gizli
                    gsap.set(mobileVideoBoxRef.current, {
                        width: '100vw',
                        height: '100vh',
                        borderRadius: 0,
                        x: 0,
                        y: 0,
                    })
                    gsap.set(mobileIntroRef.current, { autoAlpha: 1 })
                    gsap.set(mobilePhoneFrameRef.current, { autoAlpha: 0 })
                    gsap.set(mobileContentRef.current, { autoAlpha: 0, y: 60 })

                    // Hide desktop elements
                    if (contentLeftRef.current) gsap.set(contentLeftRef.current, { autoAlpha: 0, display: 'none' })
                    if (glowRef.current) gsap.set(glowRef.current, { autoAlpha: 0 })

                    const tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: wrapperRef.current,
                            start: 'top top',
                            end: 'bottom bottom',
                            scrub: 1,
                        },
                    })

                    // FAZ 1: Intro overlay fade out (0-15%)
                    tl.to(mobileIntroRef.current, {
                        autoAlpha: 0,
                        duration: 0.15,
                    }, 0)

                    // FAZ 2: Video küçülüp telefon şekline dönüyor (0-50%)
                    tl.to(mobileVideoBoxRef.current, {
                        width: 260,
                        height: 520,
                        borderRadius: 40,
                        duration: 0.5,
                        ease: 'power2.inOut',
                    }, 0)

                    // Telefon çerçevesi beliriyor (25-45%)
                    tl.to(mobilePhoneFrameRef.current, {
                        autoAlpha: 1,
                        duration: 0.2,
                    }, 0.25)

                    // FAZ 3: İçerik beliriyor (50-90%)
                    tl.to(mobileContentRef.current, {
                        autoAlpha: 1,
                        y: 0,
                        duration: 0.3,
                        ease: 'power2.out',
                    }, 0.5)
                })
            }, wrapperRef)

            return () => ctx.revert()
        }, 300)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div id="performans" ref={wrapperRef} className="relative bg-[#0a0e1a] min-h-[200vh] lg:h-[300vh]">
            {/* Sabit kalan içerik */}
            <div
                ref={pinnedRef}
                className="sticky top-0 min-h-screen w-full overflow-hidden"
            >
                {/* Arka plan */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1829] to-[#0a0e1a]" />

                {/* TEKNOLOJİK EFEKTLER */}
                <TechBackground />

                {/* GLOW EFEKTİ (Desktop only) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                        ref={glowRef}
                        className="w-[320px] h-[500px] intense-glow rounded-full opacity-0"
                    />
                </div>

                {/* ============ DESKTOP VIDEO BOX ============ */}
                <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
                    <div
                        ref={videoBoxRef}
                        className="relative overflow-hidden pointer-events-auto"
                        style={{
                            width: '100vw',
                            height: '100vh',
                            borderRadius: 0,
                        }}
                    >
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
                            className="absolute inset-0 z-20 bg-black/45 flex flex-col items-center justify-center"
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

                {/* DESKTOP SOL İÇERİK */}
                <div
                    ref={contentLeftRef}
                    className="hidden lg:flex relative lg:absolute z-40 flex-col items-start text-left px-0 lg:left-[15%] lg:top-1/2 lg:-translate-y-1/2 max-w-lg lg:opacity-0"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 mb-7">
                        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                        <span className="text-sm font-semibold text-[#22c55e]">{t.hero.badge}</span>
                    </div>

                    <h1 className="text-7xl font-black text-white mb-2 leading-[1.05]">
                        {t.hero.title1}
                    </h1>
                    <h1 className="text-7xl font-black mb-7 leading-[1.05]">
                        <span className="bg-gradient-to-r from-[#22c55e] to-[#10DC78] bg-clip-text text-transparent">
                            {t.hero.title2}
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 mb-9 leading-relaxed max-w-md">
                        {t.hero.description}
                        <br />
                        {t.hero.descriptionLine2}
                    </p>

                    <div className="flex flex-row gap-4 mb-7">
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

                {/* ============ MOBILE VIDEO + CONTENT ============ */}
                <div className="lg:hidden absolute inset-0 flex flex-col items-center justify-center">
                    {/* Mobile Video Box - starts fullscreen, shrinks to phone */}
                    <div
                        ref={mobileVideoBoxRef}
                        className="relative overflow-hidden flex-shrink-0"
                        style={{
                            width: '100vw',
                            height: '100vh',
                            borderRadius: 0,
                        }}
                    >
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
                        <div className="absolute inset-0 bg-black/15" />

                        {/* Play button on video */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                            <div
                                onClick={() => setIsVideoModalOpen(true)}
                                className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center mb-3 cursor-pointer active:scale-95 transition-all"
                            >
                                <Play className="w-7 h-7 text-white ml-0.5" fill="white" fillOpacity={0.85} />
                            </div>
                        </div>

                        {/* Mobile Intro Overlay */}
                        <div
                            ref={mobileIntroRef}
                            className="absolute inset-0 z-20 bg-black/45 flex flex-col items-center justify-center"
                        >
                            <div className="text-center px-6 mb-16">
                                <h1 className="text-5xl font-black text-white mb-4 tracking-tight leading-none">
                                    {t.hero.introTitle1}
                                    <br />
                                    <span className="bg-gradient-to-r from-[#22c55e] to-[#10DC78] bg-clip-text text-transparent">
                                        {t.hero.introTitle2}
                                    </span>
                                </h1>
                                <p className="text-lg text-white/60 font-light max-w-sm mx-auto">
                                    {t.hero.introDescription}
                                </p>
                            </div>

                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                <span className="text-white/40 text-xs">{t.hero.scrollText}</span>
                                <ChevronDown className="w-4 h-4 text-white/40 animate-bounce" />
                            </div>
                        </div>

                        {/* Mobile Phone Frame */}
                        <div
                            ref={mobilePhoneFrameRef}
                            className="absolute inset-0 z-30 pointer-events-none"
                            style={{ opacity: 0 }}
                        >
                            <div className="absolute inset-0 rounded-[40px] border-[8px] border-[#1c1c2e]">
                                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-5 bg-black rounded-full" />
                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/15 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Content - appears below phone after scroll */}
                    <div
                        ref={mobileContentRef}
                        className="flex flex-col items-center text-center px-6 mt-8 max-w-md mx-auto"
                        style={{ opacity: 0 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#22c55e]/40 bg-[#22c55e]/10 mb-5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                            <span className="text-xs font-semibold text-[#22c55e]">{t.hero.badge}</span>
                        </div>

                        <h1 className="text-3xl font-black text-white mb-1.5 leading-[1.1]">
                            {t.hero.title1}
                        </h1>
                        <h1 className="text-3xl font-black mb-5 leading-[1.1]">
                            <span className="bg-gradient-to-r from-[#22c55e] to-[#10DC78] bg-clip-text text-transparent">
                                {t.hero.title2}
                            </span>
                        </h1>

                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            {t.hero.description}
                        </p>

                        <div className="flex flex-col gap-3 w-full max-w-xs mb-4">
                            <ComingSoonButton
                                className="px-6 py-3.5 bg-gradient-to-r from-[#22c55e] to-[#10DC78] text-black font-bold rounded-2xl flex items-center justify-center transition-all border-none ring-0 outline-none"
                            >
                                <div className="flex items-center gap-2 whitespace-nowrap text-sm">
                                    {t.hero.cta}
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </ComingSoonButton>
                            <button
                                onClick={() => setIsVideoModalOpen(true)}
                                className="px-6 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-2xl flex items-center gap-2 justify-center transition-all text-sm"
                            >
                                <Play className="w-4 h-4" />
                                {t.hero.demo}
                            </button>
                        </div>
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
                        <button
                            onClick={() => setIsVideoModalOpen(false)}
                            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all z-10"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

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
