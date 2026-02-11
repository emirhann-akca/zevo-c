'use client'

import { motion } from 'framer-motion'
import { Brain, ThumbsUp, ThumbsDown, Sparkles, Zap, Target, TrendingUp, Volume2, MessageCircle } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import SectionHeader from '@/components/ui/SectionHeader'
import PhoneMockup from '@/components/ui/PhoneMockup'

const messages = [
  { type: 'user', text: 'Şut tekniğimi nasıl geliştirebilirim?', time: '14:32' },
  { type: 'ai', text: 'Bilek açınızı analiz ettim. 15° daha yukarı kaldırmanız rotasyonu %23 artıracak. Video göndereceğim.', time: '14:33' },
  { type: 'user', text: 'Bugünkü performansım nasıldı?', time: '14:35' },
  { type: 'ai', text: 'Harika! Bugün 847 kalori yaktın ve 3 kişisel rekor kırdın. Devam et! 💪', time: '14:36' },
]

const features = [
  {
    icon: Target,
    title: 'Gerçek Zamanlı Düzeltme',
    desc: 'Her hareketi analiz eder, anında geri bildirim verir',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    icon: TrendingUp,
    title: 'Gelişim Takibi',
    desc: 'Haftalık progress raporları ve hedef belirleme',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Volume2,
    title: 'Sesli Koçluk',
    desc: 'Antrenman sırasında sesli talimatlar ve motivasyon',
    gradient: 'from-purple-500 to-pink-500'
  }
]

const stats = [
  { value: '94%', label: 'Doğruluk', icon: Zap },
  { value: '2.5K', label: 'Günlük Analiz', icon: Brain },
  { value: '24/7', label: 'Aktif Destek', icon: MessageCircle },
]

export default function AICoach() {
  const [activeMessage, setActiveMessage] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  // Visibility Check
  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '50px' }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let timeout: NodeJS.Timeout

    const interval = setInterval(() => {
      setIsTyping(true)
      timeout = setTimeout(() => {
        setIsTyping(false)
        setActiveMessage(prev => (prev + 1) % messages.length)
      }, 1500)
    }, 4000)

    return () => {
      clearInterval(interval)
      if (timeout) clearTimeout(timeout)
    }
  }, [isVisible])

  return (
    <section ref={sectionRef} id="ai-koc" className="relative py-16 lg:py-20 px-6 bg-[#0a0e1a] overflow-hidden">
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      {/* Animated Background Elements (Only animate if visible) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating orb 1 - Optimized */}
        <motion.div
          className="absolute top-20 left-[10%] w-72 h-72 rounded-full will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0) 70%)',
          }}
          animate={isVisible ? {
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Floating orb 2 - Optimized */}
        <motion.div
          className="absolute bottom-20 right-[15%] w-96 h-96 rounded-full will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(20, 184, 166, 0.12) 0%, rgba(20, 184, 166, 0) 70%)',
          }}
          animate={isVisible ? {
            y: [0, 40, 0],
            scale: [1, 0.9, 1],
          } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* ==================== LEFT - ENHANCED CHAT DEMO ==================== */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            {/* Decorative glow behind chat */}
            {/* Decorative glow behind chat - Optimized (No Blur) */}
            <div
              className="absolute -inset-4 rounded-[40px] opacity-40"
              style={{
                background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
              }}
            />

            {/* Chat Container - Wrapped in PhoneMockup */}
            <PhoneMockup className="w-full max-w-sm mx-auto" glowColor="rgba(16, 185, 129, 0.15)">
              <div className="h-full flex flex-col pt-12 px-2 bg-gradient-to-b from-[#0a0e1a] to-[#0d1221]">
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <div
                    className="absolute -top-1/2 -left-1/2 w-full h-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)'
                    }}
                  />
                </div>

                {/* Shine effect */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  <div
                    className="absolute -top-1/2 -left-1/2 w-full h-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)'
                    }}
                  />
                </div>

                {/* Header */}
                <div className="relative flex items-center gap-4 mb-6 pb-5 border-b border-white/10">
                  <motion.div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                  >
                    {/* Animated gradient background - Optimized to pause */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%)'
                      }}
                      animate={isVisible ? {
                        filter: ['hue-rotate(0deg)', 'hue-rotate(90deg)', 'hue-rotate(0deg)']
                      } : {}}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    />
                    <Brain className="w-5 h-5 text-white relative z-10" />

                    {/* Sparkle effect */}
                    <motion.div
                      className="absolute top-1 right-1"
                      animate={isVisible ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Sparkles className="w-3 h-3 text-white/80" />
                    </motion.div>
                  </motion.div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">AI Coach</h3>
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 rounded-full text-[8px] font-semibold text-emerald-400 uppercase tracking-wider">Pro</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="relative flex items-center justify-center w-2 h-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full z-10" />
                        <motion.div
                          className="absolute inset-0 bg-emerald-400 rounded-full"
                          animate={isVisible ? { scale: [1, 3], opacity: [0.4, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-xs text-emerald-400/80">Aktif • Yanıt süresi ~1s</span>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="space-y-3 mb-4 min-h-[180px]">
                  {messages.slice(0, activeMessage + 1).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <motion.div
                        className={`max-w-[85%] relative group ${msg.type === 'user'
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 rounded-2xl rounded-br-sm'
                          : 'bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-sm'
                          } p-4`}
                        whileHover={{ scale: 1.01 }}
                      >
                        {msg.type === 'ai' && (
                          <div className="absolute -left-2 -top-2 w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Brain className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <p className="text-white text-xs leading-relaxed">{msg.text}</p>
                        {msg.type === 'ai' && (
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-emerald-400 hover:bg-emerald-500/20 rounded-lg p-1 transition-all hover:scale-110">
                              <ThumbsUp className="w-3 h-3" />
                            </button>
                            <button className="text-red-400 hover:bg-red-500/20 rounded-lg p-1 transition-all hover:scale-110">
                              <ThumbsDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/[0.06] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-emerald-400 rounded-full"
                              style={{
                                animation: `bounce 0.6s infinite ease-in-out`,
                                animationDelay: `${i * 0.15}s`,
                                animationFillMode: 'both'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Input Area */}
                <div className="relative">
                  <div className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3">
                    <input
                      type="text"
                      placeholder="Koçuna bir şey sor..."
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                      readOnly
                    />
                    <motion.button
                      className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Sparkles className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </PhoneMockup>
          </motion.div>

          {/* ==================== RIGHT - CONTENT ==================== */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <SectionHeader
              badge="AI Coach"
              icon={<Brain className="w-4 h-4 text-emerald-400" />}
              title={<>Kişisel <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">AI Koçun</span></>}
              description={<>Sadece ne yapman gerektiğini söylemez, <span className="text-white/90 font-medium">nasıl yapman gerektiğini gösterir.</span> Hatalarını anında fark eder ve sesli/görsel geri bildirim verir.</>}
              align="left"
              className="mb-8"
            />

            {/* Feature Cards */}
            <div className="space-y-3 mb-6">
              {features.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  whileHover={{ x: 6, scale: 1.01 }}
                  className="group flex gap-3 items-center p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-xl transition-all cursor-pointer"
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
                  whileHover={{ scale: 1.03, borderColor: 'rgba(16, 185, 129, 0.3)' }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative">
                    <stat.icon className="w-4 h-4 text-emerald-400/50 mx-auto mb-1" />
                    <div className="text-xl lg:text-2xl font-extrabold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
