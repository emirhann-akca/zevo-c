import { useEffect, useRef, useState, useCallback } from 'react'

interface UseCanvasOptimizationOptions {
    canvasRef: React.RefObject<HTMLCanvasElement>
    onResize?: (width: number, height: number) => void
    onAnimate?: (ctx: CanvasRenderingContext2D, time: number) => void
    fps?: number // Target FPS, defaults to 30
    resolutionScale?: number // Resolution scale (0.1 to 1.0), defaults to 0.5
    viewportOptions?: IntersectionObserverInit // Custom intersection observer options
}

export function useCanvasOptimization({
    canvasRef,
    onResize,
    onAnimate,
    fps = 30,
    resolutionScale = 0.5,
    viewportOptions
}: UseCanvasOptimizationOptions) {
    const [isVisible, setIsVisible] = useState(false)
    const frameIdRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)
    const intervalRef = useRef<number>(1000 / fps)

    // Keep latest callback in a ref to avoid effect re-runs
    const animateCallbackRef = useRef(onAnimate)
    useEffect(() => {
        animateCallbackRef.current = onAnimate
    }, [onAnimate])

    const resizeCallbackRef = useRef(onResize)
    useEffect(() => {
        resizeCallbackRef.current = onResize
    }, [onResize])

    // Visibility Observer
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting)
            },
            viewportOptions || { threshold: 0 }
        )

        observer.observe(canvas)
        return () => observer.disconnect()
    }, [canvasRef, viewportOptions])

    // Resize Handler
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current
            if (!canvas) return

            // Get display size (CSS pixels)
            const { width, height } = canvas.getBoundingClientRect()

            // Set internal resolution (Physical pixels * scale)
            // We use Math.floor to avoid sub-pixel rendering issues
            // Cap pixel ratio at 1.5 for high DPI screens if resolutionScale is high, 
            // but since we default to 0.5, it usually results in 0.5 * dpr.
            // For background animations, simple 0.5 * width is mostly sufficient.

            const dpr = window.devicePixelRatio || 1
            // Limit dpr to 1.5 max for performance if we were doing high res, 
            // but with resolutionScale 0.5, we are effectively downsampling anyway.
            // Let's stick to simple width * scale logic for maximum performance.

            canvas.width = Math.floor(width * resolutionScale)
            canvas.height = Math.floor(height * resolutionScale)

            if (resizeCallbackRef.current) {
                resizeCallbackRef.current(canvas.width, canvas.height)
            }
        }

        window.addEventListener('resize', handleResize)
        // Delay initial resize slightly to ensure layout is ready
        const timer = setTimeout(handleResize, 0)

        return () => {
            window.removeEventListener('resize', handleResize)
            clearTimeout(timer)
        }
    }, [canvasRef, resolutionScale])

    // Animation Loop
    useEffect(() => {
        if (!isVisible) {
            cancelAnimationFrame(frameIdRef.current)
            return
        }

        const animate = (time: number) => {
            frameIdRef.current = requestAnimationFrame(animate)

            const elapsed = time - lastTimeRef.current

            if (elapsed > intervalRef.current) {
                lastTimeRef.current = time - (elapsed % intervalRef.current)

                const canvas = canvasRef.current
                if (!canvas) return

                const ctx = canvas.getContext('2d', {
                    alpha: true,
                    desynchronized: true // Hint to browser for low-latency
                })
                if (!ctx) return

                if (animateCallbackRef.current) {
                    animateCallbackRef.current(ctx, time)
                }
            }
        }

        frameIdRef.current = requestAnimationFrame(animate)

        return () => cancelAnimationFrame(frameIdRef.current)
    }, [isVisible, fps])

    return { isVisible }
}
