'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { X, Dumbbell, Apple, Brain, Users, Trophy, ChevronRight, Activity, ShieldCheck, Target, TriangleAlert, CircleHelp, FileX, Shuffle, Camera, PieChart, Mic, TrendingUp } from 'lucide-react'
import EnergyCircuitBackground from '@/components/effects/EnergyCircuitBackground'
import SectionHeader from '@/components/ui/SectionHeader'
import ComingSoonButton from '@/components/ui/ComingSoonButton'

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
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  const features: Feature[] = [
    {
      id: 1,
      icon: Dumbbell,
      title: 'Antrenman',
      shortDescription: 'AI destekli antrenman programları',
      detailedDescription: 'Fiziksel verilerini analiz eder, sana özel akış oluşturur.||Her gün. Otomatik.',
      problems: [
        {
          title: 'Statik ve Verimsiz',
          description: 'Güncel formunu yok sayan basmakalıp listeler.',
          icon: FileX
        },
        {
          title: 'Sakatlık Riski',
          description: 'Vücut sınırlarını bilmeden yapılan bilinçsiz yüklenmeler.',
          icon: TriangleAlert
        },
        {
          title: 'Hedef Karmaşası',
          description: 'Neye yaradığı belirsiz rastgele rotalar.',
          icon: Shuffle
        }
      ],
      benefits: [
        {
          title: 'Dinamik ve Canlı Programlar',
          description: 'Statik listeleri unut. Formuna göre anlık güncellenen, seninle yaşayan bir akış.',
          icon: Activity
        },
        {
          title: 'Akıllı Yüklenme ve Güvenlik',
          description: 'Sınırlarını analiz eden AI ile sakatlık riskini minimize et, güvenle geliş.',
          icon: ShieldCheck
        },
        {
          title: 'Hedef Odaklı Netlik',
          description: 'Karmaşa yok. Her hareketin seni hedefe götürdüğü net bir rota.',
          icon: Target
        },
      ],
      listTitle: 'ZEVO FARKI',
      problemTitle: 'GELENEKSEL YÖNTEMLER NEDEN YETERSİZ?',
      animation: 'fade',
      layout: 'square',
      targetSection: 'hareket-analizi'
    },
    {
      id: 2,
      icon: Apple,
      title: 'Beslenme',
      shortDescription: 'Kişiselleştirilmiş beslenme planı',
      detailedDescription: 'Sadece kalori saymaz. Metabolizmana ve hedeflerine uygun dinamik bir beslenme planı oluşturur.||Görsel analiz ve barkod teknolojisiyle. Anlık.',
      problems: [
        {
          title: 'Plansızlık ve Kararsızlık',
          description: '"Ne yesem?" stresi ve sağlıksız kaçamaklar.',
          icon: CircleHelp
        },
        {
          title: 'Sürdürülemez Yasaklar',
          description: 'Katı diyetlerin yarattığı psikolojik baskı ve bozma eğilimi.',
          icon: TriangleAlert
        },
        {
          title: 'Dengesiz Makro Dağılımı',
          description: 'Kaloriyi tutturup protein dengesini kaçırmak.',
          icon: Shuffle
        }
      ],
      benefits: [
        {
          title: 'Dinamik Beslenme Planı',
          description: 'Hedefine göre güncellenen, esnek bir beslenme akışı.',
          icon: Activity
        },
        {
          title: 'Görsel & Barkod Takip',
          description: 'Fotoğraf çek veya barkod okut, gerisini AI halleder.',
          icon: Camera
        },
        {
          title: 'Akıllı Makro Dengesi',
          description: 'Protein, yağ, karbonhidrat dengesini otomatik optimize eder.',
          icon: PieChart
        },
      ],
      listTitle: 'ZEVO FARKI',
      problemTitle: 'Klasik Diyetler Neden İşe Yaramıyor?',
      animation: 'slide',
      layout: 'square',
      targetSection: 'beslenme'
    },
    {
      id: 3,
      icon: Brain,
      title: 'Yapay Zeka Koç',
      shortDescription: 'Kişisel AI koçluk sistemi',
      detailedDescription: 'Telefon kamerasıyla iskelet sistemini haritalandırır, form hatalarını tespit eder.||Anlık sesli komutlarla düzeltir.',
      problems: [
        {
          title: 'Görünmez Form Hataları',
          description: 'Fark edilmeyen yanlış açılar ve sakatlık riski.',
          icon: CircleHelp
        },
        {
          title: 'Yarım Tekrar',
          description: 'Menzilden çalarak gelişimi yavaşlatmak.',
          icon: TriangleAlert
        },
        {
          title: 'Odak Kaybı',
          description: 'Sürekli sayı sayarak zihinsel odağın bozulması.',
          icon: Shuffle
        }
      ],
      benefits: [
        {
          title: 'Gerçek Zamanlı Form Analizi',
          description: 'Vücut açılarını izler, hataları anında yakalar.',
          icon: Activity
        },
        {
          title: 'Sesli Koçluk',
          description: 'Sesli komutlarla formu anında düzeltir.',
          icon: Mic
        },
        {
          title: 'Hareket Menzili Takibi',
          description: 'Tekrarın tam menzilde yapıldığından emin olur.',
          icon: Target
        },
      ],
      listTitle: 'ZEVO FARKI',
      problemTitle: 'Koçsuz Antrenman Neden Riskli?',
      animation: 'scale',
      layout: 'full',
      targetSection: 'ai-koc'
    },
    {
      id: 4,
      icon: Users,
      title: 'Ekipler',
      shortDescription: 'Takım arkadaşlarınla antrenman',
      detailedDescription: 'Antrenman verilerini analiz eder, arkadaşlarınla yarışabileceğin dinamik bir lig ortamı oluşturur.||Performansını takım oyununa dönüştürür.',
      problems: [
        {
          title: 'Hesap Verilebilirlik',
          description: 'Sürecini takip eden bir rakip olmadığı için ertelemek.',
          icon: CircleHelp
        },
        {
          title: 'İzole Süreç',
          description: 'Tek başına çalışmanın yarattığı monotonluk ve rekabet eksikliği.',
          icon: TriangleAlert
        },
        {
          title: 'Kıyaslama Eksikliği',
          description: 'Gelişimini karşılaştıramadığın için seviyeni görememek.',
          icon: Shuffle
        }
      ],
      benefits: [
        {
          title: 'Dinamik Lig Sistemi',
          description: 'Arkadaşlarınla haftalık sıralama ve rekabet ortamı.',
          icon: Trophy
        },
        {
          title: 'Takım Motivasyonu',
          description: 'Birlikte hedef koy, birbirinizi takip et ve motive ol.',
          icon: Users
        },
        {
          title: 'Şeffaf Performans Takibi',
          description: 'Gelişimini rakiplerle kıyasla, gerçek potansiyelini gör.',
          icon: TrendingUp
        },
      ],
      listTitle: 'ZEVO FARKI',
      problemTitle: 'TEK BAŞINA ANTRENMAN NEDEN ZORLUYOR?',
      animation: 'rotate',
      layout: 'square'
    },
    {
      id: 5,
      icon: Trophy,
      title: 'PvP Arena',
      shortDescription: 'Gerçek zamanlı rekabet',
      detailedDescription: 'Antrenmanı dijital bir arenaya dönüştürür, AI hakemliği ile tarafsızlık sağlar.||Uzaktan rekabette güven ve adalet sorununu çözer.',
      problems: [
        {
          title: 'Hileli Rekabet',
          description: 'Kazanma hırsıyla hareketin formunu bozarak elde edilen haksız puanlar.',
          icon: CircleHelp
        },
        {
          title: 'Düşük Yoğunluk',
          description: 'Rakip baskısı olmadığı için sınırları zorlamayan verimsiz çalışmalar.',
          icon: TriangleAlert
        },
        {
          title: 'Adaletsiz Eşleşme',
          description: 'Kendi seviyende olmayan rakiplerle yarışmanın yarattığı motivasyon kırılması.',
          icon: Shuffle
        }
      ],
      benefits: [
        {
          title: 'Tarafsız AI Hakemliği',
          description: 'Sadece nizami formda yapılan tekrarları geçerli sayar.',
          icon: ShieldCheck
        },
        {
          title: 'Dinamik Eşleşme',
          description: 'Kendi seviyendeki rakiplerle adil ve rekabetçi müsabakalar.',
          icon: Users
        },
        {
          title: 'Gerçek Zamanlı Rekabet',
          description: 'Mesafeleri ortadan kaldıran, anlık veri senkronizasyonu.',
          icon: Activity
        },
      ],
      listTitle: 'ZEVO FARKI',
      problemTitle: 'Geleneksel Rekabet Neden Yetersiz?',
      animation: 'fade',
      layout: 'square',
      targetSection: 'pvp-arena'
    },
  ]

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
            badge="Özellikler"
            title={<>Neler <span className="text-emerald-primary">Sunuyoruz?</span></>}
            description="ZEVO ile antrenmanlarını bir üst seviyeye taşı"
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
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                className="pointer-events-auto w-full max-w-2xl bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden relative"
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
                      <p className="text-emerald-400 font-medium mb-2">
                        {selectedFeature.shortDescription}
                      </p>
                      {selectedFeature.problems && (
                        <p className="text-gray-300 text-sm leading-relaxed max-w-md">
                          {selectedFeature.detailedDescription.split('||')[0]}
                          <span className="text-white font-semibold"> {selectedFeature.detailedDescription.split('||')[1]}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-6">
                    {/* Description Section (Only if no problems, otherwise it is in header) */}
                    {!selectedFeature.problems && (
                      <div className="mb-4">
                        <div className="max-h-[140px] overflow-y-auto pr-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                          <p className="text-white/80 leading-relaxed text-lg pb-4">
                            {selectedFeature.detailedDescription}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Problems Section (Only if exists) */}
                    {selectedFeature.problems && (
                      <div className="mb-6">
                        <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-2">
                          {selectedFeature.problemTitle || 'SORUNLAR'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {selectedFeature.problems.map((problem, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="bg-white/5 border border-orange-500/10 rounded-xl p-3 flex flex-col gap-2 group hover:bg-white/10 transition-colors"
                            >
                              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                <problem.icon className="w-4 h-4 text-orange-400 group-hover:text-orange-400 transition-colors" />
                              </div>
                              <div>
                                <h5 className="font-semibold text-white/90 text-sm mb-0.5">{problem.title}</h5>
                                <p className="text-white/50 text-xs leading-relaxed">{problem.description}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Separator Line */}
                        <hr className="border-emerald-500/20 my-4" />
                      </div>
                    )}

                    {/* Benefits List */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/50" />
                        <h4 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-[0.2em]">
                          {selectedFeature.listTitle || 'AVANTAJLAR'}
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
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors duration-200 group ${benefit.title === 'Akıllı Yüklenme ve Güvenlik'
                              ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)] scale-[1.01]'
                              : 'bg-white/5 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5'
                              }`}
                          >
                            {/* Icon if exists, or simple dot */}
                            {benefit.icon ? (
                              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                                <benefit.icon className="w-5 h-5 text-emerald-400" />
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

                  {/* Footer CTA */}
                  <div className="mt-8 pt-6 border-t border-white/10">
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
                      className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
                    >
                      Hemen Başla
                    </ComingSoonButton>
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
