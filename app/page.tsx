'use client'

import Navigation from '@/components/layout/Navigation'
import HeroSection from '@/components/sections/HeroSection'
import Footer from '@/components/layout/Footer'
import dynamic from 'next/dynamic'
import SectionSkeleton from '@/components/ui/SectionSkeleton'

// ===== OPTIMIZED DYNAMIC IMPORTS =====
// - `ssr: false` for animation-heavy sections (reduces server bundle + prevents hydration mismatch)
// - `loading` shows lightweight skeleton while JS loads

const SectionLoader = () => <SectionSkeleton />
const TallSectionLoader = () => <SectionSkeleton height="min-h-screen" />

// Below-the-fold sections with lazy loading
const WhyZevo = dynamic(() => import('@/components/sections/WhyZevo'), { loading: TallSectionLoader })
const Features = dynamic(() => import('@/components/sections/Features'), { loading: TallSectionLoader })
const AIMotionSection = dynamic(() => import('@/components/sections/AIMotionSection'), { loading: TallSectionLoader, ssr: false })
const PvPArena = dynamic(() => import('@/components/sections/PvPArena'), { loading: TallSectionLoader })
const AICoach = dynamic(() => import('@/components/sections/AICoach'), { loading: SectionLoader, ssr: false })
const VisionNutrition = dynamic(() => import('@/components/sections/VisionNutrition'), { loading: TallSectionLoader, ssr: false })
const TeamClans = dynamic(() => import('@/components/sections/TeamClans'), { loading: TallSectionLoader })
const ScrollTextTransition = dynamic(() => import('@/components/effects/ScrollTextTransition'), { loading: SectionLoader, ssr: false })
const About = dynamic(() => import('@/components/sections/About'), { loading: SectionLoader })
const Team = dynamic(() => import('@/components/sections/Team'), { loading: SectionLoader })

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0e1a]">
      <Navigation />
      <HeroSection />
      <WhyZevo />
      <Features />
      <AIMotionSection />
      <PvPArena />
      <AICoach />
      <VisionNutrition />
      <TeamClans />
      <ScrollTextTransition />
      <About />
      <Team />
      <Footer />
    </main>
  )
}
