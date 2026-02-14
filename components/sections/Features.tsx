'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { X, Dumbbell, Apple, Brain, Users, Trophy, ChevronRight, Activity, ShieldCheck, Target, TriangleAlert, CircleHelp, FileX, Shuffle, Camera, PieChart, Mic, TrendingUp } from 'lucide-react'
import EnergyCircuitBackground from '@/components/effects/EnergyCircuitBackground'
import SectionHeader from '@/components/ui/SectionHeader'
import ComingSoonButton from '@/components/ui/ComingSoonButton'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Feature {
  id: number;
  icon: React.ElementType;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  problems?: {
    title: string;
    description: string;
    icon: React.ElementType;
  }[];
  benefits: {
    title: string;
    description: string;
    icon?: React.ElementType;
  }[];
  animation: 'fade' | 'slide' | 'scale' | 'rotate';
  layout: 'square' | 'full';
  targetSection?: string;
  listTitle?: string;
  problemTitle?: string;
}

export default function Features() {
  const { t } = useLanguage()
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  const FEATURE_ICONS: { icon: React.ElementType; problems: React.ElementType[]; benefits: React.ElementType[]; animation: Feature['animation']; layout: Feature['layout']; targetSection?: string }[] = [
    { icon: Dumbbell, problems: [FileX, TriangleAlert, Shuffle], benefits: [Activity, ShieldCheck, Target], animation: 'fade', layout: 'square', targetSection: 'hareket-analizi' },
    { icon: Apple, problems: [CircleHelp, TriangleAlert, Shuffle], benefits: [Activity, Camera, PieChart], animation: 'slide', layout: 'square', targetSection: 'beslenme' },
    { icon: Brain, problems: [CircleHelp, TriangleAlert, Shuffle], benefits: [Activity, Mic, Target], animation: 'scale', layout: 'full', targetSection: 'ai-koc' },
    { icon: Users, problems: [CircleHelp, TriangleAlert, Shuffle], benefits: [Trophy, Users, TrendingUp], animation: 'rotate', layout: 'square' },
    { icon: Trophy, problems: [CircleHelp, TriangleAlert, Shuffle], benefits: [ShieldCheck, Users, Activity], animation: 'fade', layout: 'square', targetSection: 'pvp-arena' },
  ]

  const features: Feature[] = FEATURE_ICONS.map((cfg, i) => {
    const ft = t.features.items[i]
    return {
      id: i + 1,
      icon: cfg.icon,
      title: ft.title,
      shortDescription: ft.shortDescription,
      detailedDescription: ft.detailedDescription,
      problemTitle: ft.problemTitle,
      listTitle: ft.listTitle,
      problems: ft.problems.map((p, pi) => ({
        title: p.title,
        description: p.description,
        icon: cfg.problems[pi],
      })),
      benefits: ft.benefits.map((b, bi) => ({
        title: b.title,
        description: b.description,
        icon: cfg.benefits[bi],
      })),
      animation: cfg.animation,
      layout: cfg.layout,
      targetSection: cfg.targetSection,
    }
  })

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      if (hash === '#ozellikler-antrenman') {
        setTimeout(() => {
          setSelectedFeature(features[0])
          window.history.replaceState(null, '', window.location.pathname)
        }, 800)
      }
      if (hash === '#ozellikler-koc') {
        setTimeout(() => {
          setSelectedFeature(features[2])
          window.history.replaceState(null, '', window.location.pathname)
        }, 800)
      }
      if (hash === '#ozellikler-pvp') {
        setTimeout(() => {
          setSelectedFeature(features[4])
          window.history.replaceState(null, '', window.location.pathname)
        }, 800)
      }
    }

    // Check on mount
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, []) // features array is constant inside component, effectively static

  return (
    <section id="ozellikler" className="relative min-h-screen py-12 lg:py-16 px-6 bg-[#0a0e1a] flex flex-col justify-center overflow-hidden">
      {/* Energy Circuit Effect */}
      <EnergyCircuitBackground />

      {/* Sadece ortaya subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)'
          }}
        />
      </div>

      <div className="max-w-[580px] mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <SectionHeader
            badge={t.features.badge}
            title={<>{t.features.title} <span className="text-emerald-primary">{t.features.titleHighlight}</span></>}
            description={t.features.description}
            align="center"
          />
        </div>

        {/* Feature Grid - Compact 2-1-2 Layout */}
        <div className="grid grid-cols-2 gap-3 mx-auto">
          {/* Row 1: Antrenman + Beslenme (2 squares) */}
          {features.slice(0, 2).map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(16,185,129,0.5)' }}
                whileTap={{ scale: 0.97 }}
                style={{ transition: 'none' }}
                onClick={() => setSelectedFeature(feature)}
                className="relative gradient-primary rounded-xl p-3 aspect-[5/3] flex flex-col justify-between text-left cursor-pointer group shadow-[0_0_25px_rgba(16,185,129,0.35)]"
              >
                {/* Icon Container - Matte */}
                <div className="w-9 h-9 matte-icon rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>

                {/* Bottom Content */}
                <div>
                  <h3 className="text-base font-bold text-white">
                    {feature.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </div>
              </motion.button>
            )
          })}

          {/* Row 2: Yapay Zeka Koç (1 full width) */}
          {features.slice(2, 3).map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(16,185,129,0.5)' }}
                whileTap={{ scale: 0.97 }}
                style={{ transition: 'none' }}
                onClick={() => setSelectedFeature(feature)}
                className="relative gradient-primary rounded-xl p-3 col-span-2 flex items-center justify-between text-left cursor-pointer group shadow-[0_0_25px_rgba(16,185,129,0.35)]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 matte-icon rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-bold text-white">{feature.title}</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </motion.button>
            )
          })}

          {/* Row 3: Ekipler + PvP Arena (2 squares) */}
          {features.slice(3, 5).map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.06, boxShadow: '0 0 40px rgba(16,185,129,0.5)' }}
                whileTap={{ scale: 0.97 }}
                style={{ transition: 'none' }}
                onClick={() => setSelectedFeature(feature)}
                className="relative gradient-primary rounded-xl p-3 aspect-[5/3] flex flex-col justify-between text-left cursor-pointer group shadow-[0_0_25px_rgba(16,185,129,0.35)]"
              >
                <div className="w-9 h-9 matte-icon rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {feature.title}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-white/80" />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Detail Modal - Premium Design */}
      <AnimatePresence>
        {selectedFeature && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeature(null)}
              className="fixed inset-0 bg-black/90 z-[100]"
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-0 sm:p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                className="pointer-events-auto w-full max-w-3xl bg-[#0f172a] border border-white/10 rounded-none sm:rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden relative h-full sm:h-auto sm:max-h-[90vh] flex flex-col"
              >
                {/* Background Glow Effects */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                <div
                  className="absolute -top-20 -right-20 w-64 h-64 pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)' }}
                />

                {/* Close Button */}
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2.5 rounded-full bg-[#0f172a]/90 sm:bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content Container */}
                <div className="relative p-4 sm:p-6 flex-1 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {/* Header Section */}
                  <div className="flex items-start gap-3 sm:gap-5 mb-3 sm:mb-5">
                    {/* Icon Box */}
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                      {selectedFeature.icon && <selectedFeature.icon className="w-5 h-5 sm:w-8 sm:h-8 text-white" />}
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold text-white mb-1">
                        {selectedFeature.title}
                      </h3>
                      <p className="text-emerald-400 font-medium mb-2 text-sm">
                        {selectedFeature.shortDescription}
                      </p>
                      {selectedFeature.problems && (
                        <p className="text-gray-300 text-sm leading-relaxed max-w-xl">
                          {selectedFeature.detailedDescription.split('||')[0]}
                          <span className="text-white font-semibold"> {selectedFeature.detailedDescription.split('||')[1]}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-4">
                    {/* Description Section (Only if no problems, otherwise it is in header) */}
                    {!selectedFeature.problems && (
                      <div className="mb-3">
                        <div className="max-h-[140px] overflow-y-auto pr-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                          <p className="text-white/80 leading-relaxed text-base pb-2">
                            {selectedFeature.detailedDescription}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Problems Section (Only if exists) */}
                    {selectedFeature.problems && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                          {selectedFeature.problemTitle || t.features.defaultProblemTitle}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {selectedFeature.problems.map((problem, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-white/5 border border-orange-500/10 rounded-xl p-2 sm:p-2.5 flex flex-col gap-1 sm:gap-1.5 group hover:bg-white/10 transition-colors"
                            >
                              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <problem.icon className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-400 transition-colors" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-white/90 text-sm mb-0.5">{problem.title}</h5>
                                <p className="text-white/50 text-xs leading-relaxed">{problem.description}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Separator Line */}
                        <hr className="border-emerald-500/20 my-3" />
                      </div>
                    )}

                    {/* Benefits List */}
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/50" />
                        <h4 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-[0.2em]">
                          {selectedFeature.listTitle || t.features.defaultListTitle}
                        </h4>
                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/50" />
                      </div>
                      <div className="flex flex-col gap-2">
                        {selectedFeature.benefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + (index * 0.1) }}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors duration-200 group ${benefit.title === 'Akıllı Yüklenme ve Güvenlik'
                              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[1.01]'
                              : 'bg-white/5 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                              }`}
                          >
                            {/* Icon if exists, or simple dot */}
                            {benefit.icon ? (
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                <benefit.icon className="w-4 h-4 text-emerald-400" />
                              </div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-1" />
                            )}

                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-white text-sm mb-0.5">{benefit.title}{benefit.title ? ':' : ''}</h5>
                              <p className="text-white/70 text-xs leading-relaxed">{benefit.description}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer CTA - Outside scroll area */}
                <div className="sticky bottom-0 bg-[#0f172a] border-t border-white/10 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
                  <ComingSoonButton
                    onClick={() => {
                      const target = selectedFeature.targetSection
                      if (target) {
                        setSelectedFeature(null)
                        setTimeout(() => {
                          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
                        }, 300)
                      }
                    }}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
                  >
                    {t.features.cta}
                  </ComingSoonButton>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
