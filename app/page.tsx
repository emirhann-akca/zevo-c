'use client'

import Navigation from '@/components/layout/Navigation'
import HeroSection from '@/components/sections/HeroSection'
import Footer from '@/components/layout/Footer'
import dynamic from 'next/dynamic'
import SectionSkeleton from '@/components/ui/SectionSkeleton'

const SectionLoader = () => <SectionSkeleton />
const TallSectionLoader = () => <SectionSkeleton height="min-h-screen" />

const WhyZevo = dynamic(() => import('@/components/sections/WhyZevo'), { loading: TallSectionLoader })
const Features = dynamic(() => import('@/components/sections/Features'), { loading: TallSectionLoader })
const AIMotionSection = dynamic(() => import('@/components/sections/AIMotionSection'), { loading: TallSectionLoader })
const PvPArena = dynamic(() => import('@/components/sections/PvPArena'), { loading: TallSectionLoader })
const AICoach = dynamic(() => import('@/components/sections/AICoach'), { loading: SectionLoader })
const VisionNutrition = dynamic(() => import('@/components/sections/VisionNutrition'), { loading: TallSectionLoader })
const TeamClans = dynamic(() => import('@/components/sections/TeamClans'), { loading: TallSectionLoader })
const ScrollTextTransition = dynamic(() => import('@/components/effects/ScrollTextTransition'), { loading: SectionLoader })
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
