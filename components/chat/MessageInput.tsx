'use client';

import { useState, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Send, AlertCircle, RotateCcw, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { Id } from '@/convex/_generated/dataModel';

interface ReplyTo {
    id: Id<"messages">;
    senderName: string;
    content: string;
}

interface MessageInputProps {
    conversationId: Id<"conversations">;
    replyTo?: ReplyTo | null;
    onCancelReply?: () => void;
}

export function MessageInput({ conversationId, replyTo, onCancelReply }: MessageInputProps) {
    const [content, setContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lastFailedMsg, setLastFailedMsg] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const sendMessage = useMutation(api.messages.send);
    const updatePresence = useMutation(api.presence.updatePresence);
    const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    /* Typing indicator ─────────────────────────────────────────────────────── */
    useEffect(() => {
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        if (content.trim() || imageFile) {
            updatePresence({ isOnline: true, isTyping: true, conversationId });
            typingTimeout.current = setTimeout(() =>
                updatePresence({ isOnline: true, isTyping: false, conversationId }), 2000);
        } else {
            updatePresence({ isOnline: true, isTyping: false, conversationId });
        }
        return () => { if (typingTimeout.current) clearTimeout(typingTimeout.current); };
    }, [content, imageFile, conversationId, updatePresence]);

    useEffect(() => () => {
        updatePresence({ isOnline: true, isTyping: false, conversationId });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    useEffect(() => { if (replyTo) inputRef.current?.focus(); }, [replyTo]);

    /* Image helpers ────────────────────────────────────────────────────────── */
    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Only image files are supported.'); return; }
        if (file.size > 5 * 1024 * 1024) { setError('Image must be less than 5 MB.'); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const clearImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
    };

    /* Send ─────────────────────────────────────────────────────────────────── */
    const doSend = async (msg: string) => {
        setError(null);
        setLastFailedMsg(null);
        setIsUploading(true);
        try {
            let imageStorageId: Id<"_storage"> | undefined;

            if (imageFile) {
                const uploadUrl = await generateUploadUrl();
                const res = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': imageFile.type },
                    body: imageFile,
                });
                if (!res.ok) throw new Error('Upload failed');
                const { storageId } = await res.json();
                imageStorageId = storageId;
            }

            await sendMessage({ conversationId, content: msg, imageStorageId, replyToMessageId: replyTo?.id });
            updatePresence({ isOnline: true, isTyping: false, conversationId });
            clearImage();
            onCancelReply?.();
        } catch {
            setError('Failed to send. Please try again.');
            setLastFailedMsg(msg);
            setContent(msg);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = content.trim();
        if (!msg && !imageFile) return;
        setContent('');
        await doSend(msg);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e as any);
    };

    const canSend = (content.trim().length > 0 || imageFile !== null) && !isUploading;

    return (
        <div className="border-t border-border bg-card">

            {/* ── Reply strip ─────────────────────────────────────────────── */}
            {replyTo && (
                <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-muted/40">
                    <div className="w-0.5 self-stretch bg-primary rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">Replying to {replyTo.senderName}</p>
                        <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                        aria-label="Cancel reply"
                    >
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                </div>
            )}

            {/* ── Image preview ────────────────────────────────────────────── */}
            {imagePreview && (
                <div className="flex items-start gap-3 px-4 pt-3 pb-1">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-16 w-16 rounded-md object-cover border border-border"
                        />
                        <button
                            onClick={clearImage}
                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-foreground text-background flex items-center justify-center"
                            aria-label="Remove"
                        >
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {imageFile?.name}
                    </span>
                </div>
            )}

            {/* ── Error banner ────────────────────────────────────────────── */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-1.5 bg-destructive/5 border-b border-destructive/20 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{error}</span>
                    {lastFailedMsg && (
                        <button onClick={() => { setContent(''); doSend(lastFailedMsg); }} className="underline flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" /> Retry
                        </button>
                    )}
                    <button onClick={() => setError(null)} className="opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* ── Input row ────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileSelect}
                />
                {/* Attach */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-8 w-8 rounded-md border border-border bg-muted hover:bg-secondary flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
                    aria-label="Attach image"
                >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Text input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={imageFile ? 'Add a caption…' : 'Type a message…'}
                    disabled={isUploading}
                    aria-label="Message"
                    className="flex-1 h-8 px-3 py-0 text-sm bg-muted border border-border rounded-md placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-shadow disabled:opacity-50"
                />

                {/* Send */}
                <button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send"
                    className={`h-8 px-3 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 shrink-0 ${canSend
                            ? 'bg-primary text-primary-foreground hover:opacity-90'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                >
                    {isUploading
                        ? <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <><Send className="h-3.5 w-3.5" /><span className="hidden sm:inline">Send</span></>
                    }
                </button>
            </form>
        </div>
    );
}
