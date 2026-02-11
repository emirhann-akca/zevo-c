'use client'

import { useRef } from 'react'
import { useCanvasOptimization } from '@/hooks/useCanvasOptimization'

// Configuration for optimization
const PARTICLE_COUNT = 75 // Fixed pool size (5x increase)
const SPEED_MODIFIER = 0.8 // Global speed multiplier

interface CircuitParticle {
    x: number
    y: number
    vx: number
    vy: number
    life: number
    maxLife: number
    color: string
    width: number
    active: boolean
    trail: { x: number, y: number }[]
}

export default function EnergyCircuitBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Object Pool - Created once and reused
    const poolRef = useRef<CircuitParticle[]>([])
    const initRef = useRef(false)

    // Initialize pool
    if (!initRef.current) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            poolRef.current.push({
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                life: 0,
                maxLife: 0,
                color: '#10b981',
                width: 1,
                active: false,
                trail: []
            })
        }
        initRef.current = true
    }

    const activateParticle = (p: CircuitParticle, width: number, height: number) => {
        // Reset particle state
        const edge = Math.floor(Math.random() * 4) // 0: top, 1: right, 2: bottom, 3: left

        // Position
        if (edge === 0) { // Top
            p.x = Math.random() * width
            p.y = -10
        } else if (edge === 1) { // Right
            p.x = width + 10
            p.y = Math.random() * height
        } else if (edge === 2) { // Bottom
            p.x = Math.random() * width
            p.y = height + 10
        } else { // Left
            p.x = -10
            p.y = Math.random() * height
        }

        // Calculate angle to center
        const centerX = width / 2
        const centerY = height / 2
        const angle = Math.atan2(centerY - p.y, centerX - p.x)

        // precise speed
        const speed = (Math.random() * 1.5 + 1.0) * SPEED_MODIFIER

        // Set velocity towards center
        p.vx = Math.cos(angle) * speed
        p.vy = Math.sin(angle) * speed

        p.life = 0
        p.maxLife = Math.random() * 100 + 80
        p.color = Math.random() > 0.8 ? '#ffffff' : '#10b981' // 20% white, 80% emerald
        p.width = Math.random() * 1.5 + 0.5
        p.active = true
        p.trail.length = 0 // Reuse array
    }

    useCanvasOptimization({
        canvasRef,
        fps: 30, // Cap at 30 FPS for performance
        resolutionScale: 0.5, // Half resolution rendering
        viewportOptions: { threshold: 0.15, rootMargin: "-50px 0px" },
        onAnimate: (ctx, time) => {
            const width = ctx.canvas.width
            const height = ctx.canvas.height
            const pool = poolRef.current

            ctx.clearRect(0, 0, width, height)

            // Spawn logic
            // Count active
            let activeCount = 0
            pool.forEach(p => { if (p.active) activeCount++ })

            if (activeCount < PARTICLE_COUNT && Math.random() < 0.4) {
                // Find inactive
                const inactive = pool.find(p => !p.active)
                if (inactive) {
                    activateParticle(inactive, width, height)
                }
            }

            // Update and Draw
            ctx.lineCap = 'round'

            for (let i = 0; i < pool.length; i++) {
                const p = pool[i]
                if (!p.active) continue

                // Update
                p.x += p.vx
                p.y += p.vy
                p.life++

                // Trail logic
                p.trail.push({ x: p.x, y: p.y })
                if (p.trail.length > 15) p.trail.shift() // Limit trail length

                // Kill conditions
                if (p.life > p.maxLife ||
                    (p.trail.length > 0 &&
                        (p.x < -50 || p.x > width + 50 || p.y < -50 || p.y > height + 50))) {
                    p.active = false
                    continue
                }

                // Draw
                if (p.trail.length < 2) continue

                ctx.beginPath()
                ctx.strokeStyle = p.color
                ctx.lineWidth = p.width
                // Fade out based on life
                const lifeOpacity = 1 - (p.life / p.maxLife)
                ctx.globalAlpha = lifeOpacity * 0.6 // Max opacity 0.6

                ctx.moveTo(p.trail[0].x, p.trail[0].y)
                for (let j = 1; j < p.trail.length; j++) {
                    ctx.lineTo(p.trail[j].x, p.trail[j].y)
                }
                ctx.stroke()
            }

            ctx.globalAlpha = 1
        },
        onResize: (width, height) => {
            // Kill all on resize to prevent off-screen particles
            poolRef.current.forEach(p => p.active = false)
        }
    })

    return (
        <canvas
            ref={canvasRef}
            id="features-energy-circuit"
            className="absolute inset-0 pointer-events-none opacity-60 w-full h-full"
            aria-hidden="true"
        />
    )
}
