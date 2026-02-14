'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, Zap, Brain, CheckCircle, Eye, Apple, Flame, Droplets, Target, Database, Activity } from 'lucide-react'
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
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    shadowClass: 'group-hover:shadow-[0_8px_20px_-4px_rgba(52,211,153,0.3)]'
  },
  {
    icon: Brain,
    title: 'Akıllı Besin Analizi',
    desc: 'Makro ve mikro besin değerlerini AI modelleriyle hassas hesaplama',
    iconColor: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    shadowClass: 'group-hover:shadow-[0_8px_20px_-4px_rgba(45,212,191,0.3)]'
  },
  {
    icon: Database,
    title: 'Geniş Veri Tabanı',
    desc: 'Binlerce yemek ve besin türünü anında tanır.',
    iconColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    shadowClass: 'group-hover:shadow-[0_8px_20px_-4px_rgba(34,211,238,0.3)]'
  }
]

const stats = [
  { value: '%95', label: 'Doğruluk', icon: CheckCircle },
  { value: '5000+', label: 'Toplam Veri Sayısı', icon: Database },
  { value: '2s', label: 'Analiz Süresi', icon: Zap },
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
    <section id="beslenme" className="relative h-screen min-h-[800px] py-16 px-6 bg-[#0a0e1a] overflow-hidden flex items-center">

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

      <div className="max-w-7xl mx-auto relative w-full h-full flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">

          {/* ==================== LEFT - PHONE MOCKUP (55%) ==================== */}
          <div className="relative flex justify-center lg:order-first h-full items-center">
            <div className="relative transform lg:scale-110">
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
                    className={`absolute top-20 left-4 right-4 z-30 bg-[#0f172a]/90 backdrop-blur-none rounded-2xl p-4 border border-emerald-500/30 transition-all duration-300 transform ${isScanning ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
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

                  {/* ===== Results Card (CSS Transitions) - Matte Style ===== */}
                  <div
                    className={`absolute bottom-14 left-2 right-2 z-30 bg-[#0a0e1a]/95 rounded-2xl p-4 border border-white/10 shadow-[0_0_40px_rgba(16,220,120,0.15)] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}
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

                    <button
                      onClick={startScan}
                      className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                      <Camera className="w-4 h-4" />
                      Tekrar Tara
                    </button>
                  </div>

                  {/* ===== Camera Button (Start Scan) ===== */}
                  <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${!isScanning && !showResults ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                    <button
                      onClick={startScan}
                      className="px-8 py-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,220,120,0.4)] border-2 border-white/20 active:scale-95 transition-transform"
                    >
                      <Camera className="w-6 h-6 text-white" />
                      <span className="text-white font-bold text-sm">Tarat</span>
                    </button>
                  </div>

                </div>
              </PhoneMockup>
            </div>
          </div>
          {/* ==================== RIGHT - CONTENT (45%) ==================== */}
          <div className="relative lg:order-last pl-4">
            <SectionHeader
              icon={<Camera className="w-4 h-4" />}
              badge="Vision AI"
              title={<>Tabağını Tarat,{' '}<span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">İçindekini Gör</span></>}
              description={<>Yemeğinin fotoğrafını çek, Zevo makro ve mikro değerlerini anında hesaplasın. Görüntü işleme teknolojisiyle beslenmeni şansa bırakma.</>}
              className="mb-8"
              align="left"
            />

            {/* Feature Cards - AICoach Style */}
            <div className="space-y-4">
              {features.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-default">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bgColor} border ${item.borderColor} transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${item.shadowClass} flex-shrink-0`}>
                    <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className={`text-base font-bold text-white group-hover:${item.iconColor} transition-colors`}>{item.title}</p>
                    <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row - AICoach Style */}
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-8 lg:gap-12">
              {stats.map((stat, i) => (
                <div key={i} className="text-left group cursor-default">
                  <div className="text-xl lg:text-3xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{stat.value}</div>
                  <div className="flex items-center justify-start gap-1.5 text-[10px] text-white/40 font-medium uppercase tracking-wide group-hover:text-white/60 transition-colors">
                    <stat.icon className="w-3 h-3 text-emerald-500" />
                    {stat.label}
                  </div>
                </div>
              ))}
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
