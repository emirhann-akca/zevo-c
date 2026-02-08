'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

const benefits = [
  {
    number: '01',
    title: 'Veri Odaklı Gelişim',
    description: 'Tahminlere dayalı sporu bırakın. Zevo\'nun görüntü işleme (Computer Vision) teknolojisi, hareketlerinizi saniye saniye analiz eder, iskelet sisteminizi tarar ve sakatlık riskini minimuma indirerek maksimum verim almanızı sağlar.'
  },
  {
    number: '02',
    title: 'Sporun Sosyal Ağı',
    description: 'Sadece antrenman yapma, yeteneğini sergile. Zevo, amatör sporcuların istatistiklerini profesyonel bir kimliğe dönüştürür. Tıpkı iş dünyasında olduğu gibi, sporda da yetenek avcıları ve kulüplerle bağ kurmanızı sağlayan bir kariyer platformudur.'
  },
  {
    number: '03',
    title: 'Oyunlaştırılmış Rekabet',
    description: 'Motivasyonunuz hiç düşmesin. PvP modu sayesinde ister arkadaşlarınızla düello yapın, ister liglerde puan toplayın. Zevo\'da harcanan her kalori bir puana, her antrenman bir zafere dönüşür.'
  }
]

export default function WhyZevo() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  return (
    <section id="neden-zevo" ref={containerRef} className="relative py-24 px-6 bg-dark-primary">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            Neden <span className="text-emerald-primary">ZEVO?</span>
          </h2>
          <p className="text-xl text-text-muted max-w-3xl mx-auto">
            Sadece Spor Değil, Bir Kariyer Yolculuğu
          </p>
          <p className="text-base text-text-muted max-w-4xl mx-auto mt-4">
            Diğer uygulamalar sadece koşturur, Zevo ise geleceğe hazırlar. Yapay zeka destekli
            analizleri, sosyal rekabet ortamı ve yetenek avcılarına ulaşan kariyer profiliyle Zevo;
            sporu bir hobi olmaktan çıkarıp profesyonel bir yolculuğa dönüştürüyor.
          </p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Sticky Phone Mockup */}
          <div className="lg:sticky lg:top-32 h-[600px] flex items-center justify-center">
            <motion.div
              style={{
                y: useTransform(scrollYProgress, [0, 1], [0, 100]),
                rotate: useTransform(scrollYProgress, [0, 1], [-3, 3])
              }}
              className="relative"
            >
              {/* Phone Frame */}
              <div className="w-80 h-[600px] bg-dark-secondary rounded-[3rem] shadow-2xl p-4 border border-white/5">
                <div className="w-full h-full bg-dark-primary rounded-[2.5rem] overflow-hidden flex items-center justify-center">
                  {/* Phone App Preview */}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-center"
                  >
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-text-muted text-sm font-medium">ZEVO App</p>
                  </motion.div>
                </div>
              </div>

              {/* Floating Stats */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -right-8 top-20 bg-dark-secondary border border-white/10 px-4 py-2 rounded-full shadow-lg"
              >
                <span className="text-sm font-semibold text-white">🔥 +50 kcal</span>
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="absolute -left-8 top-40 bg-dark-secondary border border-white/10 px-4 py-2 rounded-full shadow-lg"
              >
                <span className="text-sm font-semibold text-white">⚡ Level 12</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Scrolling Benefits */}
          <div className="space-y-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-secondary rounded-3xl p-8 border border-white/5 hover:border-emerald-primary/50 hover:shadow-xl hover:shadow-emerald-primary/20 transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-6">
                  <span className="text-5xl text-emerald-primary/50 font-bold">
                    {benefit.number}
                  </span>
                </div>
                <h3 className="text-3xl font-bold mb-4 text-emerald-primary">
                  {benefit.title}
                </h3>
                <p className="text-text-muted text-lg leading-relaxed">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
