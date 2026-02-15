'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface ChatSession {
    id: string
    title: string
    messages: ChatMessage[]
    createdAt: number
    updatedAt: number
}

export interface ChatMessage {
    role: 'user' | 'ai'
    content: string
}

const STORAGE_KEY = 'zevo-chat-sessions'
const MAX_SESSIONS = 50
const TITLE_MAX_LENGTH = 40

function generateId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function generateTitle(firstMessage: string): string {
    const clean = firstMessage.trim()
    if (clean.length <= TITLE_MAX_LENGTH) return clean
    return clean.slice(0, TITLE_MAX_LENGTH - 3) + '...'
}

function loadSessions(): ChatSession[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
    } catch { return [] }
}

function saveSessions(sessions: ChatSession[]): void {
    if (typeof window === 'undefined') return
    try {
        const trimmed = sessions.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_SESSIONS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch { }
}

export function useChatHistory() {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true
        setSessions(loadSessions())
    }, [])

    const activeSession = sessions.find(s => s.id === activeSessionId) || null
    const messages = activeSession?.messages || []

    const createSession = useCallback((): string => {
        const newSession: ChatSession = {
            id: generateId(), title: 'Yeni Sohbet', messages: [],
            createdAt: Date.now(), updatedAt: Date.now(),
        }
        setSessions(prev => { const updated = [newSession, ...prev]; saveSessions(updated); return updated })
        setActiveSessionId(newSession.id)
        return newSession.id
    }, [])

    const addMessage = useCallback((msg: ChatMessage) => {
        setSessions(prev => {
            let targetId = activeSessionId
            if (!targetId) {
                const newSession: ChatSession = {
                    id: generateId(),
                    title: msg.role === 'user' ? generateTitle(msg.content) : 'Yeni Sohbet',
                    messages: [msg], createdAt: Date.now(), updatedAt: Date.now(),
                }
                const updated = [newSession, ...prev]
                saveSessions(updated)
                setTimeout(() => setActiveSessionId(newSession.id), 0)
                return updated
            }
            const updated = prev.map(session => {
                if (session.id !== targetId) return session
                const newMessages = [...session.messages, msg]
                const title = session.messages.length === 0 && msg.role === 'user'
                    ? generateTitle(msg.content) : session.title
                return { ...session, title, messages: newMessages, updatedAt: Date.now() }
            })
            saveSessions(updated)
            return updated
        })
    }, [activeSessionId])

    const updateLastMessage = useCallback((content: string) => {
        setSessions(prev => {
            const updated = prev.map(session => {
                if (session.id !== activeSessionId) return session
                if (session.messages.length === 0) return session
                const newMessages = [...session.messages]
                const lastIdx = newMessages.length - 1
                if (newMessages[lastIdx].role === 'ai') {
                    newMessages[lastIdx] = { ...newMessages[lastIdx], content }
                }
                return { ...session, messages: newMessages, updatedAt: Date.now() }
            })
            saveSessions(updated)
            return updated
        })
    }, [activeSessionId])

    const switchSession = useCallback((sessionId: string) => { setActiveSessionId(sessionId) }, [])

    const deleteSession = useCallback((sessionId: string) => {
        setSessions(prev => { const updated = prev.filter(s => s.id !== sessionId); saveSessions(updated); return updated })
        if (activeSessionId === sessionId) setActiveSessionId(null)
    }, [activeSessionId])

    const clearActive = useCallback(() => { setActiveSessionId(null) }, [])

    const groupedSessions = (() => {
        const today = new Date().setHours(0, 0, 0, 0)
        const yesterday = today - 86_400_000
        const weekAgo = today - 7 * 86_400_000
        const groups: { label: string; sessions: ChatSession[] }[] = [
            { label: 'Bugün', sessions: [] }, { label: 'Dün', sessions: [] },
            { label: 'Bu Hafta', sessions: [] }, { label: 'Daha Eski', sessions: [] },
        ]
        sessions.sort((a, b) => b.updatedAt - a.updatedAt).forEach(s => {
            if (s.updatedAt >= today) groups[0].sessions.push(s)
            else if (s.updatedAt >= yesterday) groups[1].sessions.push(s)
            else if (s.updatedAt >= weekAgo) groups[2].sessions.push(s)
            else groups[3].sessions.push(s)
        })
        return groups.filter(g => g.sessions.length > 0)
    })()

    return {
        sessions, activeSession, activeSessionId, messages, groupedSessions,
        createSession, addMessage, updateLastMessage, switchSession, deleteSession, clearActive,
    }
}
