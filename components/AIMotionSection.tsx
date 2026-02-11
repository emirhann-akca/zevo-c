'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Eye, Shield, RefreshCw, Check, AlertTriangle } from 'lucide-react'

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
    { icon: Shield, label: 'Postür Düzeltme', desc: 'Yanlış form anında uyarı', color: 'amber' },
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
    const [poseProgress, setPoseProgress] = useState(0) // 0 = standing, 1 = squat
    const [postureCorrect, setPostureCorrect] = useState(true)
    const [repCount, setRepCount] = useState(0)
    const [kneeAngle, setKneeAngle] = useState(175)

    // Pose animation - smooth transition
    useEffect(() => {
        if (!mounted) return

        let animationFrame: number
        const startTime = Date.now()
        const cycleDuration = 2000 // 2 seconds cycle

        const animate = () => {
            const elapsed = Date.now() - startTime
            const cyclePosition = (elapsed % (cycleDuration * 2)) / cycleDuration

            let progress: number
            if (cyclePosition <= 1) {
                progress = easeInOutCubic(cyclePosition)
            } else {
                progress = 1 - easeInOutCubic(cyclePosition - 1)
            }

            setPoseProgress(progress)
            setKneeAngle(Math.round(175 - (85 * progress)))

            animationFrame = requestAnimationFrame(animate)
        }

        animate()

        return () => cancelAnimationFrame(animationFrame)
    }, [mounted])

    // Rep counter - increment on each squat cycle
    useEffect(() => {
        if (!mounted) return
        const interval = setInterval(() => {
            setRepCount(r => r < 12 ? r + 1 : 1)
        }, 4000)
        return () => clearInterval(interval)
    }, [mounted])

    // Posture toggle
    useEffect(() => {
        if (!mounted) return
        const interval = setInterval(() => {
            setPostureCorrect(false)
            setTimeout(() => setPostureCorrect(true), 2000)
        }, 6000)
        return () => clearInterval(interval)
    }, [mounted])

    // GSAP animations
    useEffect(() => {
        setMounted(true)
        gsap.registerPlugin(ScrollTrigger)

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

                gsap.from('.float-card', {
                    scale: 0.8,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.2,
                    ease: 'back.out(2)',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 35%',
                        toggleActions: 'play none none reverse',
                    },
                })
            }, sectionRef)

            return () => ctx.revert()
        }, 100)

        return () => clearTimeout(timer)
    }, [])

    // Interpolated joint positions
    const jointPositions = useMemo(() => {
        return JOINTS_DATA.map(j => ({
            id: j.id,
            r: j.r,
            x: j.standing.x + (j.squat.x - j.standing.x) * poseProgress,
            y: j.standing.y + (j.squat.y - j.standing.y) * poseProgress,
        }))
    }, [poseProgress])

    const getJoint = (id: string) => jointPositions.find(j => j.id === id)!

    if (!mounted) {
        return <div className="min-h-screen bg-[#0a0e1a]" />
    }

    return (
        <section
            ref={sectionRef}
            className="relative min-h-screen bg-[#0a0e1a] py-16 lg:py-20 flex items-center overflow-hidden"
        >

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 w-full">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    {/* ================== LEFT COLUMN ================== */}
                    <div className="ai-left w-full lg:w-[45%] space-y-6">

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-green-400 text-xs font-semibold tracking-wider uppercase">Yapay Zeka Motoru</span>
                        </div>

                        {/* Heading */}
                        <div>
                            <h2 className="text-[44px] lg:text-[56px] font-extrabold text-white leading-[1.1] tracking-tight">
                                Hareketini
                            </h2>
                            <h2 className="text-[44px] lg:text-[56px] font-extrabold leading-[1.1] tracking-tight">
                                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                                    Analiz Et.
                                </span>
                            </h2>
                        </div>

                        {/* Description */}
                        <p className="text-[#9ca3af] text-base lg:text-lg leading-relaxed max-w-md">
                            Kameranı aç, harekete başla. Yapay zeka vücudunu tarar,
                            her tekrarı sayar, her hatayı yakalar.
                        </p>

                        {/* Metric cards */}
                        <div className="flex gap-3">
                            {[
                                { value: '17', label: 'Eklem Noktası' },
                                { value: '30+', label: 'FPS Analiz' },
                                { value: '<50', label: 'ms Gecikme' },
                            ].map((stat) => (
                                <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 flex-1">
                                    <p className="text-green-400 text-xl font-bold">{stat.value}</p>
                                    <p className="text-white/40 text-[10px] mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>

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
                                <defs>
                                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Bone lines */}
                                {BONES.map(([fromId, toId], i) => {
                                    const from = getJoint(fromId)
                                    const to = getJoint(toId)
                                    return (
                                        <line
                                            key={i}
                                            x1={from.x}
                                            y1={from.y}
                                            x2={to.x}
                                            y2={to.y}
                                            stroke="rgba(34, 197, 94, 0.4)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    )
                                })}

                                {/* Joint dots */}
                                {jointPositions.map((joint) => (
                                    <circle
                                        key={joint.id}
                                        cx={joint.x}
                                        cy={joint.y}
                                        r={joint.r}
                                        fill="#22c55e"
                                        filter="url(#glow)"
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
                                    <p className="text-white text-xs font-bold">
                                        {kneeAngle}° <span className={kneeAngle < 120 ? 'text-green-400' : 'text-gray-500'}>{kneeAngle < 120 ? '✓' : ''}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Rep counter */}
                            <div className="phone-ui absolute bottom-14 left-2 z-10">
                                <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-1.5 border border-white/10">
                                    <p className="text-[8px] text-white/40 mb-0.5">TEKRAR</p>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-green-400 text-lg font-bold">{repCount}</span>
                                        <span className="text-white/30 text-[10px]">/ 12</span>
                                    </div>
                                    <div className="h-1 w-12 bg-white/10 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                                            style={{ width: `${(repCount / 12) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Calorie counter */}
                            <div className="phone-ui absolute bottom-14 right-2 z-10">
                                <div className="bg-black/70 backdrop-blur rounded-lg px-2 py-1.5 border border-white/10">
                                    <p className="text-[8px] text-white/40 mb-0.5">KALORİ</p>
                                    <p className="text-white text-lg font-bold">156 <span className="text-white/30 text-[10px]">kcal</span></p>
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

                        {/* ============ FLOATING CARDS ============ */}
                        <div
                            className="float-card absolute -top-2 -right-2 lg:-right-12 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl px-3 py-2 shadow-xl"
                            style={{ animation: 'float1 3s ease-in-out infinite' }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-green-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xs">🧠</span>
                                </div>
                                <div>
                                    <p className="text-white text-[10px] font-semibold">AI Motor Aktif</p>
                                    <p className="text-green-400 text-[9px]">30 FPS • 12ms</p>
                                </div>
                            </div>
                        </div>

                        <div
                            className="float-card absolute -bottom-2 -left-2 lg:-left-12 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-xl px-3 py-2 shadow-xl"
                            style={{ animation: 'float2 3.5s ease-in-out infinite' }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                    <span className="text-xs">📊</span>
                                </div>
                                <div>
                                    <p className="text-white text-[10px] font-semibold">Analiz Raporu</p>
                                    <p className="text-white/40 text-[9px]">Form: 94/100</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
        </section>
    )
}
