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

    // Clear typing indicator when input content changes
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

    // Clear typing indicator when navigating away
    useEffect(() => {
        return () => {
            updatePresence({ isOnline: true, isTyping: false, conversationId });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

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
        // Clear file input so same file can be re-selected
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

    return (
        <div className="border-t bg-white dark:bg-zinc-900">
            {/* Reply preview banner */}
            {replyTo && (
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
                    <div className="flex-1 border-l-2 border-primary pl-2 min-w-0">
                        <p className="text-xs font-semibold text-primary truncate">Replying to {replyTo.senderName}</p>
                        <p className="text-xs text-zinc-500 truncate">{replyTo.content}</p>
                    </div>
                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition"
                        aria-label="Cancel reply"
                    >
                        <X className="h-4 w-4 text-zinc-400" />
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
                            className="h-20 w-20 rounded-lg object-cover border"
                        />
                        <button
                            onClick={clearImage}
                            className="absolute -top-1.5 -right-1.5 bg-zinc-800 text-white rounded-full p-0.5 hover:bg-red-600 transition"
                            aria-label="Remove image"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[160px]">{imageFile?.name}</span>
                    </div>
                </div>
            )}

            {/* Error banner with retry */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs">
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
                    <button onClick={() => setError(null)} className="ml-1 text-red-400 hover:text-red-600">✕</button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 flex items-center gap-2">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    aria-label="Attach image"
                />
                {/* Paperclip button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 shrink-0"
                    aria-label="Attach image"
                    disabled={isUploading}
                >
                    <Paperclip className="h-5 w-5" />
                </button>

                <input
                    type="text"
                    placeholder={imageFile ? 'Add a caption...' : 'Type a message...'}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    aria-label="Message input"
                    disabled={isUploading}
                />
                <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full transition disabled:opacity-50 shrink-0"
                    disabled={(!content.trim() && !imageFile) || isUploading}
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
