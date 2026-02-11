'use client'

import { useRef } from 'react'
import { useCanvasOptimization } from '@/hooks/useCanvasOptimization'

interface Orb {
    x: number
    y: number
    vx: number
    vy: number
    radius: number
    color: string
}

type BattleState = 'ROAM' | 'SEEK' | 'CLASH' | 'RETREAT'

export default function PvPBattleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // State managed via Refs
    const stateRef = useRef<{
        state: BattleState
        stateTimer: number
        clashFlash: number
        orbs: Orb[]
    }>({
        state: 'SEEK', // Start seeking/clashing immediately
        stateTimer: 0,
        clashFlash: 0,
        orbs: [
            { x: 0, y: 0, vx: 0, vy: 0, radius: 300, color: 'rgba(34, 197, 94, 0.46)' },
            { x: 0, y: 0, vx: 0, vy: 0, radius: 300, color: 'rgba(16, 185, 129, 0.46)' }
        ]
    })

    const ORB_RADIUS = 300
    const SPEED_ROAM = 2
    const SPEED_SEEK = 24 // Maximum aggression level
    const SPEED_RETREAT = 12

    // Cache for pre-rendered orbs to avoid gradient creation every frame
    const orbCacheRef = useRef<HTMLCanvasElement[]>([])

    // Helper to create cached orb sprite
    const createOrbSprite = (color: string, radius: number) => {
        const size = radius * 2
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return canvas

        const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius)
        gradient.addColorStop(0, color)
        gradient.addColorStop(1, 'rgba(0,0,0,0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(radius, radius, radius, 0, Math.PI * 2)
        ctx.fill()

        return canvas
    }

    useCanvasOptimization({
        canvasRef,
        fps: 30, // Locked to 30 FPS
        resolutionScale: 0.5, // 0.5x Resolution
        viewportOptions: { threshold: 0.15, rootMargin: "-50px 0px" },
        onResize: (width: number, height: number) => {
            // Reset positions on resize - spread them out
            const s = stateRef.current
            s.orbs[0].x = width * 0.1
            s.orbs[0].y = height * 0.5
            s.orbs[1].x = width * 0.9
            s.orbs[1].y = height * 0.5

            // Initialize Cache if needed
            if (orbCacheRef.current.length === 0) {
                orbCacheRef.current = [
                    createOrbSprite(s.orbs[0].color, s.orbs[0].radius),
                    createOrbSprite(s.orbs[1].color, s.orbs[1].radius)
                ]
            }
        },
        onAnimate: (ctx: CanvasRenderingContext2D, time: number) => {
            const width = ctx.canvas.width
            const height = ctx.canvas.height
            const s = stateRef.current
            const orbs = s.orbs

            // Logic Update
            s.stateTimer++

            const dx = orbs[1].x - orbs[0].x
            const dy = orbs[1].y - orbs[0].y
            const dist = Math.sqrt(dx * dx + dy * dy)

            switch (s.state) {
                case 'ROAM':
                    if (s.stateTimer > 85) { // Extremely short roam
                        s.state = 'SEEK'
                        s.stateTimer = 0
                    }
                    orbs.forEach(orb => {
                        orb.vx += (Math.random() - 0.5) * 0.2
                        orb.vy += (Math.random() - 0.5) * 0.2
                        const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy)
                        if (speed > SPEED_ROAM) {
                            orb.vx = (orb.vx / speed) * SPEED_ROAM
                            orb.vy = (orb.vy / speed) * SPEED_ROAM
                        }
                    })
                    break;
                case 'SEEK':
                    const angle = Math.atan2(dy, dx)
                    orbs[0].vx = Math.cos(angle) * SPEED_SEEK
                    orbs[0].vy = Math.sin(angle) * SPEED_SEEK
                    orbs[1].vx = -Math.cos(angle) * SPEED_SEEK
                    orbs[1].vy = -Math.sin(angle) * SPEED_SEEK
                    if (dist < 100) {
                        s.state = 'CLASH'
                        s.stateTimer = 0
                        s.clashFlash = 1.0
                    }
                    break;
                case 'CLASH':
                    if (s.stateTimer > 10) {
                        s.state = 'RETREAT'
                        s.stateTimer = 0
                    }
                    break;
                case 'RETREAT':
                    if (s.stateTimer > 22) { // Minimal retreat
                        s.state = 'ROAM'
                        s.stateTimer = 0
                    }
                    const retreatAngle = Math.atan2(dy, dx)
                    orbs[0].vx = -Math.cos(retreatAngle) * SPEED_RETREAT
                    orbs[0].vy = -Math.sin(retreatAngle) * SPEED_RETREAT
                    orbs[1].vx = Math.cos(retreatAngle) * SPEED_RETREAT
                    orbs[1].vy = Math.sin(retreatAngle) * SPEED_RETREAT
                    break;
            }

            if (s.state !== 'CLASH') {
                orbs.forEach(orb => {
                    orb.x += orb.vx
                    orb.y += orb.vy

                    // Strict Bounds Checking: Bounce back when hitting edges
                    if (orb.x < 0) {
                        orb.x = 0
                        orb.vx *= -1
                    } else if (orb.x > width) {
                        orb.x = width
                        orb.vx *= -1
                    }

                    if (orb.y < 0) {
                        orb.y = 0
                        orb.vy *= -1
                    } else if (orb.y > height) {
                        orb.y = height
                        orb.vy *= -1
                    }
                })
            }
            if (s.clashFlash > 0) s.clashFlash -= 0.05

            // Draw
            ctx.clearRect(0, 0, width, height)
            ctx.globalCompositeOperation = 'screen'

            orbs.forEach((orb, i) => {
                // Use cached sprite if available
                const sprite = orbCacheRef.current[i]
                if (sprite) {
                    ctx.drawImage(sprite, orb.x - orb.radius, orb.y - orb.radius)
                } else {
                    // Fallback (should ideally not happen after resize init)
                    const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius)
                    gradient.addColorStop(0, orb.color)
                    gradient.addColorStop(1, 'rgba(0,0,0,0)')
                    ctx.beginPath()
                    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)
                    ctx.fillStyle = gradient
                    ctx.fill()
                }
            })

            if (s.clashFlash > 0) {
                ctx.globalCompositeOperation = 'source-over'
                const centerX = (orbs[0].x + orbs[1].x) / 2
                const centerY = (orbs[0].y + orbs[1].y) / 2
                const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300)
                grad.addColorStop(0, `rgba(74, 222, 128, ${s.clashFlash})`)
                grad.addColorStop(0.4, `rgba(34, 197, 94, ${s.clashFlash * 0.5})`)
                grad.addColorStop(1, 'rgba(34, 197, 94, 0)')
                ctx.beginPath()
                ctx.arc(centerX, centerY, 300, 0, Math.PI * 2)
                ctx.fillStyle = grad
                ctx.fill()
            }
            ctx.globalCompositeOperation = 'source-over'
        }
    })

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen w-full h-full"
            style={{ zIndex: 0 }}
            aria-hidden="true"
        />
    )
}
