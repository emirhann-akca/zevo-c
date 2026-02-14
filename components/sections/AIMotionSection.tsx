'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { Eye, Shield, RefreshCw, Check, AlertTriangle } from 'lucide-react'
import ConnectedPointsBackground from '@/components/effects/ConnectedPointsBackground'
import SectionHeader from '@/components/ui/SectionHeader'

// ================================
// AI MOTION SECTION - CINEMATIC
// Phone mockup with animated AI skeleton
// ================================

// Standing ve Squat pozisyonları (viewBox: 280x520, center X = 140)
const JOINTS_DATA = [
    { id: 'head', r: 7, standing: { x: 140, y: 70 }, squat: { x: 140, y: 100 } },
    { id: 'neck', r: 4, standing: { x: 140, y: 95 }, squat: { x: 140, y: 125 } },
    { id: 'shoulderL', r: 5, standing: { x: 100, y: 115 }, squat: { x: 95, y: 142 } },
    { id: 'shoulderR', r: 5, standing: { x: 180, y: 115 }, squat: { x: 185, y: 142 } },
    { id: 'elbowL', r: 4, standing: { x: 75, y: 165 }, squat: { x: 75, y: 182 } },
    { id: 'elbowR', r: 4, standing: { x: 205, y: 165 }, squat: { x: 205, y: 182 } },
    { id: 'wristL', r: 4, standing: { x: 85, y: 215 }, squat: { x: 95, y: 205 } },
    { id: 'wristR', r: 4, standing: { x: 195, y: 215 }, squat: { x: 185, y: 205 } },
    { id: 'hipL', r: 5, standing: { x: 118, y: 225 }, squat: { x: 108, y: 248 } },
    { id: 'hipR', r: 5, standing: { x: 162, y: 225 }, squat: { x: 172, y: 248 } },
    { id: 'kneeL', r: 5, standing: { x: 118, y: 305 }, squat: { x: 85, y: 318 } },
    { id: 'kneeR', r: 5, standing: { x: 162, y: 305 }, squat: { x: 195, y: 318 } },
    { id: 'ankleL', r: 4, standing: { x: 118, y: 385 }, squat: { x: 75, y: 368 } },
    { id: 'ankleR', r: 4, standing: { x: 162, y: 385 }, squat: { x: 205, y: 368 } },
]

const BONES = [
    ['head', 'neck'],
    ['neck', 'shoulderL'],
    ['neck', 'shoulderR'],
    ['shoulderL', 'shoulderR'],
    ['shoulderL', 'elbowL'],
    ['shoulderR', 'elbowR'],
    ['elbowL', 'wristL'],
    ['elbowR', 'wristR'],
    ['shoulderL', 'hipL'],
    ['shoulderR', 'hipR'],
    ['hipL', 'hipR'],
    ['hipL', 'kneeL'],
    ['hipR', 'kneeR'],
    ['kneeL', 'ankleL'],
    ['kneeR', 'ankleR'],
]

const FEATURES = [
    { icon: Eye, label: 'Gerçek Zamanlı İskelet Takibi', desc: 'Kamera açıkken anlık analiz', color: 'green' },
    { icon: Shield, label: 'Hata Düzeltme', desc: 'Yanlış form anında uyarı', color: 'amber' },
    { icon: RefreshCw, label: 'Otomatik Sayım', desc: 'Tekrarları sen değil, yapay zeka sayar', color: 'blue' },
]

