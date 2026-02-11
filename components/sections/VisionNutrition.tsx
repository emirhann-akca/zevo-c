'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, Zap, Brain, CheckCircle, Sparkles, Eye, Apple, Flame, Droplets, Target } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'
import PhoneMockup from '@/components/ui/PhoneMockup'

const macroData = [
  { label: 'Protein', value: 52, unit: 'g', max: 100, color: '#10DC78', icon: Zap },
  { label: 'Kalori', value: 380, unit: 'kcal', max: 800, color: '#22C55E', icon: Flame },
  { label: 'Karbonhidrat', value: 8, unit: 'g', max: 100, color: '#14b8a6', icon: Apple },
  { label: 'Yağ', value: 12, unit: 'g', max: 80, color: '#06b6d4', icon: Droplets },
]

const features = [
  {
    icon: Eye,
    title: 'Anında Görsel Tanıma',
    desc: 'Yapay zeka ile saniyeler içinde yemek türü, porsiyon ve içerik tespiti',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    icon: Brain,
    title: 'Akıllı Besin Analizi',
    desc: 'Makro ve mikro besin değerlerini AI modelleriyle hassas hesaplama',
    gradient: 'from-teal-500 to-cyan-500'
  },
  {
    icon: Target,
    title: 'Geniş Veri Tabanı',
    desc: 'Binlerce yemek ve besin türünü anında tanır.',
    gradient: 'from-cyan-500 to-emerald-500'
  }
]

const stats = [
  { value: '%95', label: 'Doğruluk', suffix: '' },
  { value: '500+', label: 'Türk Yemeği', suffix: '' },
  { value: '<2s', label: 'Analiz Süresi', suffix: '' },
]

const scanSteps = [
  { progress: 20, text: 'Görüntü analiz ediliyor...', icon: '🔍' },
  { progress: 40, text: 'Yemek türü tespit ediliyor...', icon: '🍽️' },
  { progress: 60, text: 'Porsiyon hesaplanıyor...', icon: '⚖️' },
  { progress: 80, text: 'Besin değerleri belirleniyor...', icon: '🧮' },
  { progress: 100, text: 'Sonuçlar hazırlanıyor...', icon: '✅' }
]

