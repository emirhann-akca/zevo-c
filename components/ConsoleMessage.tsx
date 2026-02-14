'use client'

import { useEffect, useRef } from 'react'

export default function ConsoleMessage() {
    const hasRun = useRef(false)

    useEffect(() => {
        if (hasRun.current) return
        hasRun.current = true

        console.log(
            "%c ZEVO %c by Hasan Server Kamber ",
            "background: #10DC78; color: #0a0e1a; border-radius: 4px; padding: 4px 8px; font-weight: 900; font-size: 14px;",
            "background: #0a0e1a; color: #10DC78; border-radius: 4px; padding: 4px 8px; font-weight: 600; font-size: 12px; border: 1px solid #10DC78;"
        )
        console.log(
            "%c Kodları kurcalamayı seviyorsun galiba? Aramıza hoş geldin! 🚀",
            "color: #22C55E; font-size: 12px; padding: 4px 0;"
        )
    }, [])

    return null
}
