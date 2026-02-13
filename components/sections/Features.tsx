'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { X, Dumbbell, Apple, Brain, Users, Trophy, ChevronRight } from 'lucide-react'
import EnergyCircuitBackground from '@/components/effects/EnergyCircuitBackground'
import SectionHeader from '@/components/ui/SectionHeader'
import ComingSoonButton from '@/components/ui/ComingSoonButton'

interface Feature {
  id: number;
  icon: React.ElementType;
  title: string;
  shortDescription: string;
  detailedDescription: string;
  benefits: string[];
  animation: 'fade' | 'slide' | 'scale' | 'rotate';
  layout: 'square' | 'full';
  targetSection?: string;
  listTitle?: string;
}

export default function Features() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)





  const features: Feature[] = [
    {
      id: 1,
      icon: Dumbbell,
      title: 'Antrenman',
      shortDescription: 'AI destekli antrenman programları',
      detailedDescription: 'ZEVO\'nun yapay zeka algoritması, fiziksel verilerini ve anlık form durumunu işleyerek, gelişim sürecini yavaşlatan yaygın antrenman hatalarını elimine eder ve sana özel optimize edilmiş bir akış sunar.',
      benefits: [
        'Verimsiz ve Sabit Programlar: Gelişimi durduran, güncel formuna uymayan statik listeler.',
        'Bilinçsiz Yüklenme ve Sakatlık: Vücudun sınırlarını analiz etmeden yapılan riskli planlamalar.',
        'Hedefsiz Egzersiz Karmaşası: Hangi hareketin senin hedefine hizmet ettiğine dair belirsizlik.',
      ],
      listTitle: 'SORUNLAR',
      animation: 'fade',
      layout: 'square',
      targetSection: 'hareket-analizi'
    },
    {
      id: 2,
      icon: Apple,
      title: 'Beslenme',
      shortDescription: 'Kişiselleştirilmiş beslenme planı',
      detailedDescription: 'ZEVO, sadece kalorilerini saymaz; metabolizmana ve hedeflerine uygun dinamik bir beslenme planı oluşturur. Görsel analiz ve barkod teknolojisiyle yediklerini bu planla anlık olarak eşleştirerek, \'bugün ne yesem?\' belirsizliğini ve hesaplama karmaşasını elimine eden uçtan uca bir yönetim sunar.',
      benefits: [
        'Plansızlık ve Kararsızlık: Öğün saati geldiğinde yaşanan "Ne yemeliyim?" stresi ve bunun yol açtığı sağlıksız kaçamaklar.',
        'Sürdürülemez Yasaklar: Gerçekçi olmayan katı listelerin yarattığı psikolojik baskı ve diyeti bozma eğilimi.',
        'Zaman Alan Veri Girişi: Planı uygularken tek tek ürün aramanın yarattığı bıkkınlık ve takibi bırakma riski.',
        'Dengesiz Makro Dağılımı: Rastgele beslenerek kalori hedefini tutturup, kas inşası için gereken protein dengesini kaçırmak.'
      ],
      listTitle: 'SORUNLAR',
      animation: 'slide',
      layout: 'square',
      targetSection: 'beslenme'
    },
    {
      id: 3,
      icon: Brain,
      title: 'Yapay Zeka Koç',
      shortDescription: 'Kişisel AI koçluk sistemi',
      detailedDescription: 'ZEVO\'nun görüntü işleme teknolojisi, telefon kamerasını kullanarak iskelet sistemini saniye saniye haritalar. Vücut açılarını ve hareket menzilini analiz ederek, seni sakatlayabilecek en ufak duruş bozukluğunu bile tespit eder ve anlık sesli komutlarla düzeltir.',
      benefits: [
        'Görünmez Form Hataları: Dışarıdan bir göz olmadığı için fark edilmeyen yanlış açılar ve sakatlık riski.',
        'Yarım ve Verimsiz Tekrar: Zorlandığında hareketin menzilinden çalarak gelişimi yavaşlatmak.',
        'Odak ve Sayım Kaybı: "Kaçıncı tekrardayım?" karmaşasıyla zihinsel odağın bozulması.'
      ],
      listTitle: 'SORUNLAR',
      animation: 'scale',
      layout: 'full',
      targetSection: 'ai-koc'
    },
    {
      id: 4,
      icon: Users,
      title: 'Ekipler',
      shortDescription: 'Takım arkadaşlarınla antrenman',
      detailedDescription: 'ZEVO, antrenman verilerini analiz ederek arkadaşlarınla yarışabileceğin dinamik bir lig ortamı oluşturur. Bireysel performansını bir takım oyununa dönüştürerek, süreci şeffaf ve ölçülebilir bir rekabet ekosistemine taşır.',
      benefits: [
        'Hesap Verilebilirlik Eksikliği: Sürecini takip eden bir göz veya rakip olmadığı için antrenmanları kolayca ertelemek.',
        'İzole ve Monoton Süreç: Tek başına çalışmanın zamanla yarattığı sıkıcılık ve rekabet eksikliği.',
        'Kıyaslama Yetersizliği: Gelişimini başkalarıyla karşılaştıramadığın için gerçek potansiyelini ve seviyeni görememek.'
      ],
      listTitle: 'SORUNLAR',
      animation: 'rotate',
      layout: 'square'
    },
    {
      id: 5,
      icon: Trophy,
      title: 'PvP Arena',
      shortDescription: 'Gerçek zamanlı rekabet',
      detailedDescription: 'ZEVO, antrenmanı dijital bir arenaya dönüştürür. Yapay zeka tabanlı iskelet takip sistemi, müsabaka sırasında tarafsız bir hakem gibi çalışır. Sadece nizami formda yapılan tekrarları geçerli sayarak, uzaktan rekabetteki güven ve adalet sorununu kökten çözer.',
      benefits: [
        'Hileli Rekabet: Kazanma hırsıyla hareketin formundan çalarak (yarım yaparak) elde edilen haksız puanlar.',
        'Düşük Antrenman Yoğunluğu: Rakip baskısı olmadığı için sınırları zorlamadan, "konfor alanında" yapılan verimsiz çalışmalar.',
        'Adaletsiz Eşleşme: Kendi seviyende olmayan rakiplerle yarışmanın yarattığı motivasyon kırılması ve dengesizlik.'
      ],
      listTitle: 'SORUNLAR',
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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
            filter: 'blur(80px)'
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
                      <div className="max-h-[140px] overflow-y-auto pr-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        <p className="text-white/80 leading-relaxed text-lg pb-4">
                          {selectedFeature.detailedDescription}
                        </p>
                      </div>
                    </div>

                    {/* Benefits Grid */}
                    <div>
                      <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-4">
                        {selectedFeature.listTitle || 'AVANTAJLAR'}
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
                            <span className="text-white/90 text-sm font-medium">
                              {benefit.includes(':') ? (
                                <>
                                  <span className="font-bold text-white block mb-0.5">{benefit.split(':')[0]}:</span>
                                  <span className="text-white/70">{benefit.substring(benefit.indexOf(':') + 1)}</span>
                                </>
                              ) : (
                                benefit
                              )}
                            </span>
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
