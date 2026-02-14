'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import ComingSoonButton from '@/components/ui/ComingSoonButton'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const [comingSoon, setComingSoon] = useState(false)

  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0
    if (latest > previous && latest > 150) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
    }
    setIsScrolled(latest > 20)
  })

  // Remove old useEffect for scroll

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMobileMenuOpen(false)
    }
  }

  const handleDownloadClick = () => {
    setComingSoon(true)
    setTimeout(() => setComingSoon(false), 2000)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: (isVisible || isMobileMenuOpen) ? 0 : -100 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${isScrolled
          ? 'bg-[#0a0e1a]/95 border-white/5 shadow-2xl backdrop-blur-sm'
          : 'bg-transparent border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3 cursor-pointer group"
            whileHover={{ scale: 1.05 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">ZEVO</span>
          </motion.div>

          {/* Desktop Menu - Modern & Clean */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="text-sm font-medium text-white/60 hover:text-white transition-all duration-300 relative group tracking-wide"
              >
                <span className="relative z-10">{item.name}</span>
                <span className="absolute -bottom-2 left-1/2 w-0 h-0.5 bg-emerald-500 -translate-x-1/2 group-hover:w-full transition-all duration-300" />
                <span className="absolute inset-0 blur-lg bg-emerald-500/0 group-hover:bg-emerald-500/20 transition-colors duration-300 -z-10 bg-opacity-0" />
              </button>
            ))}
          </div>

          {/* CTA Button - Desktop */}
          <div className="hidden md:block">
            <ComingSoonButton>
              Uygulamayı İndir
            </ComingSoonButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-64 bg-[#0a0e1a] p-8 pt-24 border-l border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                  }
                }}
                initial="hidden"
                animate="show"
                className="flex flex-col space-y-6 relative z-10"
              >
                {NAV_LINKS.map((item) => (
                  <motion.button
                    key={item.name}
                    variants={{
                      hidden: { x: 20, opacity: 0 },
                      show: { x: 0, opacity: 1 }
                    }}
                    onClick={() => scrollToSection(item.href)}
                    className="text-left text-lg font-medium text-white/70 hover:text-emerald-400 transition-colors border-b border-white/5 pb-2"
                  >
                    {item.name}
                  </motion.button>
                ))}

                <div className="pt-4">
                  <ComingSoonButton className="w-full text-center justify-center">
                    Uygulamayı İndir
                  </ComingSoonButton>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
