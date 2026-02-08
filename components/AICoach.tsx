'use client'

import { motion } from 'framer-motion'
import { Brain, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useState, useEffect } from 'react'

const messages = [
  { type: 'user', text: 'Şut tekniğimi nasıl geliştirebilirim?', time: '14:32' },
  { type: 'ai', text: 'Bilek açınızı analiz ettim. 15° daha yukarı kaldırmanız rotasyonu %23 artıracak. Video göndereceğim.', time: '14:33' },
  { type: 'user', text: 'Bugünkü performansım nasıldı?', time: '14:35' },
]

export default function AICoach() {
  const [activeMessage, setActiveMessage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessage(prev => (prev + 1) % messages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="ai-koc" className="py-24 px-6 bg-dark-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Chat Demo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Chat Container */}
            <div className="bg-dark-secondary rounded-3xl p-6 shadow-xl border border-white/5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="w-12 h-12 gradient-ai-coach rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">AI Coach</h3>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 bg-emerald-primary rounded-full"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-text-muted">Online</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="space-y-4 mb-4">
                {messages.slice(0, activeMessage + 1).map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.type === 'user'
                      ? 'bg-emerald-primary/10 border border-emerald-primary/30 rounded-2xl rounded-br-none'
                      : 'bg-dark-tertiary/50 border border-white/5 rounded-2xl rounded-bl-none'
                      } p-4`}>
                      <p className="text-white text-sm leading-relaxed">{msg.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-text-muted">{msg.time}</span>
                        {msg.type === 'ai' && (
                          <div className="flex gap-2">
                            <button className="text-emerald-primary hover:bg-emerald-primary/10 rounded-lg p-1.5 transition-colors">
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button className="text-red-500 hover:bg-red-500/10 rounded-lg p-1.5 transition-colors">
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Typing Indicator */}
              {activeMessage < messages.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-text-muted text-sm"
                >
                  <motion.div
                    className="flex gap-1"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 bg-text-muted rounded-full" />
                    <div className="w-2 h-2 bg-text-muted rounded-full" />
                    <div className="w-2 h-2 bg-text-muted rounded-full" />
                  </motion.div>
                  AI Coach yazıyor...
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600/10 border border-teal-600/30 rounded-full mb-6">
              <Brain className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-bold text-teal-600">AI COACH</span>
            </div>

            <h2 className="text-5xl font-bold text-white mb-6">
              Kişisel <span className="text-emerald-primary">AI Koçun</span>
            </h2>

            <p className="text-xl text-text-muted mb-8 leading-relaxed">
              Sadece ne yapman gerektiğini söylemez, nasıl yapman gerektiğini gösterir.
              Hatalarını anında fark eder ve sesli/görsel geri bildirim verir.
            </p>

            {/* Feature List */}
            <div className="space-y-4">
              {[
                { icon: '🎯', title: 'Gerçek Zamanlı Düzeltme', desc: 'Her hareketi analiz eder, anında geri bildirim verir' },
                { icon: '📈', title: 'Gelişim Takibi', desc: 'Haftalık progress raporları ve hedef belirleme' },
                { icon: '🔊', title: 'Sesli Koçluk', desc: 'Antrenman sırasında sesli talimatlar ve motivasyon' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="w-12 h-12 bg-emerald-primary/10 border border-emerald-primary/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div>
                    <div className="font-bold text-white mb-1">{item.title}</div>
                    <div className="text-sm text-text-muted">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 p-6 bg-dark-secondary rounded-2xl border border-white/5">
              {[
                { value: '94%', label: 'Doğruluk' },
                { value: '2.5K', label: 'Analizler' },
                { value: '24/7', label: 'Destek' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-emerald-primary">{stat.value}</div>
                  <div className="text-xs text-text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
