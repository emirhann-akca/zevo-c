"use client";
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ScrollTextTransition() {
    const containerRef = useRef<HTMLDivElement>(null);
    const text1Ref = useRef<HTMLHeadingElement>(null);
    const text2Ref = useRef<HTMLHeadingElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const flashRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top top",
                    end: "+=2000", // Shorter distance = feels like one scroll
                    pin: true,
                    scrub: 1,
                    anticipatePin: 1,
                }
            });

            // --- TEXT 1: "Sporun Yeni Yüzyılı" ---
            // Faster fade in/out, almost no hold
            tl.fromTo(text1Ref.current,
                { opacity: 0, scale: 0.85, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 1, ease: "power2.out" }
            );
            tl.to(text1Ref.current,
                { opacity: 0, y: -60, duration: 0.5, ease: "power2.in" },
                "+=0.2" // Short hold
            );

            // --- TEXT 2: "ZEVO" ---
            // Starts appearing while first text is leaving
            tl.fromTo(text2Ref.current,
                { opacity: 0, scale: 0.5, y: 40 },
                { opacity: 1, scale: 1, y: 0, duration: 1, ease: "power2.out" },
                "-=0.5"
            );

            // THE ZOOM: Happens immediately after text 2 fully appears
            tl.to(text2Ref.current, {
                scale: 20,
                opacity: 0,
                duration: 2.5,
                ease: "power3.in",
            }, "+=0.1");

            // CIRCULAR REVEAL: starts mid-zoom
            tl.to(overlayRef.current, {
                scale: 1,
                duration: 0.625,
                ease: "power2.inOut",
            }, "-=0.625");

            // Change section bg to match, eliminating edge seam
            tl.to(containerRef.current, {
                backgroundColor: "#0A1628",
                duration: 0.5,
                ease: "power2.inOut",
            }, "-=0.625");

            // Brief white flash at transition moment
            tl.to(flashRef.current, {
                opacity: 0.3,
                duration: 0.3,
                ease: "power2.in",
            }, "-=1.5");
            tl.to(flashRef.current, {
                opacity: 0,
                duration: 0.5,
                ease: "power2.out",
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <>
            {/* Gradient bridge from VisionNutrition (#0a0e1a) to black */}
            <div
                style={{
                    width: "100%",
                    height: "200px",
                    background: "linear-gradient(to bottom, #0a0e1a 0%, #000000 100%)",
                    position: "relative",
                    zIndex: 1,
                }}
            />

            <section
                ref={containerRef}
                style={{
                    height: "100vh",
                    width: "100%",
                    backgroundColor: "#000000",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Text 1: Sporun Yeni Yüzyılı */}
                <h2
                    ref={text1Ref}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        opacity: 0,
                        color: "#ffffff",
                        fontSize: "clamp(36px, 6vw, 100px)",
                        fontWeight: 900,
                        textAlign: "center",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        whiteSpace: "nowrap",
                        willChange: "transform, opacity",
                        zIndex: 10,
                    }}
                >
                    Sporun Yeni Yüzyılı
                </h2>

                {/* Text 2: ZEVO — emerald-to-cyan gradient */}
                <h2
                    ref={text2Ref}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        opacity: 0,
                        fontSize: "clamp(60px, 12vw, 200px)",
                        fontWeight: 900,
                        textAlign: "center",
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        willChange: "transform, opacity",
                        zIndex: 10,
                        background: "linear-gradient(135deg, #10DC78 0%, #34d399 25%, #14b8a6 50%, #06b6d4 75%, #10DC78 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                >
                    ZEVO
                </h2>

                {/* Circular reveal overlay */}
                <div
                    ref={overlayRef}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "300vmax",
                        height: "300vmax",
                        borderRadius: "50%",
                        backgroundColor: "#0A1628",
                        transform: "translate(-50%, -50%) scale(0)",
                        zIndex: 5,
                        pointerEvents: "none",
                    }}
                />

                {/* Brief flash overlay */}
                <div
                    ref={flashRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#ffffff",
                        opacity: 0,
                        zIndex: 15,
                        pointerEvents: "none",
                        mixBlendMode: "overlay",
                    }}
                />
            </section>
        </>
    );
}
