'use client'

import { motion } from 'framer-motion'
import SectionHeader from '@/components/ui/SectionHeader'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function About() {
  const { t } = useLanguage()
  return (
    <section id="hakkimizda" className="relative py-24 px-6 bg-dark-primary overflow-hidden">
      {/* Structural Background - Matching VisionNutrition but adapted for dark-primary */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Static Efficient Gradients */}
        <div
          className="absolute top-0 left-0 w-[500px] h-[500px] opacity-20"
          style={{
            background: 'radial-gradient(circle at center, rgba(16, 220, 120, 0.4) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[600px] h-[600px] opacity-10"
          style={{
            background: 'radial-gradient(circle at center, rgba(20, 184, 166, 0.4) 0%, transparent 70%)',
          }}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 220, 120, 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(16, 220, 120, 0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left - Content */}
          <div className="space-y-8">
            <SectionHeader
              badge={t.about.badge}
              title={<span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">{t.about.title}</span>}
              description={
                <div className="space-y-6 text-white/80">
                  <p>
                    {t.about.descriptionP1start}{' '}
                    <span className="text-white font-semibold">{t.about.descriptionP1highlight}</span>
                  </p>
                  <p>
                    {t.about.descriptionP2start}{' '}
                    <span className="relative inline-block overflow-hidden align-bottom">
                      <span className="text-emerald-400 font-semibold text-shadow-sm relative z-10">{t.about.descriptionP2highlight}</span>
                      <motion.span
                        className="absolute inset-0 z-20 pointer-events-none"
                        initial={{ x: '-100%' }}
                        whileInView={{ x: '100%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                        style={{
                          background: 'linear-gradient(90deg, transparent 0%, rgba(52,211,153,0.4) 40%, rgba(16,220,120,0.6) 50%, rgba(52,211,153,0.4) 60%, transparent 100%)',
                          mixBlendMode: 'screen',
                          filter: 'brightness(1.5) drop-shadow(0 0 10px rgba(52, 211, 153, 0.5))'
                        }}
                      />
                    </span>
                    {t.about.descriptionP2end}
                  </p>
                </div>
              }
              align="left"
              className="mb-8"
            />

            {/* Mission Card - Matte Glass Style */}
            <div className="group relative rounded-2xl p-8 overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-emerald-400 transition-colors duration-300">{t.about.missionTitle}</h3>
                <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                  {t.about.missionDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Right - Timeline & Roadmap */}
          <div className="relative pt-8 lg:pt-0">
            {/* Roadmap Path */}
            {/* Roadmap Path */}
            <div className="absolute left-[34px] top-8 bottom-0 w-1 h-full bg-white/5 overflow-hidden rounded-full">
              {/* Static Dashed Texture */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9InJnYmEoMTYsIDIyMCwgMTIwLCAwLjIpIi8+PC9zdmc+')] opacity-30" />

              {/* Moving Beam Effect */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-emerald-500 to-transparent animate-beam" />
            </div>

            <div className="space-y-12">
              {t.about.roadmap.map((milestone, i) => (
                <div
                  key={i}
                  className="group relative flex items-center gap-8 pl-2"
                >
                  {/* Waypoint Node */}
                  <div className={`relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${i < 2
                    ? 'bg-[#0a0e1a] border-emerald-500 shadow-[0_0_20px_rgba(16,220,120,0.3)]'
                    : 'bg-[#0a0e1a] border-white/10 group-hover:border-emerald-500/50'
                    }`}>
                    {/* Inner Dot */}
                    {i < 2 && (
                      <div className="absolute inset-0 rounded-xl bg-emerald-500/10 animate-pulse-slow" />
                    )}
                    <span className={`font-bold text-sm ${i < 2 ? 'text-emerald-400' : 'text-white/50 group-hover:text-emerald-400/70'} transition-colors`}>
                      {milestone.year}
                    </span>

                    {/* Connector Line to Card */}
                    <div className={`absolute left-full top-1/2 w-8 h-[2px] ${i < 2 ? 'bg-emerald-500' : 'bg-white/10 group-hover:bg-emerald-500/30'
                      } transition-colors`} />
                  </div>

                  {/* Content Card */}
                  <div className={`flex-1 rounded-xl p-6 border transition-all duration-300 relative overflow-hidden ${i < 2
                    ? 'bg-white/5 border-emerald-500/30 shadow-[0_0_30px_rgba(16,220,120,0.1)]'
                    : 'bg-white/[0.02] border-white/5 hover:border-emerald-500/20 hover:bg-white/5'
                    }`}>
                    {/* Active Indicator Glow */}
                    {i < 2 && (
                      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 blur-2xl -mr-10 -mt-10 pointer-events-none" />
                    )}

                    <h4 className={`text-lg font-bold mb-2 transition-colors duration-300 ${i < 2 ? 'text-white' : 'text-white/80 group-hover:text-white'
                      }`}>
                      {milestone.title}
                    </h4>
                    <p className={`text-sm transition-colors duration-300 ${i < 2 ? 'text-white/70' : 'text-white/40 group-hover:text-white/60'
                      }`}>
                      {milestone.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes beam {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(250%); opacity: 0; }
        }
        .animate-beam {
          animation: beam 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </section>
  )
}
