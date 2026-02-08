'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Camera, Zap, Brain, CheckCircle } from 'lucide-react'

export default function VisionNutrition() {
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

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
  }

  useEffect(() => {
    if (isScanning && scanProgress < 100) {
      const timer = setTimeout(() => {
        setScanProgress(prev => {
          const next = Math.min(prev + 2, 100)

          // Update step based on progress
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
      }, 500)
    }
  }, [isScanning, scanProgress])

  return (
    <section id="beslenme" className="py-32 px-6 bg-[#0A1628]">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#1A2942] rounded-3xl border border-white/5 p-8 md:p-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT: Phone Mockup with Real Food */}
            <div className="relative">
              {/* Phone Frame */}
              <div className="relative w-[320px] h-[640px] mx-auto">
                {/* Phone Body */}
                <div className="absolute inset-0 bg-[#1A2942] rounded-[3rem] shadow-2xl border-8 border-[#0A1628]">
                  {/* Screen */}
                  <div className="absolute inset-4 bg-[#0A1628] rounded-[2.5rem] overflow-hidden">

                    {/* Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent z-20 flex items-center justify-between px-6">
                      <span className="text-xs text-white/80">9:41</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 text-white/80">📶</div>
                        <div className="w-4 h-4 text-white/80">🔋</div>
                      </div>
                    </div>

                    {/* Real Food Image */}
                    <div className="relative w-full h-full">
                      <img
                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=1200&fit=crop&q=80"
                        alt="Delicious meal"
                        className="w-full h-full object-cover"
                      />

                      {/* Scanning Animation Overlay */}
                      <AnimatePresence>
                        {isScanning && (
                          <>
                            {/* Dark overlay */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.7 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                            />

                            {/* Scan Grid */}
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0"
                              style={{
                                backgroundImage: `
                                  linear-gradient(to right, rgba(16, 220, 120, 0.1) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(16, 220, 120, 0.1) 1px, transparent 1px)
                                `,
                                backgroundSize: '20px 20px'
                              }}
                            />

                            {/* Horizontal Scan Line */}
                            <motion.div
                              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#10DC78] to-transparent shadow-[0_0_20px_rgba(16,220,120,0.8)]"
                              animate={{
                                top: ['10%', '90%', '10%']
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'linear'
                              }}
                            />

                            {/* Vertical Scan Line */}
                            <motion.div
                              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-[#10DC78] to-transparent shadow-[0_0_20px_rgba(16,220,120,0.8)]"
                              animate={{
                                left: ['10%', '90%', '10%']
                              }}
                              transition={{
                                duration: 2.5,
                                repeat: Infinity,
                                ease: 'linear'
                              }}
                            />

                            {/* Corner Brackets */}
                            {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((position, i) => (
                              <motion.div
                                key={i}
                                className={`absolute ${position} w-12 h-12`}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                  opacity: [0.5, 1, 0.5],
                                  scale: [0.8, 1, 0.8]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: i * 0.2
                                }}
                              >
                                <div className="w-full h-full border-2 border-[#10DC78] rounded-lg"
                                  style={{
                                    borderWidth: i % 2 === 0 ? '2px 0 0 2px' : '0 2px 2px 0'
                                  }}
                                />
                              </motion.div>
                            ))}

                            {/* Scan Progress Card */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute top-20 left-4 right-4 bg-[#1A2942]/90 backdrop-blur-md rounded-2xl p-4 border border-[#10DC78]/30"
                            >
                              {/* Header */}
                              <div className="flex items-center gap-2 text-[#10DC78] font-bold text-sm mb-3">
                                <motion.div
                                  className="w-2 h-2 bg-[#10DC78] rounded-full"
                                  animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [1, 0.5, 1]
                                  }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity
                                  }}
                                />
                                Taranıyor...
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full h-2 bg-[#0A1628]/50 rounded-full overflow-hidden mb-3">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-[#10DC78] to-[#0EA968] rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${scanProgress}%` }}
                                  transition={{ duration: 0.3 }}
                                />
                              </div>

                              {/* Current Step */}
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
                                  <span>{scanSteps[currentStep]?.text}</span>
                                </motion.div>
                              </AnimatePresence>

                              {/* Percentage */}
                              <div className="text-right text-[#10DC78] font-bold text-lg mt-2">
                                {scanProgress}%
                              </div>
                            </motion.div>

                            {/* Detection Points */}
                            {[
                              { x: 30, y: 35, delay: 0 },
                              { x: 70, y: 40, delay: 0.3 },
                              { x: 50, y: 60, delay: 0.6 },
                              { x: 35, y: 75, delay: 0.9 }
                            ].map((point, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-3 h-3"
                                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                  scale: [0, 1.5, 1],
                                  opacity: [0, 1, 1]
                                }}
                                transition={{
                                  duration: 0.5,
                                  delay: point.delay
                                }}
                              >
                                <div className="w-full h-full bg-[#10DC78] rounded-full shadow-[0_0_10px_rgba(16,220,120,0.8)]" />
                                <motion.div
                                  className="absolute inset-0 bg-[#10DC78]/30 rounded-full"
                                  animate={{
                                    scale: [1, 2, 1],
                                    opacity: [0.5, 0, 0.5]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: point.delay
                                  }}
                                />
                              </motion.div>
                            ))}
                          </>
                        )}
                      </AnimatePresence>

                      {/* Results Card */}
                      <AnimatePresence>
                        {showResults && (
                          <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="absolute bottom-4 left-4 right-4 bg-[#1A2942]/95 backdrop-blur-md rounded-2xl p-4 border-2 border-[#10DC78]"
                          >
                            {/* Success Header */}
                            <div className="flex items-center gap-2 text-[#10DC78] font-bold text-sm mb-3">
                              <CheckCircle className="w-4 h-4" />
                              TARAMA TAMAMLANDI
                            </div>

                            {/* Food Name */}
                            <h4 className="text-white font-bold text-lg mb-2">
                              Tavuk Izgara: 240g
                            </h4>

                            {/* Nutrients Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="bg-[#0A1628]/50 rounded-lg p-2">
                                <div className="text-[#94A3B8] text-xs">Protein</div>
                                <div className="text-white font-bold">52g</div>
                              </div>
                              <div className="bg-[#0A1628]/50 rounded-lg p-2">
                                <div className="text-[#94A3B8] text-xs">Kalori</div>
                                <div className="text-white font-bold">380</div>
                              </div>
                              <div className="bg-[#0A1628]/50 rounded-lg p-2">
                                <div className="text-[#94A3B8] text-xs">Karb</div>
                                <div className="text-white font-bold">8g</div>
                              </div>
                              <div className="bg-[#0A1628]/50 rounded-lg p-2">
                                <div className="text-[#94A3B8] text-xs">Yağ</div>
                                <div className="text-white font-bold">12g</div>
                              </div>
                            </div>

                            {/* Confidence */}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#94A3B8]">Güvenilirlik</span>
                              <span className="text-[#10DC78] font-bold">%95</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Scan Button */}
                      {!isScanning && !showResults && (
                        <motion.button
                          onClick={startScan}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-[#10DC78] to-[#0EA968] rounded-full flex items-center justify-center shadow-lg shadow-[#10DC78]/30"
                        >
                          <Camera className="w-8 h-8 text-white" />
                        </motion.button>
                      )}

                      {/* Restart Button */}
                      {showResults && (
                        <motion.button
                          onClick={startScan}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-br from-[#10DC78] to-[#0EA968] text-white rounded-xl font-bold text-sm shadow-lg"
                        >
                          Tekrar Tara
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Home Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                className="absolute -top-4 -right-4 bg-gradient-to-br from-[#10DC78] to-[#0EA968] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg"
                animate={{
                  y: [-5, 5, -5],
                  rotate: [-2, 2, -2]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                AI Powered 🤖
              </motion.div>
            </div>

            {/* RIGHT: Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#10DC78]/10 border border-[#10DC78]/30 rounded-full mb-6">
                <Camera className="w-4 h-4 text-[#10DC78]" />
                <span className="text-sm font-bold text-[#10DC78]">VISION AI</span>
              </div>

              {/* Title */}
              <h2 className="text-5xl font-bold text-white mb-6">
                Vision <span className="text-[#10DC78]">Nutrition</span>
              </h2>

              {/* Description */}
              <p className="text-xl text-[#94A3B8] mb-8 leading-relaxed">
                Yemeğinin fotoğrafını çek, ZEVO besin değerlerini anında hesaplasın.
                Computer vision teknolojisi ile %95 doğruluk oranı.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  {
                    icon: <Zap className="w-6 h-6 text-[#10DC78]" />,
                    title: 'Anında Tanıma',
                    desc: 'Saniyeler içinde yemek türü ve porsiyon tespiti'
                  },
                  {
                    icon: <Brain className="w-6 h-6 text-[#10DC78]" />,
                    title: 'Akıllı Hesaplama',
                    desc: 'AI ile makro ve mikro besin değerleri analizi'
                  },
                  {
                    icon: <CheckCircle className="w-6 h-6 text-[#10DC78]" />,
                    title: 'Yüksek Doğruluk',
                    desc: 'Yüzlerce Türk yemeği veritabanı ile %95 doğruluk'
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-4 items-start bg-[#0A1628]/50 rounded-xl p-4 border border-white/5 hover:border-[#10DC78]/30 transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-[#10DC78] to-[#0EA968] rounded-xl flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-bold text-white mb-1">{item.title}</div>
                      <div className="text-sm text-[#94A3B8]">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-8 px-8 py-4 bg-gradient-to-br from-[#10DC78] to-[#0EA968] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#10DC78]/30 transition-all"
              >
                Hemen Dene
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
