'use client'

import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import AIMotionSection from '@/components/AIMotionSection'
import PvPArena from '@/components/PvPArena'
import Features from '@/components/Features'
import AICoach from '@/components/AICoach'
import VisionNutrition from '@/components/VisionNutrition'
import ScrollTextTransition from '@/components/ScrollTextTransition'
import WhyZevo from '@/components/WhyZevo'
import About from '@/components/About'
import Team from '@/components/Team'
import Footer from '@/components/Footer'

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
      <ScrollTextTransition />

      <About />
      <Team />
      <Footer />
    </main>
  )
}
