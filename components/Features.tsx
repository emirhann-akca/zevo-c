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
    <section id="ozellikler" className="py-24 px-6 bg-dark-primary">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Neler <span className="text-emerald-primary">Sunuyoruz?</span>
          </h2>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            ZEVO ile antrenmanlarını bir üst seviyeye taşı
          </p>
        </motion.div>

        {/* Feature Grid - EXACT 2-1-2 Layout from Mobile App */}
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Row 1: Antrenman + Beslenme (2 squares) */}
          {features.slice(0, 2).map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFeature(feature)}
                className="gradient-primary rounded-2xl p-4 aspect-[4/3] flex flex-col justify-between text-left cursor-pointer group shadow-lg shadow-emerald-primary/20 hover:shadow-emerald-primary/40 transition-all"
              >
                {/* Icon Container - Matte */}
                <div className="w-10 h-10 matte-icon rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Bottom Content */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {feature.title}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-white/80" />
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
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFeature(feature)}
                className="gradient-primary rounded-2xl p-4 col-span-2 flex items-center justify-between text-left cursor-pointer group shadow-lg shadow-emerald-primary/20 hover:shadow-emerald-primary/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Icon Container - Matte */}
                  <div className="w-10 h-10 matte-icon rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-white/80" />
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
                transition={{ delay: (index + 3) * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedFeature(feature)}
                className="gradient-primary rounded-2xl p-4 aspect-[4/3] flex flex-col justify-between text-left cursor-pointer group shadow-lg shadow-emerald-primary/20 hover:shadow-emerald-primary/40 transition-all"
              >
                {/* Icon Container - Matte */}
                <div className="w-10 h-10 matte-icon rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Bottom Content */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {feature.title}
                  </h3>
                  <ChevronRight className="w-5 h-5 text-white/80" />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Detail Modal - Dark Theme */}
      <AnimatePresence>
        {selectedFeature && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeature(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                {...getAnimation(selectedFeature.animation)}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-dark-secondary rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
              >
                {/* Header */}
                <div className="sticky top-0 gradient-primary p-6 rounded-t-3xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 matte-icon rounded-2xl flex items-center justify-center">
                        {selectedFeature.icon && <selectedFeature.icon className="w-8 h-8 text-white" />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {selectedFeature.title}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {selectedFeature.shortDescription}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedFeature(null)}
                      className="w-10 h-10 matte-icon rounded-xl flex items-center justify-center hover:bg-black/20 transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Description */}
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-white mb-3">
                      Nasıl Çalışır?
                    </h4>
                    <p className="text-text-muted leading-relaxed">
                      {selectedFeature.detailedDescription}
                    </p>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3">
                      Avantajlar
                    </h4>
                    <div className="space-y-3">
                      {selectedFeature.benefits.map((benefit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-3 bg-emerald-primary/10 rounded-xl border border-emerald-primary/20"
                        >
                          <div className="w-6 h-6 bg-emerald-primary rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-text-muted text-sm">{benefit}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-6 px-6 py-4 gradient-primary text-white rounded-xl font-bold hover:shadow-lg hover:shadow-emerald-primary/30 transition-shadow"
                  >
                    Hemen Dene
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
