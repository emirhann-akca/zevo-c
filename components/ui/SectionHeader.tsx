'use client'

import { ReactNode } from 'react'

interface SectionHeaderProps {
    /** Icon component to display in the badge */
    icon?: ReactNode
    /** Badge text  */
    badge: string
    /** Main title — can include JSX for gradient text */
    title: ReactNode
    /** Optional description paragraph */
    description?: ReactNode
    /** Text alignment */
    align?: 'left' | 'center'
    /** Additional className for the wrapper */
    className?: string
}

/**
 * Reusable section header with badge, title, and description.
 * Used across AICoach, VisionNutrition, TeamClans, and similar sections.
 */
export default function SectionHeader({
    icon,
    badge,
    title,
    description,
    align = 'left',
    className = '',
}: SectionHeaderProps) {
    return (
        <div className={`${align === 'center' ? 'text-center' : ''} ${className}`}>
            {/* Badge */}
            <div
                className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-full mb-8 ${align === 'center' ? '' : ''
                    }`}
            >
                {icon && <div className="text-emerald-400">{icon}</div>}
                <span className="text-sm font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent uppercase tracking-wider">
                    {badge}
                </span>
            </div>

            {/* Title */}
            <h2
                className={`text-3xl lg:text-4xl xl:text-5xl font-extrabold text-white mb-4 leading-[1.1] ${align === 'center' ? '' : ''
                    }`}
            >
                {title}
            </h2>

            {/* Description */}
            {description && (
                <div
                    className={`text-base lg:text-lg text-white/60 mb-8 leading-relaxed ${align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-lg'
                        }`}
                >
                    {description}
                </div>
            )}
        </div>
    )
}
