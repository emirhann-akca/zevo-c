'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { X, Dumbbell, Apple, Brain, Users, Trophy, ChevronRight } from 'lucide-react'

interface Feature {
  id: number;
  icon: any;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  benefits: string[];
  animation: 'fade' | 'slide' | 'scale' | 'rotate';
  layout: 'square' | 'full';
}

export default function Features() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  const features: Feature[] = [
    {
      id: 1,
      icon: Dumbbell,
      title: 'Antrenman',
      shortDescription: 'AI destekli antrenman programları',
      detailedDescription: 'ZEVO\'nun yapay zeka teknolojisi, senin fiziksel durumunu, hedeflerini ve günlük formunu analiz ederek tamamen kişiselleştirilmiş antrenman programları oluşturur.',
      benefits: [
        'Günlük form analizine göre dinamik program ayarlaması',
        'Yaralanma riskini minimize eden akıllı antrenman planı',
        'Hedeflerine en kısa yoldan ulaşmanı sağlayan optimizasyon',
      ],
      animation: 'fade',
      layout: 'square'
    },
    {
      id: 2,
      icon: Apple,
      title: 'Beslenme',
      shortDescription: 'Kişiselleştirilmiş beslenme planı',
      detailedDescription: 'Yediklerini yazmakla uğraşma! Tabağının fotoğrafını çek veya ürünün barkodunu okut, ZEVO yapay zeka ile besin değerlerini otomatik hesaplasın.',
      benefits: [
        'Saniyeler içinde kalori ve makro hesaplaması',
        'Yüzlerce Türk yemeği veritabanı',
        'Günlük beslenme raporları ve öneriler'
      ],
      animation: 'slide',
      layout: 'square'
    },
    {
      id: 3,
      icon: Brain,
      title: 'Yapay Zeka Koç',
      shortDescription: 'Kişisel AI koçluk sistemi',
      detailedDescription: 'Telefon kameran artık senin profesyonel koçun! İskelet takip sistemi, yaptığın hareketleri saniye saniye izler, sayar ve form hatalarını anında bildirir.',
      benefits: [
        'Milimetrik hassasiyette hareket takibi',
        'Gerçek zamanlı form düzeltme önerileri',
        'Sesli koçluk ve motivasyon'
      ],
      animation: 'scale',
      layout: 'full'
    },
    {
      id: 4,
      icon: Users,
      title: 'Ekipler',
      shortDescription: 'Takım arkadaşlarınla antrenman',
      detailedDescription: 'Arkadaşlarınla özel lig oluştur. Gerçek zamanlı skor takibi, liderlik tabloları ve başarım sistemi ile motivasyonun hiç düşmez.',
      benefits: [
        'Arkadaşlarınla özel lig oluşturma',
        'Takım bazlı liderlik tabloları',
        'Grup antrenman challenge\'ları'
      ],
      animation: 'rotate',
      layout: 'square'
    },
    {
      id: 5,
      icon: Trophy,
      title: 'PvP Arena',
      shortDescription: 'Gerçek zamanlı rekabet',
      detailedDescription: 'Sadece spor yapma, yarış! İster aynı branşta hız yarışı, ister farklı branşlarda 300 kaloriye ilk ulaşan kazansın modu.',
      benefits: [
        'Gerçek zamanlı PvP (oyuncu vs oyuncu) maçlar',
        'Global ve yerel liderlik tabloları',
        'Kazandıkça açılan özel rozetler ve ödüller'
      ],
      animation: 'fade',
      layout: 'square'
    }
  ]

  const getAnimation = (type: string) => {
    switch (type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        }
      case 'slide':
        return {
          initial: { x: 100, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -100, opacity: 0 }
        }
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        }
      case 'rotate':
        return {
          initial: { rotateY: 90, opacity: 0 },
          animate: { rotateY: 0, opacity: 1 },
          exit: { rotateY: -90, opacity: 0 }
        }
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        }
    }
  }

  return (
    <section id="ozellikler" className="relative min-h-screen py-12 lg:py-16 px-6 bg-[#0a0e1a] flex flex-col justify-center overflow-hidden">
      {/* Sadece ortaya subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
      </div>
      <div className="max-w-[580px] mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-2">
            Neler <span className="text-emerald-primary">Sunuyoruz?</span>
          </h2>
          <p className="text-base lg:text-lg text-text-muted">
            ZEVO ile antrenmanlarını bir üst seviyeye taşı
          </p>
        </motion.div>

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
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(10px)', transition: { duration: 0.2 } }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                className="pointer-events-auto w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden relative"
              >
                {/* Background Glow Effects */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Close Button */}
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content Container */}
                <div className="relative p-8">
                  {/* Header Section */}
                  <div className="flex items-start gap-6 mb-8">
                    {/* Icon Box */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                      {selectedFeature.icon && <selectedFeature.icon className="w-10 h-10 text-white" />}
                    </div>

                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2">
                        {selectedFeature.title}
                      </h3>
                      <p className="text-emerald-400 font-medium">
                        {selectedFeature.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-8">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3">
                        NASIL ÇALIŞIR?
                      </h4>
                      <p className="text-white/80 leading-relaxed text-lg">
                        {selectedFeature.detailedDescription}
                      </p>
                    </div>

                    {/* Benefits Grid */}
                    <div>
                      <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">
                        AVANTAJLAR
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedFeature.benefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-white/90 text-sm font-medium">{benefit}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
                    >
                      Hemen Başla
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
