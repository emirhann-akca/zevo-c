'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const navItems = [
  { name: 'Anasayfa', href: '#performans' },
  { name: 'Özellikler', href: '#ozellikler' },
  { name: 'Hakkımızda', href: '#hakkimizda' },
  { name: 'Ekip', href: '#ekipler' },
]

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'glass-header border-b border-white/10 shadow-lg'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-emerald-primary/30">
                <span className="text-white font-bold text-lg">Z</span>
              </div>
              <span className="text-2xl font-bold text-white">ZEVO</span>
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => scrollToSection(item.href)}
                  className="text-text-muted hover:text-emerald-primary font-medium transition-colors"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item.name}
                </motion.button>
              ))}
            </div>

            {/* CTA Button - Desktop */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadClick}
              className="hidden md:block px-6 py-3 gradient-primary text-white rounded-xl font-bold shadow-lg shadow-emerald-primary/30 min-w-[180px]"
            >
              <AnimatePresence mode='wait'>
                {comingSoon ? (
                  <motion.span
                    key="soon"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Çok Yakında 🚀
                  </motion.span>
                ) : (
                  <motion.span
                    key="default"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    Uygulamayı İndir
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden w-10 h-10 flex items-center justify-center"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
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
              className="absolute right-0 top-0 bottom-0 w-64 bg-dark-secondary p-8 pt-24 border-l border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
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
                className="flex flex-col space-y-6"
              >
                {navItems.map((item) => (
                  <motion.button
                    key={item.name}
                    variants={{
                      hidden: { x: 20, opacity: 0 },
                      show: { x: 0, opacity: 1 }
                    }}
                    onClick={() => scrollToSection(item.href)}
                    className="text-left text-xl text-text-muted hover:text-emerald-primary transition-colors"
                  >
                    {item.name}
                  </motion.button>
                ))}

                <motion.button
                  variants={{
                    hidden: { x: 20, opacity: 0 },
                    show: { x: 0, opacity: 1 }
                  }}
                  onClick={handleDownloadClick}
                  className="px-6 py-3 gradient-primary text-white rounded-xl font-bold text-center shadow-lg shadow-emerald-primary/30 min-h-[50px] flex items-center justify-center"
                >
                  <AnimatePresence mode='wait'>
                    {comingSoon ? (
                      <motion.span
                        key="soon"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        Çok Yakında 🚀
                      </motion.span>
                    ) : (
                      <motion.span
                        key="default"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        Uygulamayı İndir
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
