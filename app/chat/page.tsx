'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

// --- Types ---
interface Message {
    role: 'user' | 'ai';
    content: string;
}

// --- Constants ---
const SUGGESTIONS = [
    "Antrenman planı oluştur",
    "Beslenme analizi yap",
    "Gelişim raporumu göster",
    "Form düzeltme öner"
];

const HISTORY_ITEMS = [
    "Squat form analizi",
    "Haftalık beslenme planı",
    "Kardiyo programı"
];

export default function ChatPage() {
    // --- State ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Refs ---
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // --- Effects ---

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '24px'; // Reset height
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    // --- Build history for API ---
    const buildApiHistory = useCallback((msgs: Message[]) => {
        return msgs.map(m => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            content: m.content,
        }));
    }, []);

    // --- Handlers ---

    const handleSendMessage = useCallback(async (text: string = input) => {
        if (!text.trim() || isStreaming) return;

        setError(null);

        // Add user message
        const userMessage: Message = { role: 'user', content: text.trim() };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsStreaming(true);

        // Prepare AI placeholder message
        const aiPlaceholder: Message = { role: 'ai', content: '' };
        setMessages(prev => [...prev, aiPlaceholder]);

        // Abort controller for cancellation
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text.trim(),
                    history: buildApiHistory(messages), // previous messages (before this one)
                    streaming: true,
                }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Hata: ${response.status}`);
            }

            if (!response.body) {
                throw new Error('Streaming yanıt alınamadı.');
            }

            // Read SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process SSE lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    try {
                        const jsonStr = trimmed.slice(6); // Remove "data: "
                        const parsed = JSON.parse(jsonStr);

                        if (parsed.type === 'chunk' && parsed.content) {
                            accumulatedContent += parsed.content;
                            // Update AI message with accumulated content
                            setMessages(prev => {
                                const updated = [...prev];
                                const lastIdx = updated.length - 1;
                                if (lastIdx >= 0 && updated[lastIdx].role === 'ai') {
                                    updated[lastIdx] = { ...updated[lastIdx], content: accumulatedContent };
                                }
                                return updated;
                            });
                        } else if (parsed.type === 'error') {
                            throw new Error(parsed.message || 'AI yanıt hatası');
                        }
                        // 'done' type: stream ended naturally
                    } catch (parseErr) {
                        // Skip malformed SSE lines
                        if (parseErr instanceof SyntaxError) continue;
                        throw parseErr;
                    }
                }
            }

            // If no content was received, show fallback
            if (!accumulatedContent.trim()) {
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === 'ai') {
                        updated[lastIdx] = { ...updated[lastIdx], content: 'Yanıt alınamadı. Lütfen tekrar deneyin.' };
                    }
                    return updated;
                });
            }

        } catch (err: any) {
            if (err.name === 'AbortError') {
                // User cancelled — remove empty AI message
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === 'ai' && !updated[lastIdx].content) {
                        updated.pop();
                    }
                    return updated;
                });
            } else {
                const errorMsg = err.message || 'Beklenmeyen bir hata oluştu.';
                setError(errorMsg);
                // Update AI message with error
                setMessages(prev => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === 'ai') {
                        updated[lastIdx] = { ...updated[lastIdx], content: `⚠️ ${errorMsg}` };
                    }
                    return updated;
                });
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [input, isStreaming, messages, buildApiHistory]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleStopStreaming = () => {
        abortControllerRef.current?.abort();
    };

    // --- Components ---

    const Sidebar = () => (
        <div className={`
      fixed top-0 left-0 h-screen w-[260px] bg-[#050b14] border-r border-white/[0.04] p-4 z-40
      transition-transform duration-200 ease-in-out
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
      shadow-2xl shadow-black/50
    `}>
            {/* Top Part - Logo */}
            <div className="flex items-center gap-3">
                <Image
                    src="/zevo-logo-dark.png"
                    alt="ZEVO Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                    priority
                />
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-white tracking-tight leading-none">ZEVO</span>
                    <span className="text-[10px] text-[#10DC78]/60 font-medium tracking-widest uppercase leading-none mt-0.5">AI Coach</span>
                </div>
            </div>

            <button
                onClick={() => {
                    setMessages([]);
                    setIsStreaming(false);
                    setError(null);
                    abortControllerRef.current?.abort();
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className="mt-6 w-full py-2.5 px-3 flex items-center gap-3 text-sm text-white/80 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg transition-colors group border border-white/[0.02]"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 group-hover:text-[#10DC78] transition-colors">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Yeni Sohbet
            </button>

            {/* History */}
            <div className="mt-8">
                <h3 className="text-[11px] uppercase tracking-wider text-white/30 font-medium mb-2 px-2">Bugün</h3>
                <div className="space-y-1">
                    {HISTORY_ITEMS.map((item, i) => (
                        <div
                            key={i}
                            className="px-3 py-2 text-sm text-white/50 hover:text-white/90 hover:bg-white/[0.03] rounded-lg transition-colors cursor-pointer truncate"
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-4 border-t border-white/[0.04] bg-[#050b14]">
                <a href="/" className="flex items-center gap-2 text-xs text-white/40 hover:text-[#10DC78] transition-colors">
                    <span>←</span> Ana Sayfa
                </a>
            </div>
        </div>
    );

    const MobileHeader = () => (
        <div className="lg:hidden fixed top-4 left-4 z-50">
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-white/60 hover:text-white transition-colors p-2 bg-[#0A1628]/50 backdrop-blur-md rounded-lg border border-white/10"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isSidebarOpen ? (
                        <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
                    ) : (
                        <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
                    )}
                </svg>
            </button>
        </div>
    );

    const MessageBubble = ({ msg }: { msg: Message }) => {
        const isUser = msg.role === 'user';
        const content = isUser ? msg.content : (
            <div className="whitespace-pre-line">
                {msg.content.split('\n').map((line, i) => {
                    if (line.trim().startsWith('•')) {
                        return (
                            <div key={i} className="flex items-start pl-1 mb-1">
                                <span className="mr-2 text-[#10DC78]">•</span>
                                <span>{line.trim().substring(1).trim()}</span>
                            </div>
                        );
                    }
                    // Bold text formatting (**text**)
                    if (line.includes('**')) {
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        return (
                            <span key={i}>
                                {parts.map((part, j) => {
                                    if (part.startsWith('**') && part.endsWith('**')) {
                                        return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
                                    }
                                    return <span key={j}>{part}</span>;
                                })}
                                {'\n'}
                            </span>
                        );
                    }
                    return <span key={i}>{line}{'\n'}</span>;
                })}
            </div>
        );

        return (
            <div
                className="py-6 border-b border-white/[0.04] animate-[fadeIn_0.4s_ease-out] flex"
                style={{
                    animationFillMode: 'forwards',
                    animation: 'fadeIn 0.4s ease-out, slideUp 0.4s ease-out'
                }}
            >
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {isUser ? (
                        <div className="w-8 h-8 rounded-full bg-[#10DC78]/20 flex items-center justify-center border border-[#10DC78]/30 shadow-[0_0_15px_rgba(16,220,120,0.1)]">
                            <span className="text-xs font-bold text-[#10DC78]">S</span>
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center border border-white/[0.06]">
                            <span className="text-xs font-bold text-[#10DC78]">Z</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={`ml-4 text-[15px] leading-relaxed ${isUser ? 'text-white/95' : 'text-white/80'}`}>
                    {content}
                </div>

                <style jsx>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(8px); } to { transform: translateY(0); } }
        `}</style>
            </div>
        );
    };

    const TypingIndicator = () => (
        <div className="py-6 border-b border-white/[0.04] flex animate-[fadeIn_0.4s_ease-out]">
            <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center border border-white/[0.06]">
                    <span className="text-xs font-bold text-[#10DC78]">Z</span>
                </div>
            </div>
            <div className="ml-4 flex items-center gap-1 h-8">
                <div className="w-1.5 h-1.5 bg-[#10DC78]/40 rounded-full animate-[typingBounce_0.6s_infinite_ease-in-out_0s]"></div>
                <div className="w-1.5 h-1.5 bg-[#10DC78]/60 rounded-full animate-[typingBounce_0.6s_infinite_ease-in-out_0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-[#10DC78]/80 rounded-full animate-[typingBounce_0.6s_infinite_ease-in-out_0.3s]"></div>
            </div>
        </div>
    );

    // Check if the last AI message is still empty (waiting for first chunk)
    const isWaitingForFirstChunk = isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'ai' && !messages[messages.length - 1].content;

    return (
        <div className="min-h-screen bg-[#0A1628] text-white font-sans subpixel-antialiased selection:bg-[#10DC78] selection:text-[#0A1628] overflow-hidden">

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#10DC78] opacity-[0.03] blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#0EA968] opacity-[0.02] blur-[120px]"></div>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar />
            <MobileHeader />

            <main className="lg:ml-[260px] min-h-screen relative flex flex-col z-10">
                {messages.length === 0 ? (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20 fade-in-up">
                        <div className="mb-10 text-center relative">
                            <div className="absolute -inset-10 bg-[#10DC78] opacity-[0.05] blur-3xl rounded-full pointer-events-none"></div>
                                    {/* Logo in empty state */}
                            <div className="mb-6 mx-auto">
                                <Image
                                    src="/zevo-logo-dark.png"
                                    alt="ZEVO Logo"
                                    width={80}
                                    height={80}
                                    className="rounded-2xl drop-shadow-[0_0_30px_rgba(16,220,120,0.25)]"
                                    priority
                                />
                            </div>
                            <h1 className="text-3xl md:text-5xl lg:text-[56px] font-bold text-white tracking-tight leading-tight drop-shadow-lg">
                                Merhaba
                            </h1>
                            <h2 className="text-3xl md:text-5xl lg:text-[56px] font-bold text-white/20 tracking-tight leading-tight">
                                Sana nasıl yardımcı olabilirim?
                            </h2>
                        </div>

                        {/* Error Banner */}
                        {error && (
                            <div className="w-full max-w-2xl mx-auto mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="w-full max-w-2xl mx-auto mb-6">
                            <div className="bg-[#121b2e]/80 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden flex items-end shadow-lg transition-all focus-within:border-[#10DC78]/50 focus-within:ring-1 focus-within:ring-[#10DC78]/20">
                                <textarea
                                    ref={textareaRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Mesajınızı yazın..."
                                    className="w-full bg-transparent text-[15px] text-white/90 placeholder:text-white/30 placeholder:normal-case resize-none outline-none border-none py-4 px-5 min-h-[56px] max-h-[120px]"
                                    rows={1}
                                />
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={isStreaming}
                                    className={`
                      mr-3 mb-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                      ${input.trim() && !isStreaming ? 'bg-[#10DC78] text-[#0A1628] shadow-[0_0_15px_rgba(16,220,120,0.4)] hover:bg-[#0EA968] transform hover:scale-105' : 'bg-white/[0.05] text-white/20'}
                    `}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"></line>
                                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Chips */}
                        <div className="flex flex-wrap gap-2.5 justify-center max-w-2xl">
                            {SUGGESTIONS.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(chip)}
                                    disabled={isStreaming}
                                    className="text-[13px] font-medium text-white/60 bg-white/[0.03] border border-white/[0.08] rounded-full px-5 py-2.5 hover:border-[#10DC78]/50 hover:text-[#10DC78] hover:bg-[#10DC78]/5 transition-all cursor-pointer backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Active State */
                    <>
                        <div className="flex-1 max-w-3xl w-full mx-auto pt-8 pb-24 lg:pb-40 px-4">
                            {messages.map((msg, idx) => {
                                // Hide empty AI message while waiting for first chunk (TypingIndicator shows instead)
                                if (msg.role === 'ai' && !msg.content && isStreaming) return null;
                                return <MessageBubble key={idx} msg={msg} />;
                            })}
                            {isWaitingForFirstChunk && <TypingIndicator />}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Fixed Input Bar */}
                        <div className="fixed bottom-0 lg:left-[260px] left-0 right-0 p-6 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/95 to-transparent z-20">
                            <div className="max-w-3xl w-full mx-auto">
                                {/* Error Banner */}
                                {error && (
                                    <div className="mb-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                                <div className="bg-[#121b2e]/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] overflow-hidden flex items-end shadow-2xl shadow-black/20 focus-within:border-[#10DC78]/40 transition-colors">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Mesajınızı yazın..."
                                        className="w-full bg-transparent text-[15px] text-white/90 placeholder:text-white/30 placeholder:normal-case resize-none outline-none border-none py-4 px-5 min-h-[56px] max-h-[120px]"
                                        rows={1}
                                        autoFocus
                                    />
                                    {isStreaming ? (
                                        <button
                                            onClick={handleStopStreaming}
                                            className="mr-3 mb-3 w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
                                            title="Yanıtı durdur"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="6" width="12" height="12" rx="2" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSendMessage()}
                                            className={`
                            mr-3 mb-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                            ${input.trim() ? 'bg-[#10DC78] text-[#0A1628] shadow-[0_0_15px_rgba(16,220,120,0.4)] hover:bg-[#0EA968] transform hover:scale-105' : 'bg-white/[0.05] text-white/20'}
                          `}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <div className="text-[11px] text-white/20 text-center mt-3 font-medium tracking-wide">
                                    ZEVO AI · Gemini 2.0 Flash ile güçlendirildi
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