export default function VisionNutrition() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [animatedMacros, setAnimatedMacros] = useState(macroData.map(() => 0))

  const animationRef = useRef<number>()

  const startScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    setShowResults(false)
    setCurrentStep(0)
    setAnimatedMacros(macroData.map(() => 0))
  }

  // Scanning simulation (0-100%) - Optimized with RAF
  useEffect(() => {
    if (!isScanning) return

    let startTime: number | null = null
    const duration = 2500 // Total scan time in ms

    const animateScan = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min((elapsed / duration) * 100, 100)

      setScanProgress(progress)

      // Update step based on progress
      // 0-20: step 0, 20-40: step 1, etc.
      const stepIndex = Math.min(Math.floor(progress / 20), scanSteps.length - 1)
      setCurrentStep(stepIndex)

      if (progress < 100) {
        animationRef.current = requestAnimationFrame(animateScan)
      } else {
        // Scan complete
        setIsScanning(false)
        setShowResults(true)
      }
    }

    animationRef.current = requestAnimationFrame(animateScan)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isScanning])

  // Macro Counting Animation - Optimized with single RAF
  useEffect(() => {
    if (!showResults) return

    let startTime: number | null = null
    const duration = 1000 // Counter animation duration

    const animateMacros = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3) // Cubic ease out

      const newValues = macroData.map(macro => Math.round(macro.value * easeOut))
      setAnimatedMacros(newValues)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateMacros)
      }
    }

    // Small delay before starting counters to match UI appearance
    const timeout = setTimeout(() => {
      animationRef.current = requestAnimationFrame(animateMacros)
    }, 300)

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      clearTimeout(timeout)
    }
  }, [showResults])


  return (
    <section id="beslenme" className="relative min-h-screen py-24 lg:py-20 px-6 bg-[#0a0e1a] overflow-hidden flex items-center">

      {/* Static Efficient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Static Gradients replacing complex blurs */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] opacity-20"
          style={{
            background: 'radial-gradient(circle at center, rgba(16, 220, 120, 0.4) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[600px] h-[600px] opacity-10"
          style={{
            background: 'radial-gradient(circle at center, rgba(20, 184, 166, 0.4) 0%, transparent 70%)',
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 220, 120, 0.5) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(16, 220, 120, 0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ==================== RIGHT - CONTENT ==================== */}
          <div className="relative lg:order-last">
            <SectionHeader
              icon={<Camera className="w-4 h-4" />}
              badge="Vision AI"
              title={<>Tabağını Tarat,{' '}<span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">İçindekini Gör</span></>}
              description={<>Yemeğinin fotoğrafını çek, Zevo makro ve mikro değerlerini anında hesaplasın. Görüntü işleme teknolojisiyle beslenmeni şansa bırakma, hedeflerine uygun beslen.</>}
            />

            {/* Feature Cards */}
            <div className="space-y-3 mb-8">
              {features.map((item, i) => (
                <div
                  key={i}
                  className="group flex gap-3 items-center p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer hover:translate-x-1"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow flex-shrink-0`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm mb-0.5 group-hover:text-emerald-400 transition-colors">{item.title}</div>
                    <div className="text-xs text-white/50">{item.desc}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                    <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="relative group text-center p-3 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl overflow-hidden hover:scale-105 hover:border-emerald-500/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5 font-medium">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================== LEFT - PHONE MOCKUP ==================== */}
          <div className="relative flex justify-center lg:order-first">
            <PhoneMockup>

              {/* Food Image */}
              <div className="relative w-full h-full">
                <img
                  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=1200&fit=crop&q=80"
                  alt="Healthy meal"
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 to-transparent z-10" />

                {/* ===== Scanning Overlay (CSS Transitions) ===== */}
                <div
                  className={`absolute inset-0 bg-black/70 z-20 transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />

                {/* Scan Grid */}
                <div
                  className={`absolute inset-0 z-20 transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  style={{
                    backgroundImage: `
                            linear-gradient(to right, rgba(16, 220, 120, 0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(16, 220, 120, 0.08) 1px, transparent 1px)
                            `,
                    backgroundSize: '20px 20px'
                  }}
                />

                {/* Scan Line - CSS Animation */}
                <div
                  className={`absolute left-0 right-0 h-[2px] z-30 animate-scan transition-opacity duration-300 ${isScanning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  style={{
                    background: 'linear-gradient(90deg, transparent, #10DC78, transparent)',
                    boxShadow: '0 0 30px rgba(16, 220, 120, 0.8), 0 0 60px rgba(16, 220, 120, 0.4)',
                    willChange: 'top'
                  }}
                />

                {/* Progress Card */}
                <div
                  className={`absolute top-20 left-4 right-4 z-30 bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 transition-all duration-300 transform ${isScanning ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Taranıyor...
                  </div>

                  {/* Performant Progress Bar (scaleX) */}
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full origin-left"
                      style={{
                        transform: `scaleX(${scanProgress / 100})`,
                        transition: 'transform 0.1s linear',
                        willChange: 'transform'
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-white text-xs min-h-[20px]">
                    <span className="text-lg">{scanSteps[currentStep]?.icon}</span>
                    <span className="text-white/80">{scanSteps[currentStep]?.text}</span>
                  </div>

                  <div className="text-right text-emerald-400 font-bold text-lg mt-2">
                    {Math.round(scanProgress)}%
                  </div>
                </div>

                {/* ===== Results Card (CSS Transitions) ===== */}
                <div
                  className={`absolute bottom-20 left-3 right-3 z-30 bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl p-4 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,220,120,0.15)] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}
                >
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-3">
                    <CheckCircle className="w-3.5 h-3.5" />
                    TARAMA TAMAMLANDI
                  </div>

                  <h4 className="text-white font-bold text-base mb-3">
                    🍗 Tavuk Izgara <span className="text-white/50 font-normal text-sm">240g</span>
                  </h4>

                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {macroData.map((macro, i) => (
                      <div key={i} className="text-center bg-white/[0.04] rounded-lg p-2">
                        <div className="text-[10px] text-white/40 mb-1">{macro.label.slice(0, 4)}</div>
                        <div className="text-sm font-bold text-white">{animatedMacros[i]}<span className="text-[8px] text-white/30">{macro.unit === 'kcal' ? '' : macro.unit}</span></div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      <span className="text-[10px] text-white/40">Güvenilirlik</span>
                    </div>
                    <span className="text-emerald-400 font-bold text-xs">%95</span>
                  </div>
                </div>

                {/* ===== Camera Button ===== */}
                <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${!isScanning && !showResults ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                  <button
                    onClick={startScan}
                    className="px-8 py-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,220,120,0.4)] border-2 border-white/20 active:scale-95 transition-transform"
                  >
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-white font-bold text-sm">Tarat</span>
                  </button>
                </div>

                {/* Restart Button */}
                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${showResults ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`} style={{ transitionDelay: '300ms' }}>
                  <button
                    onClick={startScan}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(16,220,120,0.3)] border border-white/10 active:scale-95 transition-transform flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Tekrar Tara
                  </button>
                </div>
              </div>
            </PhoneMockup>

            {/* ===== Floating Macro Result Cards (outside phone) ===== */}
            {/* LEFT side cards */}
            {macroData.slice(0, 2).map((macro, i) => (
              <div
                key={`left-${i}`}
                className={`absolute z-20 bg-[#0f172a]/90 backdrop-blur-xl rounded-xl p-3 border border-white/10 shadow-xl transition-all duration-500 backface-hidden ${showResults ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-8 scale-90 pointer-events-none'}`}
                style={{
                  left: '-15px',
                  top: `${130 + i * 95}px`,
                  width: '130px',
                  transitionDelay: `${300 + i * 150}ms`
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${macro.color}20` }}>
                    <macro.icon className="w-3 h-3" style={{ color: macro.color }} />
                  </div>
                  <span className="text-[9px] text-white/50 font-medium">{macro.label}</span>
                </div>
                <div className="text-base font-extrabold text-white">
                  {animatedMacros[i]}<span className="text-[9px] font-normal text-white/30 ml-0.5">{macro.unit}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                  {/* Optimized Progress Bar */}
                  <div
                    className="h-full rounded-full origin-left"
                    style={{
                      backgroundColor: macro.color,
                      transform: `scaleX(${animatedMacros[i] / macro.max})`,
                      transition: 'transform 0.5s ease-out',
                      willChange: 'transform',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            ))}

            {/* RIGHT side cards */}
            {macroData.slice(2, 4).map((macro, i) => (
              <div
                key={`right-${i}`}
                className={`absolute z-20 bg-[#0f172a]/90 backdrop-blur-xl rounded-xl p-3 border border-white/10 shadow-xl transition-all duration-500 backface-hidden ${showResults ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-8 scale-90 pointer-events-none'}`}
                style={{
                  right: '-15px',
                  top: `${150 + i * 95}px`,
                  width: '130px',
                  transitionDelay: `${400 + i * 150}ms`
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${macro.color}20` }}>
                    <macro.icon className="w-3 h-3" style={{ color: macro.color }} />
                  </div>
                  <span className="text-[9px] text-white/50 font-medium">{macro.label}</span>
                </div>
                <div className="text-base font-extrabold text-white">
                  {animatedMacros[i + 2]}<span className="text-[9px] font-normal text-white/30 ml-0.5">{macro.unit}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
                  {/* Optimized Progress Bar */}
                  <div
                    className="h-full rounded-full origin-left"
                    style={{
                      backgroundColor: macro.color,
                      transform: `scaleX(${animatedMacros[i + 2] / macro.max})`,
                      transition: 'transform 0.5s ease-out',
                      willChange: 'transform',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Floating AI Badge - CSS Animation */}
            <div
              className="absolute -top-3 -left-2 lg:left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-[0_0_20px_rgba(16,220,120,0.3)] flex items-center gap-1.5 z-10 animate-bounce-slow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Powered
            </div>

          </div>

        </div >
      </div >

      <style jsx>{`
        @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes scan {
            0% { top: 8%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 92%; opacity: 0; }
        }
        @keyframes bounce-slow {
            0%, 100% { transform: translateY(-4px); }
            50% { transform: translateY(4px); }
        }
        
        .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
        }
        .animate-scan {
            animation: scan 2.5s linear infinite;
        }
        .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
        }
        .backface-hidden {
            backface-visibility: hidden;
        }
      `}</style>
    </section >
  )
}
