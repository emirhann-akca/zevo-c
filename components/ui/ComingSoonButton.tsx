'use client'

import { useState } from 'react'
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface ComingSoonButtonProps extends HTMLMotionProps<"button"> {
    children: React.ReactNode
    comingSoonText?: React.ReactNode
    className?: string
    delay?: number
}

export default function ComingSoonButton({
    children,
    comingSoonText,
    className,
    delay = 2000,
    onClick,
    ...props
}: ComingSoonButtonProps) {
    const { t } = useLanguage()
    const textToShow = comingSoonText || t.nav.comingSoon
    const [isComingSoon, setIsComingSoon] = useState(false)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsComingSoon(true)
        setTimeout(() => setIsComingSoon(false), delay)
        if (onClick) onClick(e)
    }

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={cn(
                "px-6 py-3 gradient-primary text-white rounded-xl font-bold shadow-lg shadow-emerald-primary/30 min-w-[180px] flex items-center justify-center",
                className
            )}
            aria-label="Uygulamayı indir"
            {...props}
        >
            <AnimatePresence mode='wait'>
                {isComingSoon ? (
                    <motion.span
                        key="soon"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 whitespace-nowrap"
                    >
                        {textToShow}
                    </motion.span>
                ) : (
                    <motion.span
                        key="default"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 whitespace-nowrap"
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    )
}
