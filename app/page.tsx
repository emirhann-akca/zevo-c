'use client'

import Navigation from '@/components/layout/Navigation'
import HeroSection from '@/components/sections/HeroSection'
import Footer from '@/components/layout/Footer'
import dynamic from 'next/dynamic'

const WhyZevo = dynamic(() => import('@/components/sections/WhyZevo'))
const Features = dynamic(() => import('@/components/sections/Features'))
const AIMotionSection = dynamic(() => import('@/components/sections/AIMotionSection'))
const PvPArena = dynamic(() => import('@/components/sections/PvPArena'))
const AICoach = dynamic(() => import('@/components/sections/AICoach'))
const VisionNutrition = dynamic(() => import('@/components/sections/VisionNutrition'))
const TeamClans = dynamic(() => import('@/components/sections/TeamClans'))
const ScrollTextTransition = dynamic(() => import('@/components/effects/ScrollTextTransition'))
const About = dynamic(() => import('@/components/sections/About'))
const Team = dynamic(() => import('@/components/sections/Team'))

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
