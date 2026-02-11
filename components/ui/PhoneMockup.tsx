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
        <div className={`relative flex justify-center ${className}`}>
            {/* Decorative glow */}
            <div
                className="absolute -inset-8 rounded-[50px] opacity-30"
                style={{
                    background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)`,
                }}
            />

            {/* Phone Container */}
            <div className="relative w-[260px] h-[540px]">
                {/* Phone Frame */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3rem] shadow-[0_0_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden">
                    {/* Inner Screen */}
                    <div className="absolute inset-[8px] bg-[#0f172a] rounded-[2.5rem] overflow-hidden">
                        {/* Top Notch */}
                        <div className="absolute top-0 inset-x-0 h-8 bg-black rounded-b-2xl w-36 mx-auto z-50" />

                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 to-transparent z-40 flex items-center justify-between px-8">
                            <span className="text-[10px] text-white/80 font-medium">9:41</span>
                            <div className="flex gap-1.5 items-center">
                                <div className="w-3.5 h-2 border border-white/60 rounded-sm relative">
                                    <div
                                        className="absolute inset-[1px] bg-emerald-400 rounded-[1px]"
                                        style={{ width: '70%' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Screen Content */}
                        {children}
                    </div>

                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full z-50" />
                </div>
            </div>
        </div>
    )
}
