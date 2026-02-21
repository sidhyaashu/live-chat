'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Trash2, SmilePlus, Reply, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { formatMessageTime } from '@/lib/utils';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type ReactionData = { _id: Id<"reactions">; emoji: string; userId: Id<"users"> };
type ReplyPreview = { senderName: string; content: string; imageStorageId?: string };
type LinkPreview = { url: string; title?: string; description?: string; image?: string; siteName?: string };

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
    if (url === undefined) return <div className="h-40 w-48 rounded-md bg-muted animate-pulse" />;
    if (!url) return null;
    return (
        <img
            src={url}
            alt="Attachment"
            className="max-h-60 max-w-[240px] rounded-md object-cover cursor-pointer hover:opacity-90 transition border border-border"
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
    const removeMsg = useMutation(api.messages.remove);
    const toggleReact = useMutation(api.reactions.toggleReaction);

    useEffect(() => {
        if (!showPicker) return;
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
                setShowPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPicker]);

    /* ── System message ─────────────────────────────────────────────────────── */
    if (type === 'system') {
        return (
            <div className="flex items-center gap-3 my-4 px-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground px-3 py-0.5 rounded-full border border-border bg-muted whitespace-nowrap">
                    {content}
                </span>
                <div className="flex-1 h-px bg-border" />
            </div>
        );
    }

    /* ── Reaction count map ─────────────────────────────────────────────────── */
    const counts = reactions.reduce<Record<string, { count: number; isMine: boolean }>>(
        (acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = { count: 0, isMine: false };
            acc[r.emoji].count++;
            if (r.userId === currentUserId) acc[r.emoji].isMine = true;
            return acc;
        }, {}
    );

    const isRead = isMe && otherUserLastReadTime !== undefined && otherUserLastReadTime > 0 && otherUserLastReadTime > createdAt;

    return (
        <div className={`flex group gap-2 px-4 py-1 ${isMe ? 'flex-row-reverse' : ''} items-end`}>

            {/* Avatar */}
            {!isMe && (
                <img
                    src={senderImage || '/placeholder-user.png'}
                    alt={senderName}
                    className="h-7 w-7 rounded-full object-cover border border-border shrink-0 mb-1"
                />
            )}

            {/* Column */}
            <div className={`flex flex-col gap-0.5 max-w-[68%] ${isMe ? 'items-end' : 'items-start'}`}>

                {/* Sender label in groups */}
                {!isMe && isGroup && (
                    <span className="text-[11px] font-semibold text-primary ml-1 mb-0.5">{senderName}</span>
                )}

                {/* Toolbar — visible on hover */}
                {!deleted && (
                    <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        {onReply && (
                            <ActionBtn onClick={() => onReply({ id, senderName, content })} title="Reply">
                                <Reply className="h-3 w-3" />
                            </ActionBtn>
                        )}
                        <div className="relative" ref={pickerRef}>
                            <ActionBtn onClick={() => setShowPicker(v => !v)} title="React">
                                <SmilePlus className="h-3 w-3" />
                            </ActionBtn>
                            {showPicker && (
                                <div className={`absolute top-full mt-1 z-20 ${isMe ? 'right-0' : 'left-0'} bg-card border border-border rounded-lg shadow-lg p-1.5 flex gap-0.5`}>
                                    {EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => { toggleReact({ messageId: id, emoji }); setShowPicker(false); }}
                                            className="text-base hover:scale-110 transition-transform p-1 rounded hover:bg-muted"
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
                                    <button className="h-6 w-6 rounded border border-border bg-card text-muted-foreground hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5 flex items-center justify-center transition-colors">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete message?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This cannot be undone. The message will appear as deleted for everyone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => removeMsg({ messageId: id })}
                                            className="bg-destructive hover:bg-destructive/90 text-white"
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
                    <div className={`text-xs px-3 py-1.5 rounded-md border-l-2 border-primary bg-muted max-w-full mb-1 ${isMe ? 'border-l-0 border-r-2 text-right' : 'text-left'}`}>
                        <p className="font-semibold text-primary truncate">{replyToMessage.senderName}</p>
                        <p className="text-muted-foreground truncate">
                            {replyToMessage.imageStorageId ? '📎 Image' : replyToMessage.content}
                        </p>
                    </div>
                )}

                {/* Bubble */}
                <div className={`
                    text-sm leading-relaxed px-3 py-2 rounded-md break-words
                    ${isMe ? 'bubble-sent rounded-br-none' : 'bg-card border border-border rounded-bl-none text-foreground'}
                    ${deleted ? 'opacity-50' : ''}
                `}>
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
                            {content}
                        </>
                    )}
                </div>

                {/* Link Preview — same solid card for both sides so text is always readable */}
                {linkPreview && !deleted && (
                    <a
                        href={linkPreview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-1 block max-w-[280px] rounded-md border border-border bg-card overflow-hidden transition-colors hover:bg-muted/50 ${isMe ? 'border-l-2 border-l-primary' : ''
                            }`}
                    >
                        {linkPreview.image && (
                            <img
                                src={linkPreview.image}
                                alt={linkPreview.title || ''}
                                className="w-full h-28 object-cover border-b border-border"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        )}
                        <div className="p-3">
                            {linkPreview.siteName && (
                                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1 text-muted-foreground">
                                    {linkPreview.siteName}
                                </p>
                            )}
                            {linkPreview.title && (
                                <p className="text-xs font-medium line-clamp-2 text-foreground">
                                    {linkPreview.title}
                                </p>
                            )}
                            {linkPreview.description && (
                                <p className="text-[11px] line-clamp-2 mt-0.5 text-muted-foreground">
                                    {linkPreview.description}
                                </p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                                <span className="text-[10px] truncate">
                                    {linkPreview.url.replace(/^https?:\/\//, '').split('/')[0]}
                                </span>
                            </div>
                        </div>
                    </a>
                )}

                {/* Reactions */}
                {Object.keys(counts).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(counts).map(([emoji, data]) => (
                            <button
                                key={emoji}
                                onClick={() => toggleReact({ messageId: id, emoji })}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${data.isMine
                                    ? 'bg-accent/60 border-primary text-primary'
                                    : 'bg-muted border-border hover:bg-secondary'
                                    }`}
                            >
                                {emoji}<span className="font-medium">{data.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp + read receipt */}
                <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] text-muted-foreground/70">{formatMessageTime(createdAt)}</span>
                    {isMe && !deleted && (
                        isRead
                            ? <CheckCheck className="h-3 w-3 text-primary" />
                            : <Check className="h-3 w-3 text-muted-foreground/40" />
                    )}
                </div>
            </div>
        </div>
    );
}

function ActionBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="h-6 w-6 rounded border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 flex items-center justify-center transition-colors"
        >
            {children}
        </button>
    );
}
