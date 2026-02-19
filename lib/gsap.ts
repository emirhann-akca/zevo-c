'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register plugins once (client-side only)
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }
