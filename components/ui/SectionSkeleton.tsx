'use client'

export default function SectionSkeleton({ height = 'min-h-[60vh]' }: { height?: string }) {
    return (
        <div className={`${height} w-full bg-[#0a0e1a] flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-3 h-3 bg-emerald-500/30 rounded-full animate-pulse" />
                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full w-1/3 bg-emerald-500/20 rounded-full"
                        style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
                    />
                </div>
            </div>
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
        </div>
    )
}
