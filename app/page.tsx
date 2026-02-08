'use client'

import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import PvPArena from '@/components/PvPArena'
import Features from '@/components/Features'
import AICoach from '@/components/AICoach'
import VisionNutrition from '@/components/VisionNutrition'
import WhyZevo from '@/components/WhyZevo'
import About from '@/components/About'
import Team from '@/components/Team'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <PvPArena />
      <Features />
      <AICoach />
      <VisionNutrition />
      <WhyZevo />
      <About />
      <Team />
      <Footer />
    </main>
  )
}
