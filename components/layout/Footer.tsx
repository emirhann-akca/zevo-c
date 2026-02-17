'use client'

import { motion } from 'framer-motion'
import { Twitter, Instagram, Linkedin } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: 'https://x.com/AppZevo' },
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/zevo.app/' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://www.linkedin.com/company/zevoo' },
]

export default function Footer() {
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-dark-primary border-t border-white/5">
      {/* Main Footer Content */}
      <div className="relative py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">ZEVO</span>
              <p className="text-text-muted text-sm">{t.footer.tagline}</p>
              <p className="text-text-muted text-sm">
                {t.footer.description}
              </p>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-white font-semibold text-lg mb-4">{t.footer.quickLinks}</h3>
              <ul className="space-y-2">
                {NAV_LINKS.map((link, i) => (
                  <li key={i}>
                    <motion.a
                      href={link.href}
                      whileHover={{ x: 5 }}
                      className="text-text-muted hover:text-emerald-primary transition-colors inline-block"
                    >
                      {t.nav[link.key as keyof typeof t.nav]}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-white font-semibold text-lg mb-4">{t.footer.socialNetwork}</h3>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social, i) => {
                  const Icon = social.icon
                  return (
                    <motion.a
                      key={i}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 rounded-full bg-dark-secondary border border-white/10 flex items-center justify-center hover:bg-emerald-primary hover:border-emerald-primary text-text-muted hover:text-white transition-all"
                    >
                      <Icon className="w-5 h-5" />
                    </motion.a>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5 my-8" />

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-text-muted text-sm"
          >
            <p>
              © <motion.span
                key={currentYear}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {currentYear}
              </motion.span> {t.footer.copyright}
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
