'use client'

import { useRef } from 'react'
import { useCanvasOptimization } from '@/hooks/useCanvasOptimization'

interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    color: string
}

export default function ConnectedPointsBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    // Use refs for mouse position to access in animation loop without re-renders
    const mouseRef = useRef({ x: -1000, y: -1000 })

    const CONNECTION_DISTANCE = 100
    const MOUSE_DISTANCE = 100
    const frameCountRef = useRef(0)

    useCanvasOptimization({
        canvasRef,
        fps: 30,
        resolutionScale: 0.5,
        viewportOptions: { threshold: 0.15, rootMargin: "-50px 0px" },
        onResize: (width, height) => {
            // Dynamic particle count based on internal width (scaled)
            // TechBackground uses width / 20. We use width / 30 for slightly fewer particles + larger connections.
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
            const particleCount = Math.floor(width / (isMobile ? 50 : 30))

            particlesRef.current = []

            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2 + 1,
                    color: i % 2 === 0 ? '#10b981' : '#34d399' // Emerald-500 : Emerald-400
                })
            }
        },
        onAnimate: (ctx, time) => {
            const width = ctx.canvas.width
            const height = ctx.canvas.height
            const particles = particlesRef.current

            frameCountRef.current++
            const shouldUpdateMouse = frameCountRef.current % 3 === 0

            ctx.clearRect(0, 0, width, height)

            // Update and draw particles
            particles.forEach((p, i) => {
                // Movement
                p.x += p.vx
                p.y += p.vy

                // Bounce off edges
                if (p.x < 0 || p.x > width) p.vx *= -1
                if (p.y < 0 || p.y > height) p.vy *= -1

                // Mouse interaction - Throttled
                if (shouldUpdateMouse) {
                    const mx = mouseRef.current.x * 0.5
                    const my = mouseRef.current.y * 0.5

                    if (mx > -100 && my > -100) { // Only calculate if mouse is active
                        const dx = p.x - mx
                        const dy = p.y - my
                        const distance = Math.sqrt(dx * dx + dy * dy)

                        if (distance < MOUSE_DISTANCE) {
                            const angle = Math.atan2(dy, dx)
                            const force = (MOUSE_DISTANCE - distance) / MOUSE_DISTANCE
                            const push = force * 1.5
                            p.x += Math.cos(angle) * push
                            p.y += Math.sin(angle) * push
                        }
                    }
                }

                // Draw particle
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color + '80'
                ctx.fill()

                // Draw connections
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j]
                    const dx = p.x - p2.x
                    const dy = p.y - p2.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist < CONNECTION_DISTANCE) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(74, 222, 128, ${1 - dist / CONNECTION_DISTANCE})`
                        ctx.lineWidth = 1
                        ctx.moveTo(p.x, p.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.stroke()
                    }
                }
            })
        }
    })

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
            mouseRef.current.x = e.clientX - rect.left
            mouseRef.current.y = e.clientY - rect.top
        }
    }

    const handleMouseLeave = () => {
        mouseRef.current.x = -1000
        mouseRef.current.y = -1000
    }

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-auto"
            style={{ opacity: 0.6 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            aria-hidden="true"
        />
    )
}
