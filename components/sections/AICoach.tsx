'use client'

import { useState, useEffect, useRef } from 'react'
import { Brain, Zap, Target, TrendingUp, Volume2, MessageCircle, MoreHorizontal, Send, Eye } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

const features = [
  {
    icon: Eye,
    title: 'Gerçek Zamanlı Düzeltme',
    desc: 'Her hareketi analiz eder, anında geri bildirim verir',
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    shadowClass: 'group-hover:shadow-[0_8px_20px_-4px_rgba(52,211,153,0.3)]'
  },
  {
    icon: TrendingUp,
    title: 'Gelişim Takibi',
    desc: 'Haftalık gelişim raporları ve hedef belirleme',
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    shadowClass: 'group-hover:shadow-[0_8px_20px_-4px_rgba(96,165,250,0.3)]'
  },

]

// ... (existing code)

{/* Feature Cards - Moved Up */ }
<div className="space-y-4">
  {features.map((item, i) => (
    <div key={i} className="flex items-center gap-4 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bgColor} border ${item.borderColor} transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${item.shadowClass}`}>
        <item.icon className={`w-7 h-7 ${item.iconColor}`} />
      </div>
      <div>
        <p className={`text-base font-bold text-white group-hover:${item.iconColor} transition-colors`}>{item.title}</p>
        <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
      </div>
    </div>
  ))}
</div>

const stats = [
  { value: '94%', label: 'Doğruluk', icon: Zap },
  { value: '2.5K', label: 'Günlük Analiz', icon: Brain },
  { value: '24/7', label: 'Aktif Destek', icon: MessageCircle },
]

interface ScriptStep {
  type: 'user' | 'ai' | 'typing'
  text?: string
  delay: number
}

