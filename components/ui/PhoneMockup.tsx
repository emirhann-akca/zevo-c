'use client'

import { ReactNode } from 'react'

interface PhoneMockupProps {
    /** Content rendered inside the phone screen */
    children: ReactNode
    /** Optional glow color for the decorative backdrop (CSS color value) */
    glowColor?: string
    /** Additional className for the outer wrapper */
    className?: string
}

/**
 * Reusable phone mockup shell used across VisionNutrition, TeamClans,
 * and similar sections. Provides consistent frame, notch, status bar,
 * and home indicator. Children are rendered inside the inner screen.
 */
export default function PhoneMockup({
    children,
    glowColor = 'rgba(16, 220, 120, 0.2)',
    className = '',
}: PhoneMockupProps) {
    return (
        <div className={`relative overflow-visible flex justify-center ${className}`}>
            {/* Decorative glow - POSITIONED BEHIND */}
            <div
                className="absolute -inset-12 z-0 rounded-[60px] opacity-40 blur-xl"
                style={{
                    background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)`,
                }}
            />

            {/* Phone Container - CLIPS CONTENT */}
            <div className="relative z-10 w-[260px] h-[540px]">
                {/* Phone Frame */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden">
                    {/* Inner Screen */}
                    <div className="absolute inset-[8px] bg-[#0f172a] rounded-[2.5rem] overflow-hidden">
                        {/* Top Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-7 bg-black rounded-b-2xl w-32 z-50" />

                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-12 z-40 flex items-center justify-between px-6 pt-2">
                            <span className="text-[10px] text-white/80 font-medium">9:41</span>
                            <div className="flex gap-1.5 items-center">
                                <div className="w-4 h-2.5 bg-white/20 rounded-sm" />
                                <div className="w-4 h-2.5 bg-white/20 rounded-sm" />
                                <div className="w-5 h-2.5 border border-white/60 rounded-sm relative">
                                    <div className="absolute inset-[1px] bg-white rounded-[1px]" />
                                </div>
                            </div>
                        </div>

                        {/* Screen Content */}
                        <div className="relative w-full h-full overflow-hidden">
                            {children}
                        </div>
                    </div>
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-50 pointer-events-none" />
            </div>
        </div>
    )
}
