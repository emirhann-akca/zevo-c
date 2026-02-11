'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Camera, Zap, Brain, CheckCircle, Sparkles, Eye, Apple, Flame, Droplets, Target } from 'lucide-react'

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
    title: 'Türk Mutfağı Uzmanı',
    desc: 'Yüzlerce Türk yemeği veritabanıyla %95 doğruluk oranı',
    gradient: 'from-cyan-500 to-emerald-500'
  }
]

const stats = [
  { value: '%95', label: 'Doğruluk', suffix: '' },
  { value: '500+', label: 'Türk Yemeği', suffix: '' },
  { value: '<2s', label: 'Analiz Süresi', suffix: '' },
]

export default function VisionNutrition() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [animatedMacros, setAnimatedMacros] = useState(macroData.map(() => 0))

  const scanSteps = [
    { progress: 20, text: 'Görüntü analiz ediliyor...', icon: '🔍' },
    { progress: 40, text: 'Yemek türü tespit ediliyor...', icon: '🍽️' },
    { progress: 60, text: 'Porsiyon hesaplanıyor...', icon: '⚖️' },
    { progress: 80, text: 'Besin değerleri belirleniyor...', icon: '🧮' },
    { progress: 100, text: 'Sonuçlar hazırlanıyor...', icon: '✅' }
  ]

  const startScan = () => {
    setIsScanning(true)
    setScanProgress(0)
    setShowResults(false)
    setCurrentStep(0)
    setAnimatedMacros(macroData.map(() => 0))
  }

  useEffect(() => {
    if (isScanning && scanProgress < 100) {
      const timer = setTimeout(() => {
        setScanProgress(prev => {
          const next = Math.min(prev + 2, 100)
          const step = scanSteps.findIndex(s => next <= s.progress)
          setCurrentStep(step >= 0 ? step : scanSteps.length - 1)
          return next
        })
      }, 50)
      return () => clearTimeout(timer)
    }

    if (scanProgress === 100) {
      setTimeout(() => {
        setIsScanning(false)
        setShowResults(true)
        // Animate macro values
        macroData.forEach((macro, i) => {
          let current = 0
          const increment = macro.value / 30
          const interval = setInterval(() => {
            current += increment
            if (current >= macro.value) {
              current = macro.value
              clearInterval(interval)
            }
            setAnimatedMacros(prev => {
              const newVals = [...prev]
              newVals[i] = Math.round(current)
              return newVals
            })
          }, 30)
        })
      }, 500)
    }
  }, [isScanning, scanProgress])

  return (
    <section id="beslenme" className="relative min-h-screen py-24 lg:py-20 px-6 bg-[#0a0e1a] overflow-hidden flex items-center">

      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating orbs */}
        <motion.div
          className="absolute top-20 right-[10%] w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 220, 120, 0.12) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-10 left-[5%] w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.1) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
          animate={{
            y: [0, 40, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
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

          {/* ==================== RIGHT - CONTENT (order-last on lg) ==================== */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative lg:order-last"
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-full mb-8"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Camera className="w-4 h-4 text-emerald-400" />
              </motion.div>
              <span className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent uppercase tracking-wider">Vision AI</span>
            </motion.div>

            {/* Title */}
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white mb-4 leading-[1.1]">
              Yemeğini Tarat,{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Besinlerini Öğren
              </span>
            </h2>

            {/* Description */}
            <p className="text-base lg:text-lg text-white/60 mb-8 leading-relaxed max-w-lg">
              Yemeğinin fotoğrafını çek, <span className="text-white/90 font-medium">ZEVO besin değerlerini anında hesaplasın.</span> Computer vision teknolojisi ile Türk mutfağında uzmanlaşmış AI modeli.
            </p>

            {/* Feature Cards */}
            <div className="space-y-3 mb-8">
              {features.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  whileHover={{ x: 6, scale: 1.01 }}
                  className="group flex gap-3 items-center p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow flex-shrink-0`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm mb-0.5 group-hover:text-emerald-400 transition-colors">{item.title}</div>
                    <div className="text-xs text-white/50">{item.desc}</div>
                  </div>
                  <motion.div
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                  >
                    <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </motion.div>
              ))}
            </div>


            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-4"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  className="relative group text-center p-3 bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-xl overflow-hidden"
                  whileHover={{ scale: 1.03, borderColor: 'rgba(16, 220, 120, 0.3)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className="text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* ==================== LEFT - PHONE MOCKUP (order-first on lg) ==================== */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex justify-center lg:order-first"
            style={{ willChange: 'transform' }}
          >
            {/* Decorative glow behind phone */}
            <div
              className="absolute -inset-8 rounded-[50px] opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 220, 120, 0.15) 0%, rgba(20, 184, 166, 0.08) 50%, rgba(6, 182, 212, 0.12) 100%)',
                filter: 'blur(50px)'
              }}
            />

            {/* Phone Container */}
            <div className="relative w-[260px] h-[540px]">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3rem] shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden">

                {/* Inner Screen */}
                <div className="absolute inset-[8px] bg-[#0f172a] rounded-[2.5rem] overflow-hidden">

                  {/* Top Notch */}
                  <div className="absolute top-0 inset-x-0 h-8 bg-black rounded-b-2xl w-36 mx-auto z-50" />

                  {/* Status Bar */}
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 to-transparent z-40 flex items-center justify-between px-8">
                    <span className="text-[10px] text-white/80 font-medium">9:41</span>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-3.5 h-2 border border-white/60 rounded-sm relative">
                        <div className="absolute inset-[1px] bg-emerald-400 rounded-[1px]" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Food Image */}
                  <div className="relative w-full h-full">
                    <img
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=1200&fit=crop&q=80"
                      alt="Healthy meal"
                      className="w-full h-full object-cover"
                    />

                    {/* Subtle gradient overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 to-transparent z-10" />

                    {/* ===== Scanning Overlay ===== */}
                    <AnimatePresence>
                      {isScanning && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.75 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 z-20"
                          />

                          {/* Scan Grid */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20"
                            style={{
                              backgroundImage: `
                                linear-gradient(to right, rgba(16, 220, 120, 0.08) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(16, 220, 120, 0.08) 1px, transparent 1px)
                              `,
                              backgroundSize: '20px 20px'
                            }}
                          />

                          {/* Scan Line */}
                          <motion.div
                            className="absolute left-0 right-0 h-[2px] z-30"
                            style={{
                              background: 'linear-gradient(90deg, transparent, #10DC78, transparent)',
                              boxShadow: '0 0 30px rgba(16, 220, 120, 0.8), 0 0 60px rgba(16, 220, 120, 0.4)'
                            }}
                            animate={{ top: ['8%', '92%', '8%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                          />

                          {/* Corner Brackets */}
                          {[
                            'top-6 left-6 border-t-2 border-l-2',
                            'top-6 right-6 border-t-2 border-r-2',
                            'bottom-6 left-6 border-b-2 border-l-2',
                            'bottom-6 right-6 border-b-2 border-r-2'
                          ].map((classes, i) => (
                            <motion.div
                              key={i}
                              className={`absolute ${classes} w-10 h-10 border-emerald-400 rounded-sm z-30`}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1, 0.9] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}

                          {/* Progress Card */}
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-20 left-4 right-4 z-30 bg-[#0f172a]/90 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30"
                          >
                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
                              <motion.div
                                className="w-2 h-2 bg-emerald-400 rounded-full"
                                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                              Taranıyor...
                            </div>

                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-3">
                              <motion.div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${scanProgress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>

                            <AnimatePresence mode="wait">
                              <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-center gap-2 text-white text-xs"
                              >
                                <span className="text-lg">{scanSteps[currentStep]?.icon}</span>
                                <span className="text-white/80">{scanSteps[currentStep]?.text}</span>
                              </motion.div>
                            </AnimatePresence>

                            <div className="text-right text-emerald-400 font-bold text-lg mt-2">
                              {scanProgress}%
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>

                    {/* ===== Results Card ===== */}
                    <AnimatePresence>
                      {showResults && (
                        <motion.div
                          initial={{ opacity: 0, y: 60 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 60 }}
                          transition={{ type: 'spring', damping: 20 }}
                          className="absolute bottom-20 left-3 right-3 z-30 bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl p-4 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,220,120,0.15)]"
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
                                <div className="text-sm font-bold text-white">{macro.value}<span className="text-[8px] text-white/30">{macro.unit === 'kcal' ? '' : macro.unit}</span></div>
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
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* ===== Camera / Scan Button ===== */}
                    {!isScanning && !showResults && (
                      <motion.button
                        onClick={startScan}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 px-8 py-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,220,120,0.4)] border-2 border-white/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Camera className="w-6 h-6 text-white" />
                        <span className="text-white font-bold text-sm">Tarat</span>
                      </motion.button>
                    )}

                    {/* Restart Button */}
                    {showResults && (
                      <motion.button
                        onClick={startScan}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(16,220,120,0.3)] border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          Tekrar Tara
                        </span>
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full z-50" />
              </div>
            </div>

            {/* ===== Floating Macro Result Cards (outside phone) ===== */}
            <AnimatePresence>
              {showResults && (
                <>
                  {/* LEFT side cards — Protein & Kalori */}
                  {macroData.slice(0, 2).map((macro, i) => (
                    <motion.div
                      key={`left-${i}`}
                      initial={{ opacity: 0, x: -30, scale: 0.85 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -30, scale: 0.85 }}
                      transition={{ delay: i * 0.15 + 0.3, type: 'spring', damping: 18 }}
                      className="absolute z-20 bg-[#0f172a]/90 backdrop-blur-xl rounded-xl p-3 border border-white/10 shadow-xl"
                      style={{
                        left: '-15px',
                        top: `${130 + i * 95}px`,
                        width: '130px',
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
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: macro.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(animatedMacros[i] / macro.max) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </motion.div>
                  ))}

                  {/* RIGHT side cards — Karbonhidrat & Yağ */}
                  {macroData.slice(2, 4).map((macro, i) => (
                    <motion.div
                      key={`right-${i}`}
                      initial={{ opacity: 0, x: 30, scale: 0.85 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 30, scale: 0.85 }}
                      transition={{ delay: i * 0.15 + 0.4, type: 'spring', damping: 18 }}
                      className="absolute z-20 bg-[#0f172a]/90 backdrop-blur-xl rounded-xl p-3 border border-white/10 shadow-xl"
                      style={{
                        right: '-15px',
                        top: `${150 + i * 95}px`,
                        width: '130px',
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
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: macro.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(animatedMacros[i + 2] / macro.max) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Floating AI Badge */}
            <motion.div
              className="absolute -top-3 -left-2 lg:left-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-[0_0_20px_rgba(16,220,120,0.3)] flex items-center gap-1.5 z-10"
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Powered
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  )
}
