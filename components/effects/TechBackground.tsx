'use client'

import { useRef } from 'react'
import { useCanvasOptimization } from '@/hooks/useCanvasOptimization'

// Drop class defined outside the component to avoid re-creation on every render
class Drop {
    x: number
    y: number
    speed: number
    length: number
    opacity: number
    width: number
    height: number

    constructor(w: number, h: number) {
        this.width = w
        this.height = h
        this.x = Math.random() * w
        this.y = Math.random() * h - h
        this.speed = Math.random() * 2 + 0.5
        this.length = Math.random() * 20 + 5
        this.opacity = Math.random() * 0.5 + 0.1
    }

    update() {
        this.y += this.speed
        if (this.y > this.height) {
            this.y = -this.length
            this.x = Math.random() * this.width
            this.speed = Math.random() * 2 + 0.5
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.globalAlpha = this.opacity
        ctx.strokeStyle = '#10dc78'
        ctx.lineWidth = 1.5
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(this.x, this.y + this.length)
        ctx.stroke()
        ctx.globalAlpha = 1.0
    }
}

export default function TechBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const dropsRef = useRef<Drop[]>([])

    useCanvasOptimization({
        canvasRef,
        fps: 30, // Limit to 30 FPS
        resolutionScale: 0.5, // Render at half resolution
        viewportOptions: { threshold: 0.15, rootMargin: "-50px 0px" },
        onResize: (width: number, height: number) => {
            // Re-populate drops on resize
            dropsRef.current = []
            // Adjust density for lower resolution - one drop per 20px (account for resolution scale if used in calc, but width here is internal)
            // If internal width is 960 (1920*0.5), we want density relative to visual width?
            // Actually density per pixel should be similar.
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
            const dropCount = Math.floor(width / (isMobile ? 35 : 20))
            for (let i = 0; i < dropCount; i++) {
                dropsRef.current.push(new Drop(width, height))
            }
        },
        onAnimate: (ctx: CanvasRenderingContext2D, time: number) => {
            const width = ctx.canvas.width
            const height = ctx.canvas.height

            ctx.clearRect(0, 0, width, height)

            dropsRef.current.forEach(drop => {
                drop.update()
                drop.draw(ctx)
            })
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
