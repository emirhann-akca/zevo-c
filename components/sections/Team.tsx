'use client'

import { motion } from 'framer-motion'
import { Linkedin, Twitter, Github } from 'lucide-react'

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
    <section id="ekibimiz" className="relative py-24 px-6 bg-dark-primary">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-bold text-white mb-4">
            <span className="text-emerald-primary">Ekibimiz</span>
          </h2>
          <p className="text-xl text-text-muted">Zevo Ekibi</p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-dark-secondary rounded-3xl overflow-hidden group cursor-pointer border border-white/5 hover:border-emerald-primary/50 hover:shadow-xl hover:shadow-emerald-primary/20 transition-all"
            >
              {/* Image Container */}
              <div className="relative h-80 overflow-hidden bg-gradient-to-br from-emerald-primary/20 to-emerald-primary/5">
                <div className="w-full h-full flex items-center justify-center text-8xl">
                  👤
                </div>

                {/* Social Icons - Appear on Hover */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <motion.a
                    href={member.social.twitter}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-dark-secondary border border-white/10 flex items-center justify-center hover:border-emerald-primary hover:text-emerald-primary transition-colors text-white"
                  >
                    <Twitter className="w-4 h-4" />
                  </motion.a>
                  <motion.a
                    href={member.social.linkedin}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-dark-secondary border border-white/10 flex items-center justify-center hover:border-emerald-primary hover:text-emerald-primary transition-colors text-white"
                  >
                    <Linkedin className="w-4 h-4" />
                  </motion.a>
                  <motion.a
                    href={member.social.github}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-dark-secondary border border-white/10 flex items-center justify-center hover:border-emerald-primary hover:text-emerald-primary transition-colors text-white"
                  >
                    <Github className="w-4 h-4" />
                  </motion.a>
                </div>
              </div>

              {/* Info Container */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-primary transition-colors">
                  {member.name}
                </h3>
                <p className="text-emerald-primary font-semibold mb-3">{member.role}</p>
                <p className="text-text-muted text-sm">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
