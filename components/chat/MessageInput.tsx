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
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (content.trim() || imageFile) {
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
    }, [content, imageFile, conversationId, updatePresence]);

    useEffect(() => {
        return () => {
            updatePresence({ isOnline: true, isTyping: false, conversationId });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    // Focus input when reply changes
    useEffect(() => {
        if (replyTo) inputRef.current?.focus();
    }, [replyTo]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Only image files are supported.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5 MB.');
            return;
        }
        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const clearImage = () => {
        setImageFile(null);
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
    };

    const doSend = async (msg: string) => {
        setError(null);
        setLastFailedMsg(null);
        setIsUploading(true);
        try {
            let imageStorageId: Id<"_storage"> | undefined;

            if (imageFile) {
                const uploadUrl = await generateUploadUrl();
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': imageFile.type },
                    body: imageFile,
                });
                if (!response.ok) throw new Error('Image upload failed');
                const { storageId } = await response.json();
                imageStorageId = storageId;
            }

            await sendMessage({
                conversationId,
                content: msg,
                imageStorageId,
                replyToMessageId: replyTo?.id,
            });

            updatePresence({ isOnline: true, isTyping: false, conversationId });
            clearImage();
            onCancelReply?.();
        } catch {
            setError('Failed to send message. Please try again.');
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

    const canSend = (content.trim() || imageFile) && !isUploading;

    return (
        <div className="border-t border-border/60 bg-background/80 backdrop-blur-sm">
            {/* Reply preview */}
            {replyTo && (
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/40 border-b border-border/60">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">Replying to {replyTo.senderName}</p>
                        <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-muted rounded-full transition-all"
                        aria-label="Cancel reply"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
            )}

            {/* Image preview */}
            {imagePreview && (
                <div className="px-4 pt-3 flex items-start gap-2">
                    <div className="relative">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-20 w-20 rounded-xl object-cover border border-border shadow-sm"
                        />
                        <button
                            onClick={clearImage}
                            className="absolute -top-1.5 -right-1.5 bg-zinc-900 text-white rounded-full p-0.5 hover:bg-rose-600 transition-colors shadow"
                            aria-label="Remove image"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[160px]">{imageFile?.name}</span>
                    </div>
                </div>
            )}

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs border-b border-rose-200/50 dark:border-rose-900/30">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1">{error}</span>
                    {lastFailedMsg && (
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-1 underline underline-offset-2 hover:no-underline font-medium"
                        >
                            <RotateCcw className="h-3 w-3" /> Retry
                        </button>
                    )}
                    <button onClick={() => setError(null)} className="ml-1 hover:opacity-70">✕</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-3 flex items-center gap-2">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    aria-label="Attach image"
                />
                {/* Attach button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 hover:bg-muted rounded-xl transition-all text-muted-foreground hover:text-primary shrink-0 hover:scale-105"
                    aria-label="Attach image"
                    disabled={isUploading}
                >
                    <Paperclip className="h-5 w-5" />
                </button>

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={imageFile ? 'Add a caption...' : 'Type a message...'}
                    className="flex-1 bg-muted/50 border border-border/60 rounded-full px-5 py-2.5 focus:ring-2 focus:ring-primary/40 focus:border-primary/40 outline-none text-sm placeholder:text-muted-foreground/60 transition-all"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    aria-label="Message input"
                    disabled={isUploading}
                />

                {/* Send button */}
                <button
                    type="submit"
                    className={`p-2.5 rounded-full transition-all shrink-0 ${canSend
                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg hover:scale-110'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }`}
                    disabled={!canSend}
                    aria-label="Send message"
                >
                    {isUploading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </button>
            </form>
        </div>
    );
}