// Easing function
const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export default function AIMotionSection() {
    const sectionRef = useRef<HTMLDivElement>(null)
    const phoneRef = useRef<HTMLDivElement>(null)
    const [mounted, setMounted] = useState(false)
    const [postureCorrect, setPostureCorrect] = useState(true)
    const [isVisible, setIsVisible] = useState(false) // Visibility state

    // Refs for animation state (avoiding Re-renders)
    const poseProgressRef = useRef(0)
    const repCountRef = useRef(0)

    // Refs for DOM elements
    const kneeTextRef = useRef<HTMLParagraphElement>(null)
    const kneeIconRef = useRef<HTMLSpanElement>(null)
    const repTextRef = useRef<HTMLSpanElement>(null)
    const repBarRef = useRef<HTMLDivElement>(null)

    // SVG Refs
    const jointsRef = useRef<(SVGCircleElement | null)[]>([])
    const bonesRef = useRef<(SVGLineElement | null)[]>([])

    // Visibility Observer
    useEffect(() => {
        if (!mounted || !sectionRef.current) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            {
                threshold: 0.15,
                rootMargin: "-50px 0px"
            }
        )

        observer.observe(sectionRef.current)
        return () => observer.disconnect()
    }, [mounted])

    // Pose animation - smooth transition via RAF and Direct DOM Manipulation
    useEffect(() => {
        if (!mounted || !isVisible) return // Pause when not visible

        let animationFrame: number
        const startTime = Date.now()
        const cycleDuration = 2000 // 2 seconds cycle
        let lastFrameTime = 0
        const fpsInterval = 1000 / 30 // 30 FPS cap

        const updateSkeleton = (progress: number) => {
            // Calculate all joint positions
            const currentJoints = JOINTS_DATA.map(j => ({
                id: j.id,
                x: j.standing.x + (j.squat.x - j.standing.x) * progress,
                y: j.standing.y + (j.squat.y - j.standing.y) * progress,
            }))

            // Update Joints (Circles)
            JOINTS_DATA.forEach((j, i) => {
                const el = jointsRef.current[i]
                if (el) {
                    el.setAttribute('cx', currentJoints[i].x.toString())
                    el.setAttribute('cy', currentJoints[i].y.toString())
                }
            })

            // Update Bones (Lines)
            BONES.forEach((bonePair, i) => {
                const el = bonesRef.current[i]
                if (el) {
                    const from = currentJoints.find(j => j.id === bonePair[0])
                    const to = currentJoints.find(j => j.id === bonePair[1])
                    if (from && to) {
                        el.setAttribute('x1', from.x.toString())
                        el.setAttribute('y1', from.y.toString())
                        el.setAttribute('x2', to.x.toString())
                        el.setAttribute('y2', to.y.toString())
                    }
                }
            })

            // Update Knee Angle UI
            const angle = Math.round(175 - (85 * progress))
            if (kneeTextRef.current) {
                kneeTextRef.current.innerHTML = `${angle}° <span class="${angle < 120 ? 'text-green-400' : 'text-gray-500'}">${angle < 120 ? '✓' : ''}</span>`
            }
        }

        const animate = (timestamp: number) => {
            animationFrame = requestAnimationFrame(animate)

            const elapsedFrame = timestamp - lastFrameTime

            if (elapsedFrame > fpsInterval) {
                lastFrameTime = timestamp - (elapsedFrame % fpsInterval)

                const elapsed = Date.now() - startTime
                const cyclePosition = (elapsed % (cycleDuration * 2)) / cycleDuration

                let progress: number
                if (cyclePosition <= 1) {
                    progress = easeInOutCubic(cyclePosition)
                } else {
                    progress = 1 - easeInOutCubic(cyclePosition - 1)
                }

                poseProgressRef.current = progress
                updateSkeleton(progress)
            }
        }

        animationFrame = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(animationFrame)
    }, [mounted, isVisible])

    // Rep counter - increment on each squat cycle
    useEffect(() => {
        if (!mounted || !isVisible) return // Pause when not visible
        const interval = setInterval(() => {
            const currentRep = repCountRef.current < 12 ? repCountRef.current + 1 : 1
            repCountRef.current = currentRep

            // Update UI directly
            if (repTextRef.current) repTextRef.current.innerText = currentRep.toString()
            if (repBarRef.current) repBarRef.current.style.width = `${(currentRep / 12) * 100}%`

        }, 4000)
        return () => clearInterval(interval)
    }, [mounted, isVisible])

    // Posture toggle - Keep this as state since it's infrequent and affects classNames significantly
    useEffect(() => {
        if (!mounted || !isVisible) return // Pause when not visible
        const interval = setInterval(() => {
            setPostureCorrect(false)
            setTimeout(() => setPostureCorrect(true), 2000)
        }, 6000)
        return () => clearInterval(interval)
    }, [mounted, isVisible])

    // GSAP animations
    useEffect(() => {
        setMounted(true)
        setMounted(true)

        const timer = setTimeout(() => {
            if (!sectionRef.current) return

            const ctx = gsap.context(() => {
                gsap.from('.ai-left > *', {
                    x: -50,
                    opacity: 0,
                    duration: 0.7,
                    stagger: 0.12,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 65%',
                        toggleActions: 'play none none reverse',
                    },
                })

                gsap.from(phoneRef.current, {
                    scale: 0.85,
                    opacity: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 60%',
                        toggleActions: 'play none none reverse',
                    },
                })

                gsap.from('.phone-ui', {
                    opacity: 0,
                    y: 10,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 40%',
                        toggleActions: 'play none none reverse',
                    },
                })

            }, sectionRef)

            return () => ctx.revert()
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    if (!mounted) {
        return <div className="min-h-screen bg-[#0a0e1a]" />
    }

    return (
        <section
            ref={sectionRef}
            id="hareket-analizi"
            className="relative min-h-screen bg-[#0a0e1a] py-16 lg:py-20 flex items-center overflow-hidden"
        >
            <ConnectedPointsBackground />

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 w-full relative z-10">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    {/* ================== LEFT COLUMN ================== */}
                    <div className="ai-left w-full lg:w-[45%] space-y-6">

                        <SectionHeader
                            badge="Yapay Zeka Motoru"
                            title={<>Hareketini <br /> <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">Analiz Et.</span></>}
                            description="Tek ihtiyacın bir kamera. Kameranı aç, harekete başla. Yapay zeka gerisini halleder. Seni tarar, tekrarlarını sayar ve hatalarını anında yakalar. Gelişimini şansa bırakma."
                            align="left"
                            className="mb-8"
                        />

                        {/* Feature list */}
                        <div className="space-y-3">
                            {FEATURES.map((feature) => (
                                <div key={feature.label} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${feature.color === 'green' ? 'bg-green-500/10' :
                                        feature.color === 'amber' ? 'bg-amber-500/10' : 'bg-blue-500/10'
                                        }`}>
                                        <feature.icon className={`w-4 h-4 ${feature.color === 'green' ? 'text-green-400' :
                                            feature.color === 'amber' ? 'text-amber-400' : 'text-blue-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{feature.label}</p>
                                        <p className="text-white/30 text-xs">{feature.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Metric cards */}
                        {/* Metric cards */}
                        <div className="flex gap-3">
                            {[
                                { value: '17', label: 'Eklem Noktası' },
                                { value: '30+', label: 'FPS Analiz' },
                                { value: '50', label: 'ms Gecikme' },
                            ].map((stat) => (
                                <div key={stat.label} className="flex-1 group cursor-default">
                                    <p className="text-white group-hover:text-green-400 transition-colors duration-300 text-3xl font-bold flex items-center justify-center lg:justify-start gap-1">
                                        {stat.value}
                                    </p>
                                    <p className="text-white/40 group-hover:text-white/60 transition-colors duration-300 text-[10px] uppercase tracking-wider mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ================== RIGHT COLUMN - PHONE ================== */}
                    <div className="w-full lg:w-[55%] flex justify-center relative">

                        {/* Phone mockup - smaller to fit screen */}
                        <div
                            ref={phoneRef}
                            className="relative w-[260px] h-[520px] md:w-[280px] md:h-[560px]"
                            style={{
                                border: '5px solid #1c1c2e',
                                borderRadius: '40px',
                                background: '#000',
                                overflow: 'hidden',
                                boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 50px rgba(0,0,0,0.5), 0 0 120px rgba(34,197,94,0.25)',
                            }}
                        >
                            {/* Notch */}
                            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[70px] h-[22px] bg-black rounded-b-[14px] z-20" />

                            {/* Camera background */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] via-[#111827] to-[#1a1a2a]">
                                <div className="absolute inset-0 opacity-[0.06]" style={{
                                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                                }} />
                                <div className="absolute bottom-[12%] left-0 right-0 h-[1px] bg-white/[0.04]" />
                            </div>

                            {/* SVG Skeleton - animated */}
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 280 520">
                                {/* Bone lines */}
                                {BONES.map(([fromId, toId], i) => {
                                    // Initial render positions (standing)
                                    const from = JOINTS_DATA.find(j => j.id === fromId)!.standing
                                    const to = JOINTS_DATA.find(j => j.id === toId)!.standing
                                    return (
                                        <line
                                            key={i}
                                            ref={(el) => { bonesRef.current[i] = el }}
                                            x1={from.x}
                                            y1={from.y}
                                            x2={to.x}
                                            y2={to.y}
                                            stroke="rgba(34, 197, 94, 0.6)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    )
                                })}

                                {/* Joint dots */}
                                {JOINTS_DATA.map((joint, i) => (
                                    <circle
                                        key={joint.id}
                                        ref={(el) => { jointsRef.current[i] = el }}
                                        cx={joint.standing.x}
                                        cy={joint.standing.y}
                                        r={joint.r + 1}
                                        fill="#22c55e"
                                        fillOpacity="0.8"
                                    />
                                ))}
                            </svg>

                            {/* ============ IN-PHONE UI OVERLAYS ============ */}

                            {/* Top bar - AI Aktif only, no REC */}
                            <div className="phone-ui absolute top-8 left-2 right-2 flex justify-end items-center z-10">
                                <div className="bg-black/60 backdrop-blur rounded-lg px-2.5 py-1">
                                    <span className="text-green-400 text-[9px] font-medium">AI Aktif</span>
                                </div>
                            </div>

                            {/* Exercise label */}
                            <div className="phone-ui absolute top-14 left-1/2 -translate-x-1/2 bg-green-500/20 backdrop-blur border border-green-500/30 rounded-full px-3 py-0.5 z-10">
                                <span className="text-green-400 text-[10px] font-semibold">🏋️ Squat</span>
                            </div>

                            {/* Angle indicator */}
                            <div className="phone-ui absolute z-10" style={{ top: '58%', right: '8px' }}>
                                <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-1 border border-white/10">
                                    <p className="text-[8px] text-white/40">DİZ AÇISI</p>
                                    <p className="text-white text-xs font-bold" ref={kneeTextRef}>
                                        175° <span className="text-gray-500"></span>
                                    </p>
                                </div>
                            </div>

                            {/* Rep counter */}
                            <div className="phone-ui absolute bottom-14 left-2 z-10">
                                <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-1.5 border border-white/10">
                                    <p className="text-[8px] text-white/40 mb-0.5">TEKRAR</p>
                                    <div className="flex items-baseline gap-0.5">
                                        <span ref={repTextRef} className="text-green-400 text-lg font-bold">0</span>
                                        <span className="text-white/30 text-[10px]">/ 12</span>
                                    </div>
                                    <div className="h-1 w-12 bg-white/10 rounded-full mt-1 overflow-hidden">
                                        <div
                                            ref={repBarRef}
                                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                                            style={{ width: '0%' }}
                                        />
                                    </div>
                                </div>
                            </div>



                            {/* Posture status */}
                            <div className="phone-ui absolute bottom-2 left-2 right-2 z-10">
                                <div className={`backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all duration-500 ${postureCorrect
                                    ? 'bg-green-500/15 border border-green-500/20'
                                    : 'bg-orange-500/15 border border-orange-500/20'
                                    }`}>
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${postureCorrect ? 'bg-green-500/20' : 'bg-orange-500/20'
                                        }`}>
                                        {postureCorrect ? (
                                            <Check className="w-2.5 h-2.5 text-green-400" />
                                        ) : (
                                            <AlertTriangle className="w-2.5 h-2.5 text-orange-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-semibold ${postureCorrect ? 'text-green-400' : 'text-orange-400'}`}>
                                            {postureCorrect ? 'Duruş Doğru' : 'Sırtını Düzelt!'}
                                        </p>
                                        <p className="text-white/30 text-[8px]">
                                            {postureCorrect ? 'Formun mükemmel' : 'Eğilme algılandı'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>


        </section>
    )
}
