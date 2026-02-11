// ================================
// Shared TypeScript Interfaces & Types
// ================================

import type { LucideIcon } from 'lucide-react'

/** Navigation link item */
export interface NavItem {
    name: string
    href: string
}

/** Feature card in Features section */
export interface Feature {
    id: number
    icon: LucideIcon
    title: string
    shortDescription: string
    detailedDescription: string
    benefits: string[]
    animation: 'fade' | 'slide' | 'scale' | 'rotate'
    layout: 'square' | 'full'
    targetSection?: string
}

/** Team member card */
export interface TeamMember {
    name: string
    role: string
    image: string
    social?: {
        github?: string
        linkedin?: string
        twitter?: string
    }
}

/** Stat display item */
export interface Stat {
    value: string
    label: string
    icon: LucideIcon
}

/** Common component props */
export interface BaseComponentProps {
    className?: string
    children?: React.ReactNode
}

/** Canvas optimization hook options */
export interface CanvasOptimizationOptions {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    onDraw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
    onInit?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
    maxFps?: number
    resolutionScale?: number
}