export default function AICoach() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isChatStarted, setIsChatStarted] = useState(false)
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai', text: string }>>([])
  const [isTyping, setIsTyping] = useState(false)

  // Intersection Observer
  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
        if (!entry.isIntersecting) {
          // Reset when out of view
          setMessages([])
          setIsTyping(false)
          setIsChatStarted(false)
        }
      },
      { threshold: 0.15, rootMargin: '-50px 0px' }
    )
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  // Parchment Animation Delay
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setIsChatStarted(true)
      }, 600) // Wait for 600ms open animation
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom (without page jump)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Chat Loop Logic
  useEffect(() => {
    if (!isChatStarted) return

    let timeouts: NodeJS.Timeout[] = []
    let currentStep = 0
    let mounted = true

    const script: ScriptStep[] = [
      { type: 'user', text: 'Bugün bacak antrenmanı yaptım, form kontrolüm nasıldı?', delay: 1000 },
      { type: 'typing', delay: 1500 },
      { type: 'ai', text: 'Squat formunu analiz ettim 📊 Diz açın 85° ile mükemmel seviyede. Ancak topuk kalkışında %12 sapma var. Düzeltme videosu hazırladım.', delay: 200 }, // Fast response after typing
      { type: 'user', text: 'Kalori hedefime ne kadar yakınım?', delay: 2000 },
      { type: 'typing', delay: 1500 },
      { type: 'ai', text: 'Günlük hedefe %78 ulaştın 🔥 1,847 / 2,400 kcal. Protein alımın hedefin üstünde (142g), harika gidiyorsun!', delay: 200 } // Fast response after typing
    ]

    const runScript = () => {
      if (!mounted) return

      // Reset start
      if (currentStep === 0) {
        setMessages([])
        setIsTyping(false)
      }

      if (currentStep >= script.length) {
        // Loop finished, wait 4s then restart
        const restartTimeout = setTimeout(() => {
          if (!mounted) return
          setMessages([])
          currentStep = 0
          runScript()
        }, 4000)
        timeouts.push(restartTimeout)
        return
      }

      const step = script[currentStep]

      if (step.type === 'typing') {
        setIsTyping(true)
        const timeout = setTimeout(() => {
          if (!mounted) return
          setIsTyping(false)
          currentStep++
          runScript()
        }, step.delay)
        timeouts.push(timeout)
      } else {
        const timeout = setTimeout(() => {
          if (!mounted) return
          setMessages(prev => [...prev, { type: step.type as 'user' | 'ai', text: step.text! }])
          currentStep++
          runScript()
        }, step.delay)
        timeouts.push(timeout)
      }
    }

    runScript()

    return () => {
      mounted = false
      timeouts.forEach(clearTimeout)
    }
  }, [isChatStarted])


  return (
    <section ref={sectionRef} id="yapay-zeka-kocu" className="relative py-20 lg:py-24 px-6 bg-[#0a0e1a] overflow-hidden">

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">

          {/* ==================== LEFT - CHAT PANEL (%55-60) ==================== */}
          <div className="w-full lg:w-[55%] order-first">
            <div className="relative w-full max-w-[520px] mx-auto lg:mx-0">

              {/* Professional Ambient Glow - High Performance (No Blur) */}
              <div
                className="absolute -inset-px rounded-[24px] z-0 pointer-events-none transition-opacity duration-500"
                style={{
                  background: `
                    radial-gradient(80% 80% at 50% -20%, rgba(16, 220, 120, 0.15) 0%, transparent 60%),
                    radial-gradient(60% 60% at 100% 100%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
                    radial-gradient(40% 40% at 0% 80%, rgba(16, 220, 120, 0.05) 0%, transparent 50%)
                  `,
                }}
              />

              {/* Outer Bloom Layer - Creates depth behind the card */}
              <div
                className="absolute -inset-12 rounded-[60px] -z-10 pointer-events-none opacity-40"
                style={{
                  background: `
                     radial-gradient(circle at 50% 40%, rgba(16, 220, 120, 0.12) 0%, transparent 70%)
                   `
                }}
              />

              {/* Subtle Border Gradient Accent */}
              <div
                className="absolute -inset-[1px] rounded-[25px] pointer-events-none opacity-40 z-0"
                style={{
                  background: 'linear-gradient(160deg, rgba(16,220,120,0.3) 0%, transparent 20%, transparent 80%, rgba(20,184,166,0.2) 100%)',
                }}
              />

              {/* Chat Container */}
              <div
                className={`relative bg-[#0a0e1a]/80 border border-white/10 rounded-3xl p-6 min-h-[420px] flex flex-col shadow-2xl backdrop-blur-none origin-top`}
                style={{
                  transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                  opacity: isVisible ? 1 : 0,
                  transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease'
                }}
              >

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">AI Coach</h3>
                        <span className="px-2 py-0.5 bg-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-wider">PRO</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-400/80 font-medium">Aktif • Yanıt süresi ~1s</span>
                      </div>
                    </div>
                  </div>
                  <MoreHorizontal className="text-white/20 w-6 h-6" />
                </div>

                {/* Messages Area - Bottom Aligned */}
                <div ref={messagesContainerRef} className="min-h-[380px] space-y-4 mb-4 overflow-hidden flex flex-col">
                  {messages.map((msg, idx) => (
                    <div
                      key={`${idx}-${msg.text.slice(0, 10)}`}
                      className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      style={{
                        animation: 'chatIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                        opacity: 0,
                      }}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar for AI */}
                        {msg.type === 'ai' && (
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <Brain className="w-4 h-4 text-emerald-400" />
                          </div>
                        )}

                        {/* Bubble */}
                        <div className={`
                                            p-3.5 rounded-2xl text-sm leading-relaxed
                                            ${msg.type === 'user'
                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-none shadow-lg shadow-emerald-500/10'
                            : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-none'
                          }
                                        `}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex w-full justify-start animate-fade-in">
                      <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <Brain className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-bl-none flex items-center gap-1.5 h-12">
                          <div className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full animate-typing-dot" style={{ animationDelay: '0s' }} />
                          <div className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full animate-typing-dot" style={{ animationDelay: '0.2s' }} />
                          <div className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full animate-typing-dot" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="relative mt-auto shrink-0">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1.5 pl-5">
                    <input
                      type="text"
                      placeholder="Koçuna bir şey sor..."
                      className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                      disabled
                    />
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <Send className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ==================== RIGHT - CONTENT (%40-45) ==================== */}
          <div className="w-full lg:w-[45%] space-y-8">
            <SectionHeader
              badge="AI Coach"
              icon={<Brain className="w-4 h-4 text-emerald-400" />}
              title={<>Kişisel <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">AI Koç</span></>}
              description="Sadece ne yapacağını söylemez, nasıl yapacağını da gösterir. Hatalarını yargılamaz, doğrusunu öğretir. Aklına takılan her soruyu cevaplayan, gelişim yolculuğundaki antrenörün."
              align="left"
              className="mb-0"
            />

            {/* Feature Cards */}

            {/* Stats Row - Moved Up */}

            {/* Feature Cards - Moved Up */}
            <div className="space-y-4">
              {features.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.bgColor} border ${item.borderColor} transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${item.shadowClass}`}>
                    <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className={`text-base font-bold text-white group-hover:${item.iconColor} transition-colors`}>{item.title}</p>
                    <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats Row - Moved Down with left alignment */}
            <div className="flex items-center gap-8 lg:gap-12">
              {stats.map((stat, i) => (
                <div key={i} className="text-left group">
                  <div className="text-xl lg:text-2xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">{stat.value}</div>
                  <div className="flex items-center justify-start gap-1.5 text-[10px] text-white/40 font-medium uppercase tracking-wide group-hover:text-white/60 transition-colors">
                    <stat.icon className="w-3 h-3 text-emerald-500" />
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <a
              href="/chat"
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold rounded-2xl hover:shadow-xl hover:shadow-emerald-500/20 transition-all text-lg"
            >
              Şimdi Dene
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
