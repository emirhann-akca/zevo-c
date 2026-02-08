'use client'

import { motion } from 'framer-motion'

export default function About() {
  return (
    <section id="hakkimizda" className="relative py-24 px-6 bg-dark-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-5xl font-bold text-white">
              <span className="text-emerald-primary">Hakkımızda</span>
            </h2>

            <div className="space-y-6 text-lg text-text-muted leading-relaxed">
              <p>
                Biz, kod satırlarını spor sahalarına taşıyan tutkulu{' '}
                <span className="text-white font-semibold">bilgisayar mühendisleriyiz.</span>
              </p>

              <p>
                Bir yurt odasında filizlenen Zevo, bugün sporu teknolojiyle birleştiren
                vizyoner bir girişime dönüştü. Amacımız sadece bir uygulama yapmak değil;
                yapay zeka ve verinin gücünü kullanarak, amatör ruhları profesyonel bir
                kariyere taşıyan{' '}
                <span className="text-emerald-primary font-semibold">'Sporun LinkedIn'i'</span>
                ni inşa etmek.
              </p>
            </div>

            {/* Mission Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="gradient-primary rounded-2xl p-8 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/10 rounded-2xl" />
              <div className="relative">
                <h3 className="text-2xl font-bold mb-4 text-white">Hedefimiz</h3>
                <p className="text-white/90 leading-relaxed">
                  Her sporcunun içindeki profesyoneli ortaya çıkarmak. Zevo ile sahadaki
                  teri dijital veriye, rekabeti ise global bir dostluğa dönüştürüyoruz.
                  Sınırları kaldıran teknolojimizle, sporu herkes için daha akıllı,
                  daha sosyal ve daha rekabetçi hale getiriyoruz.
                </p>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              {[
                { value: '1000+', label: 'Kullanıcı' },
                { value: '50K+', label: 'Antrenman' },
                { value: '100+', label: 'Kulüp' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="bg-dark-secondary rounded-xl p-4 text-center border border-white/5 shadow-sm"
                >
                  <div className="text-3xl font-bold text-emerald-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-text-muted">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Journey Timeline */}
            <div className="space-y-8">
              {[
                { year: '2025', title: 'Fikrin Doğuşu', desc: 'Sporcuların ihtiyaçlarını dinleyerek ZEVO fikri doğdu' },
                { year: '2026', title: 'Uygulama Çıkışı', desc: 'Beta versiyonu ile ilk kullanıcılarımıza ulaştık' },
                { year: '2027', title: 'Sporun LinkedIn\'i', desc: 'Sporcuların birbirleriyle bağlantı kurduğu dev platform' },
                { year: '2028', title: 'Sporun Yeni Çağı', desc: 'AI destekli spor dünyasında lider konuma geldik' }
              ].map((milestone, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  whileHover={{ x: 10 }}
                  className="flex items-start gap-6 group cursor-pointer"
                >
                  {/* Year Badge */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-emerald-primary/50 transition-shadow">
                    <span className="font-bold text-white">{milestone.year}</span>
                  </div>

                  {/* Content */}
                  <div className="bg-dark-secondary rounded-xl p-6 flex-1 border border-white/5 group-hover:border-emerald-primary/50 group-hover:shadow-lg group-hover:shadow-emerald-primary/20 transition-all">
                    <h4 className="text-xl font-bold mb-2 group-hover:text-emerald-primary transition-colors text-white">
                      {milestone.title}
                    </h4>
                    <p className="text-text-muted">{milestone.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Connecting Line */}
            <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-gradient-to-b from-emerald-primary via-emerald-primary/50 to-transparent" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
