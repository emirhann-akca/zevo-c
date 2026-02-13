'use client'

import { motion } from 'framer-motion'
import { Linkedin, Twitter, Github } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

const team = [
  {
    name: 'Emirhan Boran Akça',
    role: 'Kurucu CEO',
    description: 'Zevo Şirketinin Kurucu CEO\'su',
    social: { twitter: '#', linkedin: '#', github: '#' }
  },
  {
    name: 'Hasan Sefa Karakoyunlu',
    role: 'Tasarım Uzmanı',
    description: 'Zevo Şirket Tasarım Uzmanı',
    social: { twitter: '#', linkedin: '#', github: '#' }
  },
  {
    name: 'Hasan Server Kamber',
    role: 'Tasarım & Yazılım',
    description: 'Zevo Şirket Tasarım ve Yazılım Uzmanı',
    social: { twitter: '#', linkedin: '#', github: '#' }
  }
]

export default function Team() {
  return (
    <section id="ekibimiz" className="relative py-24 px-6 bg-dark-primary overflow-hidden">
      {/* Structural Background - Matching About */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] opacity-10"
          style={{
            background: 'radial-gradient(circle at center, rgba(16, 220, 120, 0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <SectionHeader
          badge="Ekibimiz"
          title={<span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Zevo Ekibi</span>}
          description="Vizyonumuzu gerçeğe dönüştüren tutkulu ekip."
          align="center"
          className="mb-16"
        />

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all duration-300"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Image Container */}
              <div className="relative h-80 overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center group-hover:from-emerald-900/20 group-hover:to-emerald-800/10 transition-colors duration-500">
                <div className="text-8xl filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                  👤
                </div>

                {/* Social Icons - Appear on Hover with Matte Style */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <a
                    href={member.social.twitter}
                    className="w-10 h-10 rounded-full bg-[#0a0e1a]/80 backdrop-blur-none border border-white/10 flex items-center justify-center hover:border-emerald-500 hover:text-emerald-400 transition-colors text-white"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a
                    href={member.social.linkedin}
                    className="w-10 h-10 rounded-full bg-[#0a0e1a]/80 backdrop-blur-none border border-white/10 flex items-center justify-center hover:border-emerald-500 hover:text-emerald-400 transition-colors text-white"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href={member.social.github}
                    className="w-10 h-10 rounded-full bg-[#0a0e1a]/80 backdrop-blur-none border border-white/10 flex items-center justify-center hover:border-emerald-500 hover:text-emerald-400 transition-colors text-white"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Info Container */}
              <div className="p-8 relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-300">
                  {member.name}
                </h3>
                <p className="text-emerald-500 font-semibold mb-3 text-sm tracking-wide uppercase">{member.role}</p>
                <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors duration-300">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
