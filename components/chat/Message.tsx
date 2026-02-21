'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Trash2, SmilePlus, Reply, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { formatMessageTime } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ReactionData = {
    _id: Id<"reactions">;
    emoji: string;
    userId: Id<"users">;
};

type ReplyPreview = {
    senderName: string;
    content: string;
    imageStorageId?: string;
};

type LinkPreview = {
    url: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
};

type MessageProps = {
    id: Id<"messages">;
    content: string;
    senderId: Id<"users">;
    senderName: string;
    senderImage: string;
    isMe: boolean;
    type: 'text' | 'system';
    deleted: boolean;
    createdAt: number;
    reactions: ReactionData[];
    currentUserId: Id<"users">;
    isGroup: boolean;
    imageStorageId?: Id<"_storage">;
    replyToMessage?: ReplyPreview | null;
    linkPreview?: LinkPreview | null;
    otherUserLastReadTime?: number;
    onReply?: (msg: { id: Id<"messages">; senderName: string; content: string }) => void;
};

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

function ImageBubble({ storageId }: { storageId: Id<"_storage"> }) {
    const url = useQuery(api.messages.getImageUrl, { storageId });
    if (url === undefined) return (
        <div className="h-40 w-48 rounded-2xl bg-muted animate-pulse" />
    );
    if (!url) return null;
    return (
        <img
            src={url}
            alt="Attachment"
            className="max-h-60 max-w-[240px] rounded-2xl object-cover cursor-pointer hover:opacity-90 transition shadow-sm"
            onClick={() => window.open(url, '_blank')}
        />
    );
}

