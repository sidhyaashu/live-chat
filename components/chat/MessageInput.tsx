'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Send, AlertCircle, RotateCcw } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

interface MessageInputProps {
    conversationId: Id<"conversations">;
}

export function MessageInput({ conversationId }: MessageInputProps) {
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lastFailedMsg, setLastFailedMsg] = useState<string | null>(null);
    const sendMessage = useMutation(api.messages.send);
    const updatePresence = useMutation(api.presence.updatePresence);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear typing indicator when input content changes
    useEffect(() => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (content.trim()) {
            updatePresence({ isOnline: true, isTyping: true, conversationId });
            typingTimeoutRef.current = setTimeout(() => {
                updatePresence({ isOnline: true, isTyping: false, conversationId });
            }, 2000);
        } else {
            updatePresence({ isOnline: true, isTyping: false, conversationId });
        }

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [content, conversationId, updatePresence]);

    // FIX: Clear typing indicator when component unmounts (navigating away)
    useEffect(() => {
        return () => {
            updatePresence({ isOnline: true, isTyping: false, conversationId });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    const doSend = async (msg: string) => {
        setError(null);
        setLastFailedMsg(null);
        try {
            await sendMessage({ conversationId, content: msg });
            updatePresence({ isOnline: true, isTyping: false, conversationId });
        } catch {
            setError('Failed to send message. Please try again.');
            setLastFailedMsg(msg);
            setContent(msg); // Restore original content
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = content.trim();
        if (!msg) return;
        setContent('');
        await doSend(msg);
    };

    const handleRetry = () => {
        if (!lastFailedMsg) return;
        const msg = lastFailedMsg;
        setContent('');
        doSend(msg);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            handleSubmit(e as any);
        }
    };

    return (
        <div className="border-t bg-white dark:bg-zinc-900">
            {/* Error banner with retry */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button
                        onClick={handleRetry}
                        className="flex items-center gap-1 underline underline-offset-2 hover:no-underline font-medium"
                    >
                        <RotateCcw className="h-3 w-3" /> Retry
                    </button>
                    <button onClick={() => setError(null)} className="ml-1 text-red-400 hover:text-red-600">✕</button>
                </div>
            )}
            <form onSubmit={handleSubmit} className="p-4 flex items-center gap-2">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    aria-label="Message input"
                />
                <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full transition disabled:opacity-50"
                    disabled={!content.trim()}
                    aria-label="Send message"
                >
                    <Send className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}
