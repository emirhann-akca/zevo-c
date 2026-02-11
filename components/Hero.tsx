'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Play } from 'lucide-react'

export default function Hero() {
  const [comingSoon, setComingSoon] = useState(false)
  return (
    <section id="anasayfa" className="min-h-screen bg-dark-primary relative overflow-hidden">
      {/* Subtle emerald glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-96 h-96 bg-emerald-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-primary/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-primary/10 border border-emerald-primary/30 rounded-full mb-6"
            >
              <motion.div
                className="w-2 h-2 bg-emerald-primary rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-bold text-emerald-primary">AI-Powered Training</span>
            </motion.div>

            {/* Title */}
            <h1 id="performans" className="scroll-mt-32 text-6xl font-bold text-white mb-6 leading-tight">
              Performansını
              <span className="text-emerald-primary"> Geliştir</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-text-muted mb-8 leading-relaxed">
              Yapay zeka destekli performans analiziyle seni geliştirirken,
              yeteneklerini sergileyebileceğin bir vitrin sunar.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setComingSoon(true);
                  setTimeout(() => setComingSoon(false), 2000);
                }}
                className="px-8 py-4 gradient-primary text-white rounded-xl font-bold shadow-lg shadow-emerald-primary/30 flex items-center justify-center gap-2 min-w-[200px]"
              >
                <AnimatePresence mode='wait'>
                  {comingSoon ? (
                    <motion.span
                      key="soon"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      Çok Yakında 🚀
                    </motion.span>
                  ) : (
                    <motion.span
                      key="default"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      Hemen İndir
                      <ChevronRight className="w-5 h-5" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white/5 text-white rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Demo İzle
              </motion.button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-8">
              {[
                { value: '2.5K+', label: 'Aktif Sporcu' },
                { value: '12', label: 'Kulüp' },
                { value: '%42', label: 'Gelişim Artışı' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-text-muted mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Phone Frame */}
            <div className="relative w-[320px] h-[640px] mx-auto">
              <div className="absolute inset-0 bg-dark-secondary rounded-[3rem] shadow-2xl shadow-black/50 p-4">
                <div className="w-full h-full bg-dark-primary rounded-[2.5rem] overflow-hidden">
                  {/* Status Bar */}
                  <div className="h-12 flex items-center justify-between px-6 pt-2">
                    <span className="text-xs font-bold text-white">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-3 border border-white rounded-sm" />
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="p-4 space-y-3">
                    {/* Calorie Card - Dark */}
                    <div className="bg-dark-secondary rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-text-muted">Başarmaya Kalan</span>
                        <span className="text-xs font-bold text-emerald-primary">%75</span>
                      </div>
                      <div className="w-full h-2 bg-dark-tertiary rounded-full overflow-hidden mb-2">
                        <motion.div
                          className="h-full gradient-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>

                    {/* Workout Card - Emerald Gradient */}
                    <a
                      href="#ozellikler"
                      className="gradient-primary rounded-2xl p-4 relative overflow-hidden block cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('ozellikler')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10 rounded-2xl" />
                      <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 matte-icon rounded-xl flex items-center justify-center">
                            <span className="text-2xl">💪</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">Antrenman</h4>
                            <p className="text-xs text-white/80">Başla</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/80 absolute bottom-4 right-0" />
                      </div>
                    </a>

                    {/* Beslenme */}
                    <a
                      href="#beslenme"
                      className="gradient-primary rounded-2xl p-3 relative overflow-hidden block cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('beslenme')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10 rounded-2xl" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 matte-icon rounded-xl flex items-center justify-center">
                            <span className="text-xl">🍎</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Beslenme</h4>
                            <p className="text-xs text-white/80">Kalori Takibi</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/80" />
                      </div>
                    </a>

                    {/* PvP Arena */}
                    <a
                      href="#pvp-arena"
                      className="gradient-primary rounded-2xl p-3 relative overflow-hidden block cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('pvp-arena')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10 rounded-2xl" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 matte-icon rounded-xl flex items-center justify-center">
                            <span className="text-xl">🏆</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">PvP Arena</h4>
                            <p className="text-xs text-white/80">Yarış</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/80" />
                      </div>
                    </a>

                    {/* Ekipler */}
                    <a
                      href="#ekipler"
                      className="gradient-primary rounded-2xl p-3 relative overflow-hidden block cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('ekipler')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10 rounded-2xl" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 matte-icon rounded-xl flex items-center justify-center">
                            <span className="text-xl">👥</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">Ekipler</h4>
                            <p className="text-xs text-white/80">Takımını Kur</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/80" />
                      </div>
                    </a>

                    {/* AI Koç */}
                    <a
                      href="#ai-koc"
                      className="gradient-primary rounded-2xl p-3 relative overflow-hidden block cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('ai-koc')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <div className="absolute inset-0 bg-black/10 rounded-2xl" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 matte-icon rounded-xl flex items-center justify-center">
                            <span className="text-xl">🧠</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">AI Koç</h4>
                            <p className="text-xs text-white/80">Koçluk Al</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/80" />
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-dark-secondary rounded-b-2xl z-10" />
            </div>

            {/* Floating Badge - Goal */}
            <motion.div
              className="absolute -top-8 -right-8 bg-dark-secondary border border-white/10 rounded-2xl p-4 shadow-lg"
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-xs text-text-muted">Hedef</div>
            </motion.div>

            {/* Floating Badge - Strength */}
            <motion.div
              className="absolute -bottom-4 -left-8 bg-dark-secondary border border-white/10 rounded-2xl p-4 shadow-lg"
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            >
              <div className="text-3xl mb-1">💪</div>
              <div className="text-xs text-text-muted">Güç</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