export function Message({
    id, content, senderName, senderImage, isMe, type, deleted,
    createdAt, reactions, currentUserId, isGroup, imageStorageId,
    replyToMessage, linkPreview, otherUserLastReadTime, onReply,
}: MessageProps) {
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);
    const removeMessage = useMutation(api.messages.remove);
    const toggleReaction = useMutation(api.reactions.toggleReaction);

    useEffect(() => {
        if (!showPicker) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPicker]);

    // ── System message ─────────────────────────────────────────────────────────
    if (type === 'system') {
        return (
            <div className="flex items-center justify-center my-3 px-4">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[11px] text-muted-foreground/70 text-center px-3 py-1 bg-muted/50 rounded-full mx-2 whitespace-nowrap shrink-0 font-medium">
                    {content}
                    <span className="ml-2 opacity-50">{formatMessageTime(createdAt)}</span>
                </span>
                <div className="h-px flex-1 bg-border/50" />
            </div>
        );
    }

    // ── Count reactions ────────────────────────────────────────────────────────
    const reactionCounts = reactions.reduce<Record<string, { count: number; isMine: boolean }>>(
        (acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = { count: 0, isMine: false };
            acc[r.emoji].count++;
            if (r.userId === currentUserId) acc[r.emoji].isMine = true;
            return acc;
        },
        {}
    );

    // ── Read receipt status ────────────────────────────────────────────────────
    const isRead = isMe && otherUserLastReadTime !== undefined && otherUserLastReadTime > 0 && otherUserLastReadTime > createdAt;

    return (
        <div className={`flex gap-2.5 group mb-2 ${isMe ? 'flex-row-reverse' : ''} items-end`}>
            {/* Avatar */}
            {!isMe && (
                <img
                    src={senderImage || '/placeholder-user.png'}
                    alt={senderName}
                    className="h-7 w-7 rounded-full object-cover shrink-0 mb-1 ring-1 ring-border"
                />
            )}

            {/* Bubble + meta */}
            <div className={`flex flex-col gap-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Sender name in groups */}
                {!isMe && isGroup && (
                    <span className="text-[11px] font-semibold text-primary/80 px-1">{senderName}</span>
                )}

                {/* ACTION TOOLBAR */}
                {!deleted && (
                    <div className={`flex items-center gap-1 mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isMe ? 'flex-row-reverse' : ''}`}>
                        {onReply && (
                            <button
                                onClick={() => onReply({ id, senderName, content })}
                                className="p-1.5 bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-sm hover:bg-accent hover:border-primary/30 transition-all"
                                aria-label="Reply"
                            >
                                <Reply className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                        <div className="relative" ref={pickerRef}>
                            <button
                                onClick={() => setShowPicker(v => !v)}
                                className="p-1.5 bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-sm hover:bg-accent hover:border-primary/30 transition-all"
                                aria-label="Add reaction"
                            >
                                <SmilePlus className="h-3 w-3 text-muted-foreground" />
                            </button>
                            {showPicker && (
                                <div className={`absolute top-full mt-1 ${isMe ? 'right-0' : 'left-0'} bg-white dark:bg-zinc-800 border border-border rounded-2xl shadow-xl p-2 flex gap-1 z-20`}>
                                    {EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => {
                                                toggleReaction({ messageId: id, emoji });
                                                setShowPicker(false);
                                            }}
                                            className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-muted"
                                            aria-label={`React with ${emoji}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {isMe && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button
                                        className="p-1.5 bg-white dark:bg-zinc-800 border border-border rounded-lg shadow-sm hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-900/20 transition-all"
                                        aria-label="Delete message"
                                    >
                                        <Trash2 className="h-3 w-3 text-rose-400" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this message?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This message will be marked as deleted for everyone. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => removeMessage({ messageId: id })}
                                            className="bg-rose-600 hover:bg-rose-700 text-white"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                )}

                {/* Reply preview */}
                {replyToMessage && !deleted && (
                    <div className={`px-2.5 py-1.5 rounded-xl border-l-2 border-primary/50 bg-muted/60 text-xs max-w-full ${isMe ? 'text-right border-l-0 border-r-2' : 'text-left'}`}>
                        <p className="font-semibold text-primary/70 truncate">{replyToMessage.senderName}</p>
                        <p className="text-muted-foreground truncate">
                            {replyToMessage.imageStorageId ? '📷 Image' : replyToMessage.content}
                        </p>
                    </div>
                )}

                {/* Message bubble */}
                <div className={`px-4 py-2.5 rounded-2xl text-sm break-words leading-relaxed shadow-sm ${isMe
                    ? 'bubble-sent text-white rounded-br-sm'
                    : 'bg-white dark:bg-zinc-800 border border-border/60 rounded-bl-sm'
                    } ${deleted ? 'opacity-50' : ''}`}>
                    {deleted ? (
                        <span className="italic text-xs flex items-center gap-1.5 opacity-70">
                            <Trash2 className="h-3 w-3" /> This message was deleted
                        </span>
                    ) : (
                        <>
                            {imageStorageId && (
                                <div className={content ? 'mb-2' : ''}>
                                    <ImageBubble storageId={imageStorageId} />
                                </div>
                            )}
                            {content && <span>{content}</span>}
                        </>
                    )}
                </div>

                {/* Link Preview Card */}
                {linkPreview && !deleted && (
                    <a
                        href={linkPreview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block max-w-[280px] rounded-2xl border overflow-hidden transition-all hover:shadow-md ${isMe
                            ? 'bg-white/10 border-white/20 hover:bg-white/20'
                            : 'bg-white dark:bg-zinc-800 border-border/60 hover:border-primary/30'
                            }`}
                    >
                        {linkPreview.image && (
                            <img
                                src={linkPreview.image}
                                alt={linkPreview.title || 'Link preview'}
                                className="w-full h-32 object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        )}
                        <div className="p-3">
                            {linkPreview.siteName && (
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isMe ? 'text-white/60' : 'text-primary/70'}`}>
                                    {linkPreview.siteName}
                                </p>
                            )}
                            {linkPreview.title && (
                                <p className={`text-xs font-semibold line-clamp-2 leading-snug ${isMe ? 'text-white' : 'text-foreground'}`}>
                                    {linkPreview.title}
                                </p>
                            )}
                            {linkPreview.description && (
                                <p className={`text-[11px] line-clamp-2 mt-1 ${isMe ? 'text-white/70' : 'text-muted-foreground'}`}>
                                    {linkPreview.description}
                                </p>
                            )}
                            <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'text-white/50' : 'text-muted-foreground/70'}`}>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                <span className="text-[10px] truncate">
                                    {linkPreview.url.replace(/^https?:\/\//, '').split('/')[0]}
                                </span>
                            </div>
                        </div>
                    </a>
                )}

                {/* Reactions */}
                {Object.entries(reactionCounts).length > 0 && (
                    <div className="flex flex-wrap gap-1 px-1">
                        {Object.entries(reactionCounts).map(([emoji, data]) => (
                            <button
                                key={emoji}
                                onClick={() => toggleReaction({ messageId: id, emoji })}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all hover:scale-105 ${data.isMine
                                    ? 'bg-primary/15 border-primary/40 text-primary font-semibold'
                                    : 'bg-white dark:bg-zinc-800 border-border/60 hover:bg-muted'
                                    }`}
                                aria-label={`${emoji} ${data.count}`}
                            >
                                <span>{emoji}</span>
                                <span className="font-medium">{data.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp + Read Receipt */}
                <div className={`flex items-center gap-1 px-1 mt-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] text-muted-foreground/60">{formatMessageTime(createdAt)}</span>
                    {isMe && !deleted && (
                        isRead
                            ? <CheckCheck className="h-3 w-3 text-indigo-500" aria-label="Read" />
                            : <Check className="h-3 w-3 text-muted-foreground/50" aria-label="Sent" />
                    )}
                </div>
            </div>
        </div>
    );
}
